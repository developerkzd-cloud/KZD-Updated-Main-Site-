/* ==========================================================================
   KZD Admin — EMPLOYEES

   PAYLOAD: STAYS CUSTOM. This is an HR workflow tied to the applicant
   pipeline, not site content: details, documents, leave, and the bridge that
   converts an accepted applicant into an employee record
   (convertApplicantToEmployee, linked back by fromApplicationId). Payload's
   admin will not provide that flow, so these screens stay hand-built. The
   rest of the admin map is in js/kzd-admin.js.

   The other half of the careers pipeline: once someone accepts an offer they
   become a record here rather than disappearing at the end of the applicant
   funnel. convertApplicantToEmployee() in js/kzd-store.js is the bridge, and
   `fromApplicationId` is what keeps the link back to the original application.

   Leave entitlement is read from Settings (store.getSettings), never a literal
   in this file — see the TODO on SETTINGS_DEFAULTS.
   ========================================================================== */

import {
  store, el, svg, ICONS, kebabIcon, fmtDate, fmtSize, initials,
  mountShell, toast, errorBlock, skeletonRows, confirmDialog, modal
} from "./kzd-admin.js";
import { openApplicant } from "./kzd-admin-applicant.js";

const STATUS_LABEL = {
  active: "Active", leave: "On leave", probation: "Probation", exited: "Exited"
};

const LEAVE_TYPES = ["Annual", "Sick", "Family responsibility"];
const DOC_TYPES = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
const DOC_MAX = 5 * 1024 * 1024;

let shell, page;
let employees = [];
let settings = null;
let filter = "all";

/* --------------------------------------------------------------------------
   Small builders
   -------------------------------------------------------------------------- */

function statusChip(status) {
  return el("span", `kzd-ad__chip kzd-ad__chip--emp-${status}`, (STATUS_LABEL[status] || status).toUpperCase());
}

function viaCareersTag(emp, onOpen) {
  const t = el("button", "kzd-ad__via", "VIA CAREERS");
  t.type = "button";
  t.title = "Opens the original application";
  t.setAttribute("aria-label", `Open the original application for ${emp.firstName} ${emp.lastName}`);
  t.addEventListener("click", (e) => { e.stopPropagation(); onOpen(); });
  return t;
}

function pair(label, value) {
  const d = el("div");
  d.appendChild(el("span", "kzd-ad__pair-label", label));
  d.appendChild(el("span", "kzd-ad__pair-value" + (value ? "" : " kzd-ad__pair-value--empty"), value || "—"));
  return d;
}

function fullName(e) { return `${e.firstName} ${e.lastName}`.trim(); }

function departments() {
  return [...new Set(employees.map((e) => e.department).filter(Boolean))].sort();
}

/* --------------------------------------------------------------------------
   Stat cards — every value derived
   -------------------------------------------------------------------------- */

function nextProbationReview() {
  const dates = employees
    .filter((e) => e.status === "probation" && e.probationEnds)
    .map((e) => e.probationEnds)
    .sort();
  return dates[0] ? `Review due ${fmtDate(dates[0])}` : "None pending";
}

function nextReturn() {
  const dates = employees
    .filter((e) => e.status === "leave" && e.leaveReturn)
    .map((e) => e.leaveReturn)
    .sort();
  return dates[0] ? `Back ${fmtDate(dates[0])}` : "Nobody out";
}

function buildStats() {
  const wrap = el("div", "kzd-ad__stats");
  const total = employees.length;
  const probation = employees.filter((e) => e.status === "probation").length;
  const onLeave = employees.filter((e) => e.status === "leave").length;
  const viaCareers = employees.filter((e) => e.fromApplicationId).length;
  const deps = departments().length;

  [
    { label: "Employees", value: total, note: `Across ${deps} department${deps === 1 ? "" : "s"}`,
      accent: "#2F6FED", tint: "#E0EAFD", icon: ICONS.users, go: "all" },
    { label: "On probation", value: probation, note: nextProbationReview(),
      accent: "#7E56D6", tint: "#F0EBFC", icon: ICONS.badge, go: null },
    { label: "On leave today", value: onLeave, note: nextReturn(),
      accent: "#D6961E", tint: "#FDF3DE", icon: ICONS.brief, go: null },
    { label: "Hired from careers", value: viaCareers,
      note: total ? `${Math.round((viaCareers / total) * 100)}% of the team` : "No employees yet",
      accent: "#149CA0", tint: "#E0F6F7", icon: ICONS.users, go: null }
  ].forEach((c) => {
    const b = el("button", "kzd-ad__stat");
    b.type = "button";
    b.style.setProperty("--stat-accent", c.accent);
    b.style.setProperty("--stat-tint", c.tint);

    const row = el("div", "kzd-ad__stat-row");
    const tile = el("span", "kzd-ad__stat-icon");
    tile.appendChild(svg(c.icon));
    row.appendChild(tile);
    const t = el("div");
    t.appendChild(el("p", "kzd-ad__stat-label", c.label));
    t.appendChild(el("p", "kzd-ad__stat-value", String(c.value)));
    row.appendChild(t);
    b.appendChild(row);
    b.appendChild(el("p", "kzd-ad__stat-note", c.note));
    b.addEventListener("click", () => { filter = "all"; render(); });
    wrap.appendChild(b);
  });
  return wrap;
}

/* --------------------------------------------------------------------------
   Row menu
   -------------------------------------------------------------------------- */

function rowMenu(anchor, emp) {
  document.querySelector(".kzd-ad__menu[data-rowmenu]")?.remove();
  const menu = el("div", "kzd-ad__menu");
  menu.dataset.rowmenu = "1";
  menu.setAttribute("role", "menu");
  menu.style.position = "fixed";
  menu.style.zIndex = "200";

  const add = (label, fn, danger) => {
    const b = el("button", danger ? "is-danger" : null, label);
    b.type = "button";
    b.setAttribute("role", "menuitem");
    b.addEventListener("click", () => { menu.remove(); fn(); });
    menu.appendChild(b);
  };

  add("View", () => openEmployee(emp.id));
  add("Edit", () => openEmployee(emp.id, { tab: "details", edit: true }));
  add("Manage leave", () => openEmployee(emp.id, { tab: "leave" }));
  add("Start offboarding", () => offboard(emp), true);

  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.top = `${Math.min(r.bottom + 6, window.innerHeight - menu.offsetHeight - 10)}px`;
  menu.style.left = `${Math.max(10, r.right - menu.offsetWidth)}px`;

  const close = (e) => {
    if (e && menu.contains(e.target)) return;
    menu.remove();
    document.removeEventListener("mousedown", close);
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => { if (e.key === "Escape") { close(); anchor.focus(); } };
  setTimeout(() => { document.addEventListener("mousedown", close); document.addEventListener("keydown", onKey); }, 0);
  menu.querySelector("button")?.focus();
}

async function offboard(emp) {
  const ok = await confirmDialog({
    title: "Start offboarding?",
    body: `${fullName(emp)} will be marked as exited and removed from the active headcount. Their record and documents are kept.`,
    confirmLabel: "Start offboarding"
  });
  if (!ok) return;
  try {
    await store.setEmployeeStatus(emp.id, "exited", { exitDate: new Date().toISOString().slice(0, 10) });
    toast(`${fullName(emp)} marked as exited.`);
    await reload();
  } catch (err) { toast(`Could not update. ${err.message}`, { error: true }); }
}

/* --------------------------------------------------------------------------
   Sorting
   -------------------------------------------------------------------------- */

const SORTS = {
  employee:   (a, b) => fullName(a).localeCompare(fullName(b)),
  role:       (a, b) => String(a.role || "").localeCompare(String(b.role || "")),
  department: (a, b) => String(a.department || "").localeCompare(String(b.department || "")),
  started:    (a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")),
  status:     (a, b) => String(a.status || "").localeCompare(String(b.status || ""))
};

let sortKey = "started";
let sortDir = "asc";

/* --------------------------------------------------------------------------
   Render
   -------------------------------------------------------------------------- */

function visible() {
  let list = employees.slice();
  if (filter !== "all") list = list.filter((e) => e.department === filter);
  const cmp = SORTS[sortKey];
  list.sort((a, b) => (sortDir === "asc" ? cmp(a, b) : -cmp(a, b)));
  return list;
}

function render() {
  page.textContent = "";
  page.appendChild(buildStats());

  const deps = departments();
  shell.setSubtitle(`${employees.length} ${employees.length === 1 ? "person" : "people"} · ${deps.length} department${deps.length === 1 ? "" : "s"}`);

  /* action row — filters left, actions right, all one height */
  const bar = el("div", "kzd-ad__bar");
  const pills = el("div", "kzd-ad__pills");
  pills.setAttribute("role", "group");
  pills.setAttribute("aria-label", "Filter by department");

  const mkPill = (id, label, n) => {
    const b = el("button", "kzd-ad__pill");
    b.type = "button";
    b.setAttribute("aria-pressed", String(filter === id));
    b.appendChild(el("span", null, label));
    b.appendChild(el("span", "kzd-ad__pill-n", String(n)));
    b.addEventListener("click", () => { filter = id; render(); });
    return b;
  };

  pills.appendChild(mkPill("all", "All", employees.length));
  deps.forEach((d) => pills.appendChild(mkPill(d, d, employees.filter((e) => e.department === d).length)));
  bar.appendChild(pills);

  const actions = el("div", "kzd-ad__bar-actions");

  const exportBtn = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Export");
  exportBtn.type = "button";
  exportBtn.addEventListener("click", exportCSV);
  actions.appendChild(exportBtn);

  const add = el("button", "kzd-ad__btn kzd-ad__btn--primary");
  add.type = "button";
  add.appendChild(svg(ICONS.plus));
  add.appendChild(el("span", null, "Add employee"));
  add.addEventListener("click", () => openEmployee(null, { edit: true }));
  actions.appendChild(add);

  bar.appendChild(actions);
  page.appendChild(bar);

  /* table */
  const card = el("section", "kzd-ad__card");
  page.appendChild(card);

  const rows = visible();
  if (!rows.length) {
    card.appendChild(el("p", "kzd-ad__empty",
      filter === "all" ? "No employees yet. Add the first one."
                       : `Nobody in ${filter} yet`));
    return;
  }

  const table = el("table", "kzd-ad__table");
  const thead = el("thead");
  const hr = el("tr");
  [["employee", "Employee"], ["role", "Role"], ["department", "Department"],
   ["started", "Started"], ["status", "Status"], [null, ""]].forEach(([key, label]) => {
    const th = el("th");
    if (!key) { th.setAttribute("aria-label", "Row actions"); hr.appendChild(th); return; }
    const b = el("button", "kzd-ad__sort");
    b.type = "button";
    b.appendChild(el("span", null, label));
    b.appendChild(svg(ICONS.chevUp));
    const active = sortKey === key;
    const dirName = active ? (sortDir === "asc" ? "ascending" : "descending") : "none";
    b.setAttribute("aria-sort", dirName);
    th.setAttribute("aria-sort", dirName);
    b.addEventListener("click", () => {
      sortDir = active && sortDir === "asc" ? "desc" : "asc";
      sortKey = key;
      render();
    });
    th.appendChild(b);
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el("tbody");
  rows.forEach((e) => {
    const tr = el("tr");
    tr.tabIndex = 0;

    const c1 = el("td"); c1.dataset.cell = "applicant";
    const person = el("div", "kzd-ad__person");
    person.appendChild(el("span", "kzd-ad__ini", initials(fullName(e))));
    const who = el("div");
    who.appendChild(el("div", "kzd-ad__person-name", fullName(e)));
    who.appendChild(el("div", "kzd-ad__person-mail", e.workEmail || e.personalEmail || ""));
    person.appendChild(who);
    c1.appendChild(person);
    tr.appendChild(c1);

    const c2 = el("td", null, e.role || "—"); c2.dataset.cell = "role"; tr.appendChild(c2);
    const c3 = el("td", null, e.department || "—"); c3.dataset.cell = "dept"; tr.appendChild(c3);
    const c4 = el("td", null, fmtDate(e.startDate)); c4.dataset.cell = "applied"; tr.appendChild(c4);

    const c5 = el("td"); c5.dataset.cell = "status";
    const chips = el("div", "kzd-ad__chiprow");
    chips.appendChild(statusChip(e.status));
    if (e.fromApplicationId) {
      chips.appendChild(viaCareersTag(e, () => openApplicant(e.fromApplicationId, { onChange: reload })));
    }
    c5.appendChild(chips);
    tr.appendChild(c5);

    const c6 = el("td"); c6.dataset.cell = "menu";
    const kebab = el("button", "kzd-ad__kebab");
    kebab.type = "button";
    kebab.setAttribute("aria-label", `Actions for ${fullName(e)}`);
    kebab.setAttribute("aria-haspopup", "menu");
    kebab.appendChild(kebabIcon());
    kebab.addEventListener("click", (ev) => { ev.stopPropagation(); rowMenu(kebab, e); });
    c6.appendChild(kebab);
    tr.appendChild(c6);

    tr.addEventListener("click", (ev) => {
      if (ev.target.closest(".kzd-ad__kebab") || ev.target.closest(".kzd-ad__via")) return;
      openEmployee(e.id);
    });
    tr.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openEmployee(e.id); }
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);
}

function exportCSV() {
  const rows = visible();
  if (!rows.length) { toast("Nothing to export in this view.", { error: true }); return; }
  const cell = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [["Employee number", "Name", "Work email", "Mobile", "Role", "Department",
                  "Started", "Status", "Employment type", "From careers"].join(",")];
  rows.forEach((e) => lines.push([
    e.number, fullName(e), e.workEmail, e.mobile, e.role, e.department,
    fmtDate(e.startDate), STATUS_LABEL[e.status] || e.status, e.employmentType,
    e.fromApplicationId ? "Yes" : "No"
  ].map(cell).join(",")));

  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = el("a");
  a.href = url;
  a.download = `kzd-employees-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Exported ${rows.length} employee${rows.length === 1 ? "" : "s"}.`);
}

/* --------------------------------------------------------------------------
   Employee modal — Details / Documents / Leave
   -------------------------------------------------------------------------- */

export async function openEmployee(id, opts = {}) {
  let emp;
  if (id) {
    try { emp = JSON.parse(JSON.stringify(await store.getEmployee(id))); }
    catch (err) { toast(`Could not open that employee. ${err.message}`, { error: true }); return; }
  } else {
    emp = { firstName: "", lastName: "", role: "", department: "", status: "probation",
            startDate: "", employmentType: "Permanent, full-time", reportsTo: "",
            location: "Durban office", workEmail: "", mobile: "", documents: [] };
  }

  if (!settings) {
    try { settings = await store.getSettings(); }
    catch (err) { settings = { annualLeaveDays: null }; }
  }

  modal({
    label: id ? `Employee: ${fullName(emp)}` : "Add employee",
    build: (box, api) => {
      box.classList.add("kzd-ad-modal--emp");

      /* header */
      const head = el("div", "kzd-ad-modal__head");
      const av = el("span", "kzd-ad-modal__avatar kzd-ad-modal__avatar--emp", initials(fullName(emp)) || "?");
      head.appendChild(av);
      const who = el("div");
      who.style.flex = "1 1 auto";
      who.style.minWidth = "0";
      const nameEl = el("h2", "kzd-ad-modal__name", fullName(emp) || "New employee");
      who.appendChild(nameEl);
      const metaEl = el("p", "kzd-ad-modal__contact",
        [emp.role, emp.department].filter(Boolean).join(" · ") || "Fill in the details below");
      who.appendChild(metaEl);
      head.appendChild(who);

      const chipHost = el("div");
      if (id) chipHost.appendChild(statusChip(emp.status));
      head.appendChild(chipHost);

      const x = el("button", "kzd-ad-modal__close");
      x.type = "button";
      x.setAttribute("aria-label", "Close");
      x.appendChild(svg(ICONS.x));
      x.addEventListener("click", () => api.close());
      head.appendChild(x);
      box.appendChild(head);

      /* tabs */
      const tabsWrap = el("div", "kzd-ad-modal__tabs");
      tabsWrap.setAttribute("role", "tablist");
      const body = el("div", "kzd-ad-modal__body");
      box.appendChild(tabsWrap);
      box.appendChild(body);

      const TABS = id
        ? [["details", "Details"], ["documents", "Documents"], ["leave", "Leave"]]
        : [["details", "Details"]];
      let current = opts.tab && TABS.some(([t]) => t === opts.tab) ? opts.tab : "details";

      const tabBtns = TABS.map(([key, label]) => {
        const b = el("button", "kzd-ad-modal__tab", label);
        b.type = "button";
        b.setAttribute("role", "tab");
        b.dataset.tab = key;
        b.addEventListener("click", () => { current = key; paint(); });
        b.addEventListener("keydown", (e) => {
          const i = TABS.findIndex(([t]) => t === key);
          let n = null;
          if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
          else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
          if (n === null) return;
          e.preventDefault();
          current = TABS[n][0];
          paint();
          tabBtns[n].focus();
        });
        tabsWrap.appendChild(b);
        return b;
      });

      function paint() {
        tabBtns.forEach((b) => {
          const on = b.dataset.tab === current;
          b.setAttribute("aria-selected", String(on));
          b.tabIndex = on ? 0 : -1;
        });
        body.textContent = "";
        if (current === "details") paintDetails();
        else if (current === "documents") paintDocuments();
        else paintLeave();
      }

      /* ---------------- Details ---------------- */
      let editing = !id || !!opts.edit;

      function paintDetails() {
        if (editing) return paintEdit();

        const s1 = el("section", "kzd-ad-modal__section");
        s1.appendChild(el("h3", "kzd-ad-modal__h", "Employment"));
        const g1 = el("div", "kzd-ad__pairs");
        g1.appendChild(pair("Employee number", emp.number));
        g1.appendChild(pair("Start date", emp.startDate ? fmtDate(emp.startDate) : ""));
        g1.appendChild(pair("Employment type", emp.employmentType));
        g1.appendChild(pair("Probation ends", emp.probationEnds ? fmtDate(emp.probationEnds) : ""));
        g1.appendChild(pair("Reports to", emp.reportsTo));
        g1.appendChild(pair("Location", emp.location));
        s1.appendChild(g1);
        body.appendChild(s1);

        const s2 = el("section", "kzd-ad-modal__section");
        s2.appendChild(el("h3", "kzd-ad-modal__h", "Contact"));
        const g2 = el("div", "kzd-ad__pairs");
        g2.appendChild(pair("Work email", emp.workEmail));
        g2.appendChild(pair("Mobile", emp.mobile));
        g2.appendChild(pair("Emergency contact", emp.emergencyContact));
        g2.appendChild(pair("ID number", emp.idNumber));
        s2.appendChild(g2);
        body.appendChild(s2);

        if (emp.fromApplicationId) {
          const panel = el("div", "kzd-ad__origin");
          panel.appendChild(el("p", "kzd-ad__origin-title", "Hired through the careers portal"));
          const link = el("button", "kzd-ad__origin-link", "View original application");
          link.type = "button";
          link.addEventListener("click", () => {
            api.close();
            openApplicant(emp.fromApplicationId, { onChange: reload });
          });
          panel.appendChild(link);
          body.appendChild(panel);
        }

        const actions = el("div", "kzd-ad__moves");
        const edit = el("button", "kzd-ad__btn kzd-ad__btn--primary", "Edit details");
        edit.type = "button";
        edit.addEventListener("click", () => { editing = true; paint(); });
        actions.appendChild(edit);

        const off = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Start offboarding");
        off.type = "button";
        off.disabled = emp.status === "exited";
        if (off.disabled) off.title = "This employee has already been offboarded";
        off.addEventListener("click", async () => { api.close(); await offboard(emp); });
        actions.appendChild(off);
        body.appendChild(actions);
      }

      function paintEdit() {
        const form = el("form");
        form.noValidate = true;

        const field = (host, key, label, o = {}) => {
          const wrap = el("div", "kzd-ad__field");
          const l = el("label", "kzd-ad__label", label);
          const fid = "emp-" + key;
          l.setAttribute("for", fid);
          wrap.appendChild(l);
          let input;
          if (o.options) {
            input = el("select", "kzd-ad__select");
            o.options.forEach((v) => {
              const opt = el("option", null, o.labels ? o.labels[v] || v : v);
              opt.value = v;
              input.appendChild(opt);
            });
          } else {
            input = el("input", "kzd-ad__input");
            input.type = o.type || "text";
          }
          input.id = fid;
          input.dataset.k = key;
          input.value = emp[key] || "";
          wrap.appendChild(input);
          const err = el("p", "kzd-ad__err");
          err.id = fid + "-err";
          wrap.appendChild(err);
          host.appendChild(wrap);
          return input;
        };

        const s1 = el("section", "kzd-ad-modal__section");
        s1.appendChild(el("h3", "kzd-ad-modal__h", "Employment"));
        const r1 = el("div", "kzd-ad__row2");
        field(r1, "firstName", "First name");
        field(r1, "lastName", "Last name");
        s1.appendChild(r1);
        const r2 = el("div", "kzd-ad__row2");
        field(r2, "role", "Role");
        field(r2, "department", "Department");
        s1.appendChild(r2);
        const r3 = el("div", "kzd-ad__row2");
        field(r3, "startDate", "Start date", { type: "date" });
        field(r3, "probationEnds", "Probation ends", { type: "date" });
        s1.appendChild(r3);
        const r4 = el("div", "kzd-ad__row2");
        field(r4, "employmentType", "Employment type");
        field(r4, "status", "Status", {
          options: ["active", "probation", "leave", "exited"], labels: STATUS_LABEL
        });
        s1.appendChild(r4);
        const r5 = el("div", "kzd-ad__row2");
        field(r5, "reportsTo", "Reports to");
        field(r5, "location", "Location");
        s1.appendChild(r5);
        form.appendChild(s1);

        const s2 = el("section", "kzd-ad-modal__section");
        s2.appendChild(el("h3", "kzd-ad-modal__h", "Contact"));
        const r6 = el("div", "kzd-ad__row2");
        field(r6, "workEmail", "Work email", { type: "email" });
        field(r6, "mobile", "Mobile", { type: "tel" });
        s2.appendChild(r6);
        const r7 = el("div", "kzd-ad__row2");
        field(r7, "emergencyContact", "Emergency contact");
        field(r7, "idNumber", "ID number");
        s2.appendChild(r7);
        form.appendChild(s2);

        const actions = el("div", "kzd-ad__moves");
        const save = el("button", "kzd-ad__btn kzd-ad__btn--primary", "Save");
        save.type = "submit";
        actions.appendChild(save);
        const cancel = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Cancel");
        cancel.type = "button";
        cancel.addEventListener("click", () => {
          if (!id) { api.close(); return; }
          editing = false;
          paint();
        });
        actions.appendChild(cancel);
        form.appendChild(actions);

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const next = Object.assign({}, emp);
          form.querySelectorAll("[data-k]").forEach((i) => { next[i.dataset.k] = i.value.trim(); });

          const fnErr = form.querySelector("#emp-firstName-err");
          if (!next.firstName) {
            fnErr.textContent = "A first name is required.";
            form.querySelector("#emp-firstName").focus();
            return;
          }
          fnErr.textContent = "";

          const label = save.textContent;
          save.disabled = true;
          save.textContent = "";
          save.appendChild(el("span", "kzd-ad__spin"));
          try {
            const saved = await store.saveEmployee(next);
            emp = saved;
            editing = false;
            nameEl.textContent = fullName(emp);
            metaEl.textContent = [emp.role, emp.department].filter(Boolean).join(" · ");
            av.textContent = initials(fullName(emp));
            chipHost.textContent = "";
            chipHost.appendChild(statusChip(emp.status));
            toast(`${fullName(emp)} saved.`);
            await reload();
            if (!id) { api.close(); openEmployee(saved.id); return; }
            paint();
          } catch (err) {
            save.disabled = false;
            save.textContent = label;
            toast(`Could not save. ${err.message}`, { error: true });
          }
        });

        body.appendChild(form);
      }

      /* ---------------- Documents ---------------- */
      function paintDocuments() {
        const s = el("section", "kzd-ad-modal__section");
        s.appendChild(el("h3", "kzd-ad-modal__h", "Documents"));
        s.appendChild(el("p", "kzd-ad__card-sub",
          "Contract, ID copy and qualifications. Anything attached to the original application came across automatically."));

        const list = el("div");
        s.appendChild(list);

        function paintList() {
          list.textContent = "";
          const docs = emp.documents || [];
          if (!docs.length) {
            list.appendChild(el("p", "kzd-ad__empty", "No documents yet"));
            return;
          }
          docs.forEach((f, i) => {
            const row = el("div", "kzd-ad__file");
            const icon = el("span", "kzd-ad__file-icon");
            icon.appendChild(svg(ICONS.doc));
            row.appendChild(icon);
            const meta = el("div");
            meta.style.flex = "1 1 auto";
            meta.appendChild(el("div", "kzd-ad__file-name", f.name));
            meta.appendChild(el("div", "kzd-ad__file-size",
              [f.kind, fmtSize(f.size)].filter(Boolean).join(" · ")));
            row.appendChild(meta);

            // TODO(backend): needs real file storage. Only the name and size were
            // ever kept, so there is nothing to hand over — same as the applicant
            // modal, and a working-looking button here would be a lie.
            const dl = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Download");
            dl.type = "button";
            dl.disabled = true;
            dl.title = "Available once file storage is connected";
            row.appendChild(dl);

            const del = el("button", "kzd-ad__kebab");
            del.type = "button";
            del.setAttribute("aria-label", `Remove ${f.name}`);
            del.appendChild(svg(ICONS.x));
            del.addEventListener("click", async () => {
              emp.documents.splice(i, 1);
              try { emp = await store.saveEmployee(emp); paintList(); toast("Document removed."); }
              catch (err) { toast(err.message, { error: true }); }
            });
            row.appendChild(del);
            list.appendChild(row);
          });
        }
        paintList();

        const up = el("div", "kzd-ad__field");
        up.style.marginTop = "18px";
        const lab = el("label", "kzd-ad__label", "Add a document");
        lab.setAttribute("for", "emp-upload");
        up.appendChild(lab);
        const input = el("input", "kzd-ad__input");
        input.type = "file";
        input.id = "emp-upload";
        input.accept = DOC_TYPES.join(",");
        up.appendChild(input);
        up.appendChild(el("p", "kzd-ad__hint", "PDF, Word or an image, max 5MB. Only the filename and size are stored."));
        const err = el("p", "kzd-ad__err");
        up.appendChild(err);
        s.appendChild(up);

        input.addEventListener("change", async () => {
          const f = input.files && input.files[0];
          if (!f) return;
          err.textContent = "";
          const ext = "." + f.name.split(".").pop().toLowerCase();
          if (DOC_TYPES.indexOf(ext) === -1) {
            err.textContent = `${f.name} is not an accepted file type. PDF, Word or an image.`;
            input.value = "";
            return;
          }
          if (f.size > DOC_MAX) {
            err.textContent = `That is ${(f.size / 1048576).toFixed(1)} MB. The limit is 5.0 MB.`;
            input.value = "";
            return;
          }
          // Metadata only — the bytes are never read or stored.
          emp.documents = (emp.documents || []).concat([{ name: f.name, size: f.size, kind: "Document" }]);
          input.value = "";
          try { emp = await store.saveEmployee(emp); paintList(); toast(`${f.name} attached.`); }
          catch (e2) { toast(e2.message, { error: true }); }
        });

        body.appendChild(s);
      }

      /* ---------------- Leave ---------------- */
      async function paintLeave() {
        const s = el("section", "kzd-ad-modal__section");
        s.appendChild(el("h3", "kzd-ad-modal__h", "Annual leave"));
        const summary = el("div");
        s.appendChild(summary);
        body.appendChild(s);

        const listSec = el("section", "kzd-ad-modal__section");
        listSec.appendChild(el("h3", "kzd-ad-modal__h", "Leave taken"));
        const listHost = el("div");
        listSec.appendChild(listHost);
        body.appendChild(listSec);

        let entries = [];
        try { entries = await store.getLeave(emp.id); }
        catch (err) {
          listHost.appendChild(errorBlock(`Could not load leave. ${err.message}`, paint));
          return;
        }

        function paintSummary() {
          // Entitlement comes from Settings, never a literal here.
          const entitlement = settings.annualLeaveDays;
          const taken = entries
            .filter((l) => l.type === "Annual")
            .reduce((n, l) => n + store.workingDays(l.from, l.to), 0);
          const remaining = Math.max(0, entitlement - taken);
          const pct = entitlement ? Math.min(100, (taken / entitlement) * 100) : 0;

          summary.textContent = "";
          const g = el("div", "kzd-ad__pairs");
          g.appendChild(pair("Entitlement", `${entitlement} working days`));
          g.appendChild(pair("Taken", `${taken} day${taken === 1 ? "" : "s"}`));
          summary.appendChild(g);

          const track = el("div", "kzd-ad__leave-track");
          const bar = el("span", "kzd-ad__leave-bar");
          bar.style.width = pct + "%";
          track.appendChild(bar);
          summary.appendChild(track);
          summary.appendChild(el("p", "kzd-ad__leave-note",
            `${remaining} day${remaining === 1 ? "" : "s"} remaining of ${entitlement}. Entitlement is set in Settings.`));
        }

        function paintEntries() {
          listHost.textContent = "";
          if (!entries.length) {
            listHost.appendChild(el("p", "kzd-ad__empty", "No leave recorded"));
            return;
          }
          entries.slice().sort((a, b) => String(b.from).localeCompare(String(a.from))).forEach((l) => {
            const row = el("div", "kzd-ad__file");
            const meta = el("div");
            meta.style.flex = "1 1 auto";
            meta.appendChild(el("div", "kzd-ad__file-name", `${fmtDate(l.from)} – ${fmtDate(l.to)}`));
            meta.appendChild(el("div", "kzd-ad__file-size",
              `${l.type} · ${store.workingDays(l.from, l.to)} working day(s)${l.note ? " · " + l.note : ""}`));
            row.appendChild(meta);
            row.appendChild(el("span", "kzd-ad__chip kzd-ad__chip--emp-active", String(l.status || "Approved").toUpperCase()));
            const del = el("button", "kzd-ad__kebab");
            del.type = "button";
            del.setAttribute("aria-label", `Remove leave ${fmtDate(l.from)}`);
            del.appendChild(svg(ICONS.x));
            del.addEventListener("click", async () => {
              try {
                await store.deleteLeave(emp.id, l.id);
                entries = await store.getLeave(emp.id);
                paintEntries(); paintSummary();
                toast("Leave removed.");
              } catch (err) { toast(err.message, { error: true }); }
            });
            row.appendChild(del);
            listHost.appendChild(row);
          });
        }

        paintSummary();
        paintEntries();

        /* add-leave form */
        const addSec = el("section", "kzd-ad-modal__section");
        addSec.appendChild(el("h3", "kzd-ad-modal__h", "Add leave"));
        const form = el("form");
        form.noValidate = true;

        const mk = (host, key, label, type, options) => {
          const wrap = el("div", "kzd-ad__field");
          const l = el("label", "kzd-ad__label", label);
          l.setAttribute("for", "lv-" + key);
          wrap.appendChild(l);
          let input;
          if (options) {
            input = el("select", "kzd-ad__select");
            options.forEach((o) => { const op = el("option", null, o); op.value = o; input.appendChild(op); });
          } else {
            input = el("input", "kzd-ad__input");
            input.type = type || "text";
          }
          input.id = "lv-" + key;
          input.dataset.k = key;
          wrap.appendChild(input);
          const err = el("p", "kzd-ad__err");
          err.id = "lv-" + key + "-err";
          wrap.appendChild(err);
          host.appendChild(wrap);
          return input;
        };

        const row = el("div", "kzd-ad__row2");
        const from = mk(row, "from", "From", "date");
        const to = mk(row, "to", "To", "date");
        form.appendChild(row);
        const type = mk(form, "type", "Type", null, LEAVE_TYPES);
        const note = mk(form, "note", "Note (optional)");

        const actions = el("div", "kzd-ad__moves");
        const save = el("button", "kzd-ad__btn kzd-ad__btn--primary", "Add leave");
        save.type = "submit";
        actions.appendChild(save);
        form.appendChild(actions);

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fe = form.querySelector("#lv-from-err");
          const te = form.querySelector("#lv-to-err");
          fe.textContent = ""; te.textContent = "";

          if (!from.value) { fe.textContent = "Pick a start date."; from.focus(); return; }
          if (!to.value) { te.textContent = "Pick an end date."; to.focus(); return; }
          if (to.value < from.value) { te.textContent = "The end date cannot be before the start date."; to.focus(); return; }

          const label = save.textContent;
          save.disabled = true;
          save.textContent = "";
          save.appendChild(el("span", "kzd-ad__spin"));
          try {
            await store.saveLeave(emp.id, {
              from: from.value, to: to.value, type: type.value, note: note.value.trim()
            });
            entries = await store.getLeave(emp.id);
            paintEntries();
            paintSummary();          // balance recalculates here
            from.value = ""; to.value = ""; note.value = "";
            toast("Leave added.");
          } catch (err) {
            te.textContent = err.message;
          } finally {
            save.disabled = false;
            save.textContent = label;
          }
        });

        addSec.appendChild(form);
        body.appendChild(addSec);
      }

      paint();
    }
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

async function reload() {
  try {
    [employees, settings] = await Promise.all([store.getEmployees(), store.getSettings()]);
    render();
    shell.refreshBell();
  } catch (err) {
    page.textContent = "";
    page.appendChild(errorBlock(`Could not load employees. ${err.message}`, reload));
  }
}

(async () => {
  try {
    shell = await mountShell({ active: "employees", title: "Employees" });
  } catch (e) { return; }
  page = shell.page;

  const skel = el("section", "kzd-ad__card");
  const t = el("table", "kzd-ad__table");
  const tb = el("tbody");
  tb.appendChild(skeletonRows(6, 6));
  t.appendChild(tb);
  skel.appendChild(t);
  page.appendChild(skel);

  window.KZDAdminOpenEmployee = (empId) => openEmployee(empId);
  window.KZDAdminOpenApplicant = (appId) => openApplicant(appId, { onChange: reload });

  await reload();

  const openId = new URLSearchParams(location.search).get("open");
  if (openId) openEmployee(openId);
})();

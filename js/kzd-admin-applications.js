/* ==========================================================================
   KZD Admin — APPLICATIONS

   Filter state lives in the URL query (?status=&sort=&dir=&page=) so a view is
   shareable and the back button works.

   PAGINATION, not infinite scroll — 25 rows a page. Chosen because it keeps the
   whole set reachable by keyboard, gives the browser a real scroll position to
   restore, and lets the page number live in the URL alongside the filter.
   ========================================================================== */

import {
  store, el, svg, ICONS, kebabIcon, fmtDate, initials, stageChip, STAGE_LABEL,
  mountShell, toast, errorBlock, skeletonRows, confirmDialog, modal
} from "./kzd-admin.js";
import { openApplicant } from "./kzd-admin-applicant.js";

const PER_PAGE = 25;

const FILTERS = [
  { id: "all",          label: "All" },
  { id: "applied",      label: "Applied" },
  { id: "reviewing",    label: "Reviewing" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer",        label: "Offer" }
];

const SORTS = {
  applicant: (a, b) => String(a.fullName || "").localeCompare(String(b.fullName || "")),
  role:      (a, b) => String(a.jobTitle || "").localeCompare(String(b.jobTitle || "")),
  applied:   (a, b) => String(a.submittedAt || "").localeCompare(String(b.submittedAt || "")),
  status:    (a, b) => String(a.stage || "").localeCompare(String(b.stage || ""))
};

const EMPTY_FOR = {
  all: "No applications yet",
  applied: "No applications at the applied stage yet",
  reviewing: "No applications at the reviewing stage yet",
  interviewing: "No applications at the interviewing stage yet",
  offer: "No applications at the offer stage yet"
};

/* --------------------------------------------------------------------------
   URL state
   -------------------------------------------------------------------------- */

function readState() {
  const q = new URLSearchParams(location.search);
  const status = q.get("status");
  return {
    status: FILTERS.some((f) => f.id === status) ? status : "all",
    sort: SORTS[q.get("sort")] ? q.get("sort") : "applied",
    dir: q.get("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, parseInt(q.get("page"), 10) || 1)
  };
}

function writeState(next, replace = false) {
  const q = new URLSearchParams();
  if (next.status !== "all") q.set("status", next.status);
  if (next.sort !== "applied") q.set("sort", next.sort);
  if (next.dir !== "desc") q.set("dir", next.dir);
  if (next.page > 1) q.set("page", String(next.page));
  const url = q.toString() ? `?${q}` : location.pathname;
  history[replace ? "replaceState" : "pushState"]({}, "", url);
}

/* --------------------------------------------------------------------------
   CSV — built client-side from the filtered set and downloaded via a Blob.
   -------------------------------------------------------------------------- */

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCSV(rows, status) {
  const head = ["Name", "Email", "Phone", "Role", "Applied", "Stage", "Location", "Available from"];
  const lines = [head.join(",")];
  rows.forEach((a) => {
    lines.push([
      a.fullName, a.email, a.phone, a.jobTitle, fmtDate(a.submittedAt),
      STAGE_LABEL[a.stage || "applied"] || a.stage, a.location, a.startDate
    ].map(csvCell).join(","));
  });

  // A BOM keeps Excel from mangling non-ASCII names.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = el("a");
  a.href = url;
  a.download = `kzd-applications-${status}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return lines.length - 1;
}

/* --------------------------------------------------------------------------
   Row menu
   -------------------------------------------------------------------------- */

function rowMenu(anchor, app, actions) {
  const existing = document.querySelector(".kzd-ad__menu[data-rowmenu]");
  if (existing) existing.remove();

  const menu = el("div", "kzd-ad__menu");
  menu.dataset.rowmenu = "1";
  menu.setAttribute("role", "menu");
  menu.style.position = "fixed";
  menu.style.zIndex = "200";

  const add = (label, fn, opts = {}) => {
    const b = el("button", opts.danger ? "is-danger" : null, label);
    b.type = "button";
    b.setAttribute("role", "menuitem");
    if (opts.disabled) {
      b.disabled = true;
      b.title = opts.title || "";
      b.style.opacity = ".55";
      b.style.cursor = "not-allowed";
    } else {
      b.addEventListener("click", () => { menu.remove(); fn(); });
    }
    menu.appendChild(b);
  };

  add("View details", () => actions.view(app));
  add("Change stage", () => actions.stage(app));
  // Nothing to hand over: only filenames and sizes were ever stored.
  add("Download CV", () => {}, {
    disabled: true,
    title: "Available once file storage is connected"
  });
  add("Remove", () => actions.remove(app), { danger: true });

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
  setTimeout(() => {
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
  }, 0);

  const first = menu.querySelector("button:not([disabled])");
  if (first) first.focus();
}

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

(async () => {
  let shell;
  try {
    shell = await mountShell({ active: "applications", title: "Applications" });
  } catch (e) { return; }

  const page = shell.page;
  let state = readState();
  let all = [];

  const bar = el("div", "kzd-ad__bar");
  const pills = el("div", "kzd-ad__pills");
  pills.setAttribute("role", "group");
  pills.setAttribute("aria-label", "Filter by stage");
  bar.appendChild(pills);

  const actions = el("div", "kzd-ad__bar-actions");
  const exportBtn = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Export CSV");
  exportBtn.type = "button";
  actions.appendChild(exportBtn);
  bar.appendChild(actions);
  page.appendChild(bar);

  const card = el("section", "kzd-ad__card");
  page.appendChild(card);

  const pager = el("div");
  pager.style.display = "flex";
  pager.style.alignItems = "center";
  pager.style.justifyContent = "space-between";
  pager.style.gap = "16px";
  pager.style.marginTop = "18px";
  page.appendChild(pager);

  function filtered() {
    let list = all.slice();
    if (state.status !== "all") list = list.filter((a) => (a.stage || "applied") === state.status);
    const cmp = SORTS[state.sort];
    list.sort((a, b) => (state.dir === "asc" ? cmp(a, b) : -cmp(a, b)));
    return list;
  }

  function paintPills() {
    pills.textContent = "";
    FILTERS.forEach((f) => {
      const n = f.id === "all"
        ? all.length
        : all.filter((a) => (a.stage || "applied") === f.id).length;
      const b = el("button", "kzd-ad__pill");
      b.type = "button";
      b.setAttribute("aria-pressed", String(state.status === f.id));
      b.appendChild(el("span", null, f.label));
      b.appendChild(el("span", "kzd-ad__pill-n", String(n)));
      b.addEventListener("click", () => {
        state = { ...state, status: f.id, page: 1 };
        writeState(state);
        paintPills();
        paintTable();
      });
      pills.appendChild(b);
    });
  }

  function paintTable() {
    card.textContent = "";
    pager.textContent = "";

    const rows = filtered();
    const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    if (state.page > pages) state = { ...state, page: pages };
    const slice = rows.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

    const needAction = all.filter((a) => ["applied", "reviewing"].includes(a.stage || "applied")).length;
    shell.setSubtitle(`${all.length} total · ${needAction} need action`);

    if (!rows.length) {
      card.appendChild(el("p", "kzd-ad__empty", EMPTY_FOR[state.status] || "Nothing here"));
      return;
    }

    const table = el("table", "kzd-ad__table");
    const thead = el("thead");
    const hr = el("tr");

    [["applicant", "Applicant"], ["role", "Role"], ["applied", "Applied"],
     ["docs", "Docs"], ["status", "Status"], [null, ""]].forEach(([key, label]) => {
      const th = el("th");
      if (!key) { th.setAttribute("aria-label", "Row actions"); hr.appendChild(th); return; }
      if (key === "docs") { th.textContent = label; hr.appendChild(th); return; }

      const b = el("button", "kzd-ad__sort");
      b.type = "button";
      b.appendChild(el("span", null, label));
      b.appendChild(svg(ICONS.chevUp));
      const isActive = state.sort === key;
      b.setAttribute("aria-sort", isActive ? (state.dir === "asc" ? "ascending" : "descending") : "none");
      th.setAttribute("aria-sort", isActive ? (state.dir === "asc" ? "ascending" : "descending") : "none");
      b.addEventListener("click", () => {
        const dir = isActive && state.dir === "desc" ? "asc" : (isActive ? "desc" : "desc");
        state = { ...state, sort: key, dir: isActive ? (state.dir === "desc" ? "asc" : "desc") : "desc", page: 1 };
        writeState(state);
        paintTable();
      });
      th.appendChild(b);
      hr.appendChild(th);
    });

    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = el("tbody");
    slice.forEach((a) => {
      const tr = el("tr");
      tr.tabIndex = 0;

      const c1 = el("td"); c1.dataset.cell = "applicant";
      const person = el("div", "kzd-ad__person");
      person.appendChild(el("span", "kzd-ad__ini", initials(a.fullName)));
      const who = el("div");
      who.appendChild(el("div", "kzd-ad__person-name", a.fullName));
      who.appendChild(el("div", "kzd-ad__person-mail", a.email));
      person.appendChild(who);
      c1.appendChild(person);
      tr.appendChild(c1);

      const c2 = el("td", null, a.jobTitle || "—"); c2.dataset.cell = "role"; tr.appendChild(c2);
      const c3 = el("td", null, fmtDate(a.submittedAt)); c3.dataset.cell = "applied"; tr.appendChild(c3);

      const c4 = el("td"); c4.dataset.cell = "docs";
      const docs = el("div", "kzd-ad__docs");
      [].concat(a.cv || [], a.docs || []).slice(0, 3).forEach(() => {
        const pip = el("span", "kzd-ad__doc-pip");
        pip.appendChild(svg(ICONS.doc));
        docs.appendChild(pip);
      });
      c4.appendChild(docs);
      tr.appendChild(c4);

      const c5 = el("td"); c5.dataset.cell = "status"; c5.appendChild(stageChip(a.stage)); tr.appendChild(c5);

      const c6 = el("td"); c6.dataset.cell = "menu";
      const kebab = el("button", "kzd-ad__kebab");
      kebab.type = "button";
      kebab.setAttribute("aria-label", `Actions for ${a.fullName}`);
      kebab.setAttribute("aria-haspopup", "menu");
      kebab.appendChild(kebabIcon());
      kebab.addEventListener("click", (e) => {
        e.stopPropagation();
        rowMenu(kebab, a, { view: open, stage: open, remove });
      });
      c6.appendChild(kebab);
      tr.appendChild(c6);

      const open = () => openApplicant(a.id, { onChange: reload });
      tr.addEventListener("click", (e) => { if (!e.target.closest(".kzd-ad__kebab")) open(); });
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);

    /* --- pagination ---------------------------------------------------- */
    const from = (state.page - 1) * PER_PAGE + 1;
    const to = Math.min(state.page * PER_PAGE, rows.length);
    pager.appendChild(el("p", "kzd-ad__card-sub", `Showing ${from}–${to} of ${rows.length}`));

    if (pages > 1) {
      const nav = el("div");
      nav.style.display = "flex";
      nav.style.gap = "8px";

      const mk = (label, target, disabled) => {
        const b = el("button", "kzd-ad__btn kzd-ad__btn--ghost", label);
        b.type = "button";
        b.disabled = disabled;
        if (disabled) b.title = label === "Previous" ? "You are on the first page" : "You are on the last page";
        b.addEventListener("click", () => {
          state = { ...state, page: target };
          writeState(state);
          paintTable();
          window.scrollTo({ top: 0, behavior: "auto" });
        });
        return b;
      };

      nav.appendChild(mk("Previous", state.page - 1, state.page === 1));
      nav.appendChild(el("span", "kzd-ad__card-sub", `Page ${state.page} of ${pages}`));
      nav.appendChild(mk("Next", state.page + 1, state.page === pages));
      pager.appendChild(nav);
    }
  }

  async function remove(a) {
    const ok = await confirmDialog({
      title: "Remove this application?",
      body: `${a.fullName}'s application for ${a.jobTitle} will be removed. You can undo this from the toast.`,
      confirmLabel: "Remove"
    });
    if (!ok) return;
    try {
      const removed = await store.deleteApplication(a.id);
      await reload();
      toast(`${a.fullName} removed.`, {
        onUndo: async () => {
          try { await store.restoreApplication(removed); await reload(); toast("Restored."); }
          catch (e) { toast(e.message, { error: true }); }
        }
      });
    } catch (err) {
      toast(`Could not remove. ${err.message}`, { error: true });
    }
  }

  async function reload() {
    try {
      all = await store.getApplications();
      paintPills();
      paintTable();
      shell.refreshBell();
    } catch (err) {
      card.textContent = "";
      card.appendChild(errorBlock(`Could not load applications. ${err.message}`, reload));
    }
  }

  exportBtn.addEventListener("click", () => {
    const rows = filtered();
    if (!rows.length) { toast("Nothing to export in this view.", { error: true }); return; }
    const n = exportCSV(rows, state.status);
    toast(`Exported ${n} row${n === 1 ? "" : "s"} to CSV.`);
  });

  window.KZDAdminOpenApplicant = (id) => openApplicant(id, { onChange: reload });

  window.addEventListener("popstate", () => {
    state = readState();
    paintPills();
    paintTable();
  });

  // Skeleton while the first load runs.
  const skelTable = el("table", "kzd-ad__table");
  const sb = el("tbody");
  sb.appendChild(skeletonRows(6, 6));
  skelTable.appendChild(sb);
  card.appendChild(skelTable);

  await reload();

  // ?open=<id> from a search result or a notification on another page.
  const openId = new URLSearchParams(location.search).get("open");
  if (openId) openApplicant(openId, { onChange: reload });
})();

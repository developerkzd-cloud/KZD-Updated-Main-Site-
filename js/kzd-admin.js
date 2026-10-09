/* ==========================================================================
   KZD Solutions — ADMIN SHELL

   Shared by all five admin pages: access guard, sidebar, topbar, working
   search, working notifications, avatar menu, toasts and the modal helper.

   ⚠ ACCESS CONTROL HERE IS COSMETIC. The guard below hides the UI from someone
   without an admin session; it does not protect the data, because the data is
   in that person's own browser. Anyone can edit localStorage and let themselves
   in. See the banner in js/kzd-store.js. Replace with server-enforced
   authorisation before this is used for anything real.

   Every read and write goes through js/kzd-store.js. There is no localStorage
   call in this file.

   --------------------------------------------------------------------------
   PAYLOAD MAP. The site is moving to Payload CMS, which ships its own admin
   panel. Which areas that replaces, and which stay custom:

     Job postings   js/kzd-admin-jobs.js          LIKELY REPLACED by Payload
     Page content   js/kzd-admin-content.js       LIKELY REPLACED by Payload
     Applications   js/kzd-admin-applications.js  STAYS CUSTOM (applicant pipeline)
     Employees      js/kzd-admin-employees.js     STAYS CUSTOM (HR workflow)
     Overview       js/kzd-admin-overview.js      not classified yet
     Settings       js/kzd-admin-settings.js      not classified yet

   "Replaced" means: carry the data model across (see each file's note), not
   the screen. Overview is computed from applications and jobs, so it is
   coupled to both sides of the split above; that is a note for whoever
   decides, not a decision. js/kzd-admin-applicant.js is the applicant modal
   shared by Overview, Applications and Employees, so it stays with the
   custom side.
   ========================================================================== */

import * as store from "./kzd-store.js";

export { store };

/* --------------------------------------------------------------------------
   Small helpers
   -------------------------------------------------------------------------- */

const SVG_NS = "http://www.w3.org/2000/svg";

export function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export function svg(paths, opts = {}) {
  const s = document.createElementNS(SVG_NS, "svg");
  s.setAttribute("viewBox", opts.box || "0 0 24 24");
  s.setAttribute("aria-hidden", "true");
  s.setAttribute("focusable", "false");
  if (opts.fill) s.setAttribute("fill", opts.fill);
  (Array.isArray(paths) ? paths : [paths]).forEach((d) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    s.appendChild(p);
  });
  return s;
}

export function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtSize(bytes) {
  if (typeof bytes !== "number" || !isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export function relTime(iso) {
  const then = new Date(iso).getTime();
  if (!isFinite(then)) return "";
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  return fmtDate(iso);
}

export const STAGE_LABEL = {
  applied: "Applied",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Not proceeding"
};

export function stageChip(stage) {
  const s = stage || "applied";
  return el("span", `kzd-ad__chip kzd-ad__chip--${s}`, (STAGE_LABEL[s] || s).toUpperCase());
}

export const ICONS = {
  overview: ["M4 4h7v7H4z", "M13 4h7v4h-7z", "M13 10h7v10h-7z", "M4 13h7v7H4z"],
  apps:     ["M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20", "M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z", "M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4", "M15.4 4.6a3.5 3.5 0 0 1 0 6.8"],
  jobs:     ["M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z", "M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"],
  content:  ["M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z", "M15 3v4h4", "M9 12h6", "M9 16h6"],
  settings: ["M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z", "M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.9 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 13.9H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9.4A1.6 1.6 0 0 0 10.5 4V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1.1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.1Z"],
  search:   ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "M20 20l-4-4"],
  bell:     ["M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z", "M13.7 20a2 2 0 0 1-3.4 0"],
  burger:   ["M4 7h16", "M4 12h16", "M4 17h16"],
  x:        ["M6 6l12 12", "M18 6 6 18"],
  doc:      ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z", "M14 3v5h5"],
  chevUp:   ["M6 14l6-6 6 6"],
  plus:     ["M12 5v14", "M5 12h14"],
  brief:    ["M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z", "M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"],
  users:    ["M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20", "M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"],
  check:    ["M5 13l4 4L19 7"],
  // ID badge — the Employees nav icon
  badge:    ["M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z",
             "M12 11.2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
             "M8.5 16.5a3.6 3.6 0 0 1 7 0",
             "M9.5 4V2.8h5V4"]
};

const KEBAB = "M12 7a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 12 7Zm0 6.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Zm0 6.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z";
export function kebabIcon() { return svg(KEBAB, { fill: "currentColor" }); }

/* --------------------------------------------------------------------------
   Toasts
   -------------------------------------------------------------------------- */

let toastHost = null;

export function toast(message, opts = {}) {
  if (!toastHost) {
    toastHost = el("div", "kzd-ad-toasts");
    toastHost.setAttribute("role", "status");
    toastHost.setAttribute("aria-live", "polite");
    document.body.appendChild(toastHost);
  }

  const t = el("div", "kzd-ad-toast" + (opts.error ? " kzd-ad-toast--error" : ""));
  t.appendChild(el("span", null, message));

  let timer = null;
  const dismiss = () => {
    if (timer) clearTimeout(timer);
    t.classList.add("is-out");
    setTimeout(() => t.remove(), reduced() ? 0 : 200);
  };

  if (typeof opts.onUndo === "function") {
    const u = el("button", "kzd-ad-toast__undo", "Undo");
    u.type = "button";
    u.addEventListener("click", () => { opts.onUndo(); dismiss(); });
    t.appendChild(u);
  }

  toastHost.appendChild(t);
  timer = setTimeout(dismiss, opts.duration || 4000);
  return dismiss;
}

/* --------------------------------------------------------------------------
   Modal — one implementation, used by every dialog in the admin.
   -------------------------------------------------------------------------- */

let openDialog = null;

export function modal({ narrow = false, label, build }) {
  closeModal();

  const scrim = el("div", "kzd-ad-scrim kzd-ad-portal");
  const box = el("div", "kzd-ad-modal" + (narrow ? " kzd-ad-modal--narrow" : ""));
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  if (label) box.setAttribute("aria-label", label);

  const api = { scrim, box, close: () => closeModal() };
  build(box, api);

  scrim.appendChild(box);
  document.body.appendChild(scrim);

  const prevFocus = document.activeElement;
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const focusables = () =>
    Array.from(box.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((n) => n.offsetWidth > 0 || n.offsetHeight > 0);

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
    if (e.key !== "Tab") return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  scrim.addEventListener("mousedown", (e) => { if (e.target === scrim) closeModal(); });
  document.addEventListener("keydown", onKey);

  openDialog = () => {
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = prevOverflow;
    scrim.remove();
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    openDialog = null;
  };

  requestAnimationFrame(() => scrim.classList.add("is-open"));
  const f = focusables();
  if (f.length) f[0].focus();

  return api;
}

export function closeModal() { if (openDialog) openDialog(); }

/** Confirmation step for anything destructive. Resolves true / false. */
export function confirmDialog({ title, body, confirmLabel = "Confirm", danger = true, withReason = false }) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };

    modal({
      narrow: true,
      label: title,
      build: (box, api) => {
        const head = el("div", "kzd-ad-modal__head");
        const wrap = el("div");
        wrap.appendChild(el("h2", "kzd-ad-modal__name", title));
        head.appendChild(wrap);
        const x = el("button", "kzd-ad-modal__close");
        x.type = "button";
        x.setAttribute("aria-label", "Close");
        x.appendChild(svg(ICONS.x));
        x.addEventListener("click", () => { done(false); api.close(); });
        head.appendChild(x);
        box.appendChild(head);

        const bd = el("div", "kzd-ad-modal__body");
        bd.appendChild(el("p", null, body));

        let reason = null;
        if (withReason) {
          const f = el("div", "kzd-ad__field");
          const l = el("label", "kzd-ad__label", "Internal reason (optional)");
          l.setAttribute("for", "kzd-ad-reason");
          f.appendChild(l);
          reason = el("textarea", "kzd-ad__textarea");
          reason.id = "kzd-ad-reason";
          reason.placeholder = "Only visible to the hiring team.";
          f.appendChild(reason);
          bd.appendChild(f);
        }

        const row = el("div", "kzd-ad__moves");
        row.style.marginTop = "20px";
        const ok = el("button", `kzd-ad__btn ${danger ? "kzd-ad__btn--danger" : "kzd-ad__btn--primary"}`, confirmLabel);
        ok.type = "button";
        ok.addEventListener("click", () => { done(withReason ? { reason: reason.value.trim() } : true); api.close(); });
        const no = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Cancel");
        no.type = "button";
        no.addEventListener("click", () => { done(false); api.close(); });
        row.appendChild(ok);
        row.appendChild(no);
        bd.appendChild(row);
        box.appendChild(bd);

        // Closing by Escape or backdrop counts as declining.
        const obs = new MutationObserver(() => { if (!document.body.contains(api.scrim)) { done(false); obs.disconnect(); } });
        obs.observe(document.body, { childList: true });
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Error / loading helpers shared by the pages
   -------------------------------------------------------------------------- */

export function errorBlock(message, onRetry) {
  const box = el("div", "kzd-ad__error");
  box.setAttribute("role", "alert");
  box.appendChild(el("span", null, message));
  if (onRetry) {
    const b = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Retry");
    b.type = "button";
    b.addEventListener("click", onRetry);
    box.appendChild(b);
  }
  return box;
}

export function skeletonRows(count, cols) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const tr = el("tr");
    for (let c = 0; c < cols; c++) {
      const td = el("td");
      const s = el("div", "kzd-ad__skel");
      if (c === 0) s.style.width = "60%";
      else if (c === cols - 1) s.style.width = "30px";
      else s.style.width = ["70%", "50%", "40%"][c % 3];
      td.appendChild(s);
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  }
  return frag;
}

/* --------------------------------------------------------------------------
   Shell
   -------------------------------------------------------------------------- */

const NAV = [
  { id: "overview",     label: "Overview",     href: "index.html",        icon: ICONS.overview },
  { id: "applications", label: "Applications", href: "applications.html", icon: ICONS.apps },
  { id: "jobs",         label: "Job postings", href: "jobs.html",         icon: ICONS.jobs },
  { id: "employees",    label: "Employees",    href: "employees.html",    icon: ICONS.badge },
  { id: "content",      label: "Page content", href: "content.html",      icon: ICONS.content },
  { id: "settings",     label: "Settings",     href: "settings.html",     icon: ICONS.settings }
];

let session = null;
let adminUser = null;

export function currentUser() { return adminUser; }

function buildSidebar(active) {
  const side = el("aside", "kzd-ad__side");
  side.id = "kzd-ad-side";

  const brand = el("a", "kzd-ad__brand");
  brand.href = "index.html";
  const mark = el("img");
  mark.src = "../Assets/logos/kzd-mark.png";
  mark.alt = "";
  mark.width = 96; mark.height = 95;
  brand.appendChild(mark);
  brand.appendChild(el("span", "kzd-ad__brand-word", "KZD Admin"));
  side.appendChild(brand);

  const me = el("div", "kzd-ad__me");
  const name = adminUser ? `${adminUser.firstName} ${adminUser.lastName}`.trim() : "Administrator";
  me.appendChild(el("div", "kzd-ad__me-avatar", initials(name)));
  const meText = el("div", "kzd-ad__me-text");
  meText.appendChild(el("p", "kzd-ad__me-name", name));
  meText.appendChild(el("p", "kzd-ad__me-role", "Administrator"));
  me.appendChild(meText);
  side.appendChild(me);

  const nav = el("nav", "kzd-ad__nav");
  nav.setAttribute("aria-label", "Admin sections");
  const ul = el("ul");
  NAV.forEach((item) => {
    const li = el("li");
    const a = el("a");
    a.href = item.href;
    if (item.id === active) a.setAttribute("aria-current", "page");
    a.appendChild(svg(item.icon));
    a.appendChild(el("span", null, item.label));
    li.appendChild(a);
    ul.appendChild(li);
  });
  nav.appendChild(ul);
  side.appendChild(nav);

  const foot = el("div", "kzd-ad__side-foot");
  foot.appendChild(el("p", "kzd-ad__side-foot-text", "Signed in as admin"));
  const out = el("button", "kzd-ad__signout", "Sign out");
  out.type = "button";
  out.addEventListener("click", signOut);
  foot.appendChild(out);
  side.appendChild(foot);

  return side;
}

function signOut() {
  store.clearSessionSync();
  location.href = "../index.html";
}

/* Search ------------------------------------------------------------------ */

function buildSearch() {
  const wrap = el("div", "kzd-ad__search");

  const toggle = el("button", "kzd-ad__search-toggle");
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Search");
  toggle.appendChild(svg(ICONS.search));
  wrap.appendChild(toggle);

  const form = el("div", "kzd-ad__search-form");
  form.appendChild(svg(ICONS.search, {})).setAttribute("class", "kzd-ad__search-icon");
  const input = el("input", "kzd-ad__search-input");
  input.type = "search";
  input.placeholder = "Search applicants or roles";
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", "kzd-ad-results");
  input.setAttribute("aria-autocomplete", "list");
  form.appendChild(input);
  wrap.appendChild(form);

  const results = el("div", "kzd-ad__results");
  results.id = "kzd-ad-results";
  results.setAttribute("role", "listbox");
  results.hidden = true;
  wrap.appendChild(results);

  toggle.addEventListener("click", () => {
    wrap.classList.toggle("is-open");
    if (wrap.classList.contains("is-open")) input.focus();
  });

  let items = [];
  let active = -1;
  let timer = null;

  function close() {
    results.hidden = true;
    input.setAttribute("aria-expanded", "false");
    active = -1;
  }

  function paintActive() {
    items.forEach((n, i) => n.classList.toggle("is-active", i === active));
    if (active >= 0 && items[active]) items[active].scrollIntoView({ block: "nearest" });
  }

  async function run(q) {
    results.textContent = "";
    items = [];
    active = -1;

    if (!q.trim()) { close(); return; }

    let res;
    try {
      res = await store.search(q);
    } catch (err) {
      results.appendChild(errorBlock("Search failed.", () => run(q)));
      results.hidden = false;
      return;
    }

    if (!res.applicants.length && !res.jobs.length) {
      results.appendChild(el("p", "kzd-ad__results-empty", `No matches for "${q}"`));
      results.hidden = false;
      input.setAttribute("aria-expanded", "true");
      return;
    }

    const addGroup = (title, rows, render, go) => {
      if (!rows.length) return;
      results.appendChild(el("p", "kzd-ad__results-group", title));
      rows.forEach((row) => {
        const b = el("button", "kzd-ad__result");
        b.type = "button";
        b.setAttribute("role", "option");
        render(b, row);
        b.addEventListener("click", () => { close(); go(row); });
        results.appendChild(b);
        items.push(b);
      });
    };

    addGroup("Applicants", res.applicants, (b, a) => {
      b.appendChild(el("span", "kzd-ad__ini", initials(a.fullName)));
      const t = el("span");
      t.appendChild(el("span", "kzd-ad__result-main", a.fullName));
      t.appendChild(document.createElement("br"));
      t.appendChild(el("span", "kzd-ad__result-sub", `${a.email} · ${a.jobTitle}`));
      b.appendChild(t);
    }, (a) => {
      if (window.KZDAdminOpenApplicant) window.KZDAdminOpenApplicant(a.id);
      else location.href = `applications.html?open=${encodeURIComponent(a.id)}`;
    });

    addGroup("Employees", res.employees || [], (b, e) => {
      b.appendChild(el("span", "kzd-ad__ini", initials(`${e.firstName} ${e.lastName}`)));
      const t = el("span");
      t.appendChild(el("span", "kzd-ad__result-main", `${e.firstName} ${e.lastName}`));
      t.appendChild(document.createElement("br"));
      t.appendChild(el("span", "kzd-ad__result-sub", `${e.role} · ${e.department}`));
      b.appendChild(t);
    }, (e) => {
      if (window.KZDAdminOpenEmployee) window.KZDAdminOpenEmployee(e.id);
      else location.href = `employees.html?open=${encodeURIComponent(e.id)}`;
    });

    addGroup("Job postings", res.jobs, (b, j) => {
      const tile = el("span", "kzd-ad__ini");
      tile.appendChild(svg(ICONS.brief));
      b.appendChild(tile);
      const t = el("span");
      t.appendChild(el("span", "kzd-ad__result-main", j.title));
      t.appendChild(document.createElement("br"));
      t.appendChild(el("span", "kzd-ad__result-sub", `${j.department} · ${j.location} · ${j.status}`));
      b.appendChild(t);
    }, (j) => { location.href = `jobs.html?edit=${encodeURIComponent(j.id)}`; });

    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  input.addEventListener("input", () => {
    if (timer) clearTimeout(timer);
    const q = input.value;
    timer = setTimeout(() => run(q), 250);      // debounced, as specified
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { close(); input.blur(); return; }
    if (results.hidden || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % items.length; paintActive(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + items.length) % items.length; paintActive(); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); items[active].click(); }
  });

  document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(); });

  return wrap;
}

/* Notifications ----------------------------------------------------------- */

function buildBell() {
  const wrap = el("div", "kzd-ad__bell-wrap");

  const btn = el("button", "kzd-ad__bell");
  btn.type = "button";
  btn.setAttribute("aria-label", "Notifications");
  btn.setAttribute("aria-expanded", "false");
  btn.appendChild(svg(ICONS.bell));
  const badge = el("span", "kzd-ad__badge");
  badge.hidden = true;
  btn.appendChild(badge);
  wrap.appendChild(btn);

  const panel = el("div", "kzd-ad__panel");
  panel.hidden = true;
  const head = el("div", "kzd-ad__panel-head");
  head.appendChild(el("span", null, "Notifications"));
  panel.appendChild(head);
  const body = el("div", "kzd-ad__panel-body");
  panel.appendChild(body);
  const foot = el("div", "kzd-ad__panel-foot");
  const markAll = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Mark all as read");
  markAll.type = "button";
  markAll.style.width = "100%";
  foot.appendChild(markAll);
  panel.appendChild(foot);
  wrap.appendChild(panel);

  async function refresh() {
    let list;
    try {
      list = await store.getNotifications();
    } catch (err) {
      body.textContent = "";
      body.appendChild(errorBlock("Could not load notifications.", refresh));
      return;
    }

    const unread = list.filter((n) => !n.read).length;
    badge.textContent = String(unread);
    badge.hidden = unread === 0;

    body.textContent = "";
    if (!list.length) {
      body.appendChild(el("p", "kzd-ad__empty", "Nothing yet"));
      return;
    }

    list.forEach((n) => {
      const b = el("button", "kzd-ad__note" + (n.read ? "" : " is-unread"));
      b.type = "button";
      b.appendChild(el("p", "kzd-ad__note-title", n.title));
      b.appendChild(el("p", "kzd-ad__note-detail", n.detail));
      b.appendChild(el("p", "kzd-ad__note-time", relTime(n.at)));
      b.addEventListener("click", async () => {
        try { if (!n.read) await store.markNotificationRead(n.id); } catch (e) { /* still navigate */ }
        await refresh();
        close();
        if (!n.link) return;
        if (n.link.kind === "applicant") {
          if (window.KZDAdminOpenApplicant) window.KZDAdminOpenApplicant(n.link.id);
          else location.href = `applications.html?open=${encodeURIComponent(n.link.id)}`;
        } else if (n.link.kind === "job") {
          location.href = `jobs.html?edit=${encodeURIComponent(n.link.id)}`;
        } else if (n.link.kind === "employee") {
          if (window.KZDAdminOpenEmployee) window.KZDAdminOpenEmployee(n.link.id);
          else location.href = `employees.html?open=${encodeURIComponent(n.link.id)}`;
        }
      });
      body.appendChild(b);
    });
  }

  function open() { panel.hidden = false; btn.setAttribute("aria-expanded", "true"); refresh(); }
  function close() { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); }

  btn.addEventListener("click", () => (panel.hidden ? open() : close()));
  markAll.addEventListener("click", async () => {
    try { await store.markAllNotificationsRead(); await refresh(); toast("All notifications marked as read."); }
    catch (e) { toast(e.message, { error: true }); }
  });

  document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { close(); btn.focus(); } });

  refresh();
  wrap.refresh = refresh;
  return wrap;
}

/* Avatar menu ------------------------------------------------------------- */

function buildAvatarMenu() {
  const wrap = el("div", "kzd-ad__avatar-wrap");
  const name = adminUser ? `${adminUser.firstName} ${adminUser.lastName}`.trim() : "Admin";

  const btn = el("button", "kzd-ad__avatar", initials(name));
  btn.type = "button";
  btn.setAttribute("aria-label", "Account menu");
  btn.setAttribute("aria-expanded", "false");
  wrap.appendChild(btn);

  const menu = el("div", "kzd-ad__menu");
  menu.setAttribute("role", "menu");
  menu.hidden = true;

  const profile = el("a", null, "Profile");
  profile.href = "../profile.html";
  profile.setAttribute("role", "menuitem");
  menu.appendChild(profile);

  const settings = el("a", null, "Settings");
  settings.href = "settings.html";
  settings.setAttribute("role", "menuitem");
  menu.appendChild(settings);

  const out = el("button", "is-danger", "Sign out");
  out.type = "button";
  out.setAttribute("role", "menuitem");
  out.addEventListener("click", signOut);
  menu.appendChild(out);

  wrap.appendChild(menu);

  const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", () => {
    menu.hidden = !menu.hidden;
    btn.setAttribute("aria-expanded", String(!menu.hidden));
  });
  document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { close(); btn.focus(); } });

  return wrap;
}

/* Drawer ------------------------------------------------------------------ */

function wireDrawer(side, burger) {
  const scrim = el("div", "kzd-ad__scrim-side");
  scrim.hidden = true;
  document.body.appendChild(scrim);

  let lastFocus = null;

  function focusables() {
    return Array.from(side.querySelectorAll("a[href], button:not([disabled])"))
      .filter((n) => n.offsetWidth > 0 || n.offsetHeight > 0);
  }

  function onKey(e) {
    if (!side.classList.contains("is-open")) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!side.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open() {
    lastFocus = document.activeElement;
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add("is-open"));
    side.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    const f = focusables();
    if (f.length) f[0].focus();
  }

  function close() {
    side.classList.remove("is-open");
    scrim.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setTimeout(() => { scrim.hidden = true; }, reduced() ? 0 : 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  burger.addEventListener("click", () => (side.classList.contains("is-open") ? close() : open()));
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

/**
 * Builds the shell and hands back the page body element to render into.
 * Rejects (and redirects) when there is no admin session.
 */
export async function mountShell({ active, title, subtitle = "" }) {
  session = await store.getSession();
  const ok = await store.isAdmin();

  if (!ok) {
    // Cosmetic guard only — see the banner at the top of this file. It hides
    // the UI; it does not protect the data.
    // Sending people to the sign-in modal with a route back beats bouncing
    // them to the homepage, which just looks like the page is broken.
    location.replace("../careers.html?signin=1&next=admin/index.html");
    throw new Error("redirecting");
  }

  adminUser = store.getUsersSync().find((u) => u.email === session.email) || null;

  document.body.classList.add("kzd-ad");

  const side = buildSidebar(active);
  document.body.appendChild(side);

  const main = el("div", "kzd-ad__main");

  const top = el("header", "kzd-ad__top");
  const burger = el("button", "kzd-ad__burger");
  burger.type = "button";
  burger.setAttribute("aria-label", "Open menu");
  burger.setAttribute("aria-controls", "kzd-ad-side");
  burger.setAttribute("aria-expanded", "false");
  burger.appendChild(svg(ICONS.burger));
  top.appendChild(burger);

  const titles = el("div", "kzd-ad__titles");
  titles.appendChild(el("h1", "kzd-ad__title", title));
  const sub = el("p", "kzd-ad__subtitle", subtitle);
  titles.appendChild(sub);
  top.appendChild(titles);

  top.appendChild(buildSearch());
  const bell = buildBell();
  top.appendChild(bell);
  top.appendChild(buildAvatarMenu());

  main.appendChild(top);

  const page = el("main", "kzd-ad__page");
  main.appendChild(page);
  document.body.appendChild(main);

  wireDrawer(side, burger);

  return {
    page,
    setSubtitle: (text) => { sub.textContent = text; },
    refreshBell: () => bell.refresh()
  };
}

/* ==========================================================================
   KZD Admin — OVERVIEW

   Every number on this page is derived from the store. Nothing is hardcoded:
   delete all the applications and the stats read 0 and the chart shows its
   empty state; add one dated today and the last chart point moves.
   ========================================================================== */

import {
  store, el, svg, ICONS, fmtDate, initials, stageChip, reduced,
  mountShell, toast, errorBlock, modal, closeModal, confirmDialog
} from "./kzd-admin.js";
import { openApplicant } from "./kzd-admin-applicant.js";

const WEEKS = 6;

/* --------------------------------------------------------------------------
   Derivations
   -------------------------------------------------------------------------- */

/** Start of the ISO week (Monday 00:00) containing `d`. */
function weekStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;          // Mon = 0
  x.setDate(x.getDate() - day);
  return x;
}

/**
 * Buckets applications into the last six ISO weeks by applied date.
 * Returns [{ label, from, to, count }] oldest first.
 */
export function bucketByWeek(apps, weeks = WEEKS) {
  const thisWeek = weekStart(new Date());
  const buckets = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const from = new Date(thisWeek);
    from.setDate(from.getDate() - i * 7);
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    buckets.push({ label: `W${weeks - i}`, from, to, count: 0 });
  }

  apps.forEach((a) => {
    const t = new Date(a.submittedAt);
    if (isNaN(t)) return;
    const ws = weekStart(t).getTime();
    const hit = buckets.find((b) => b.from.getTime() === ws);
    if (hit) hit.count += 1;
  });

  return buckets;
}

function shortDate(d) {
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${M[d.getMonth()]}`;
}

/* --------------------------------------------------------------------------
   Chart — inline SVG, one series, no library.
   -------------------------------------------------------------------------- */

function buildChart(buckets) {
  const wrap = el("div", "kzd-ad__chart");

  const total = buckets.reduce((s, b) => s + b.count, 0);
  if (!total) {
    wrap.appendChild(el("p", "kzd-ad__chart-empty", "No applications yet"));
    return wrap;
  }

  const W = 700, H = 260;
  const padL = 38, padR = 12, padT = 14, padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Y scales to the data, never a fixed maximum.
  const peak = Math.max(...buckets.map((b) => b.count));
  const step = peak <= 4 ? 1 : Math.ceil(peak / 4);
  const top = Math.max(step * 4, step * Math.ceil(peak / step));

  const x = (i) => padL + (buckets.length === 1 ? plotW / 2 : (i / (buckets.length - 1)) * plotW);
  const y = (v) => padT + plotH - (v / top) * plotH;

  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", `0 0 ${W} ${H}`);
  s.setAttribute("role", "img");
  s.setAttribute("aria-label",
    `Applications per week for the last ${buckets.length} weeks: ` +
    buckets.map((b) => `${b.label} ${b.count}`).join(", "));

  const mk = (tag, attrs) => {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
    return n;
  };

  // Gridlines + Y labels
  for (let v = 0; v <= top; v += step) {
    s.appendChild(mk("line", { x1: padL, x2: W - padR, y1: y(v), y2: y(v), stroke: "#E7ECF3", "stroke-width": 1 }));
    const t = mk("text", { x: padL - 10, y: y(v) + 4, "text-anchor": "end", "font-size": 11, fill: "#9298A4" });
    t.textContent = String(v);
    s.appendChild(t);
  }

  const pts = buckets.map((b, i) => [x(i), y(b.count)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

  s.appendChild(mk("path", {
    d: `${line} L${pts[pts.length - 1][0].toFixed(1)} ${padT + plotH} L${pts[0][0].toFixed(1)} ${padT + plotH} Z`,
    fill: "#2F6FED", "fill-opacity": ".13"
  }));
  s.appendChild(mk("path", { d: line, fill: "none", stroke: "#2F6FED", "stroke-width": 2.4, "stroke-linejoin": "round", "stroke-linecap": "round" }));

  // X labels — thinned on narrow viewports.
  const thin = window.matchMedia("(max-width: 900px)").matches;
  buckets.forEach((b, i) => {
    if (thin && i % 2 === 1 && i !== buckets.length - 1) return;
    const t = mk("text", { x: x(i), y: H - 8, "text-anchor": "middle", "font-size": 11, fill: "#9298A4" });
    t.textContent = b.label;
    s.appendChild(t);
  });

  const tip = el("div", "kzd-ad__tip");
  tip.hidden = true;

  buckets.forEach((b, i) => {
    const dot = mk("circle", { cx: x(i), cy: y(b.count), r: 5, fill: "#FFFFFF", stroke: "#2F6FED", "stroke-width": 2.4, class: "kzd-ad__chart-dot", tabindex: "0" });
    dot.setAttribute("role", "button");
    dot.setAttribute("aria-label", `${b.label}: ${b.count} application${b.count === 1 ? "" : "s"}, ${shortDate(b.from)} to ${shortDate(b.to)}`);

    const show = () => {
      tip.textContent = `${b.count} application${b.count === 1 ? "" : "s"} · ${shortDate(b.from)}–${shortDate(b.to)}`;
      tip.hidden = false;
      tip.style.left = `${(x(i) / W) * 100}%`;
      tip.style.top = `${(y(b.count) / H) * 100 - 4}%`;
    };
    const hide = () => { tip.hidden = true; };

    dot.addEventListener("mouseenter", show);
    dot.addEventListener("mouseleave", hide);
    dot.addEventListener("focus", show);
    dot.addEventListener("blur", hide);
    s.appendChild(dot);
  });

  wrap.appendChild(s);
  wrap.appendChild(tip);
  return wrap;
}

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

const ROLE_COLOURS = ["#2F6FED", "#7C5CD6", "#D6961E", "#1C9E5E", "#FF6B35"];

async function render(page, shell) {
  page.textContent = "";

  // Loading state first, so it is real rather than theoretical.
  const loading = el("div");
  const statSkel = el("div", "kzd-ad__stats");
  for (let i = 0; i < 4; i++) {
    const c = el("div", "kzd-ad__card");
    const a = el("div", "kzd-ad__skel"); a.style.width = "45%";
    const b = el("div", "kzd-ad__skel"); b.style.width = "30%"; b.style.height = "28px"; b.style.marginTop = "12px";
    c.appendChild(a); c.appendChild(b);
    statSkel.appendChild(c);
  }
  loading.appendChild(statSkel);
  const chartSkel = el("div", "kzd-ad__card");
  const cs = el("div", "kzd-ad__skel"); cs.style.height = "240px";
  chartSkel.appendChild(cs);
  loading.appendChild(chartSkel);
  page.appendChild(loading);

  let apps, jobs;
  try {
    [apps, jobs] = await Promise.all([store.getApplications(), store.getJobs()]);
  } catch (err) {
    page.textContent = "";
    page.appendChild(errorBlock(`Could not load the dashboard. ${err.message}`, () => render(page, shell)));
    return;
  }

  page.textContent = "";

  const openJobs = jobs.filter((j) => j.status === "open");
  const count = (s) => apps.filter((a) => (a.stage || "applied") === s).length;
  const needAction = count("applied") + count("reviewing");

  shell.setSubtitle(`${apps.length} total · ${needAction} need action`);

  /* --- stat cards ------------------------------------------------------- */

  const stats = el("div", "kzd-ad__stats");

  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = apps.filter((a) => new Date(a.submittedAt).getTime() >= weekAgo).length;
  const drafts = jobs.filter((j) => j.status === "draft").length;
  const offers = count("offer");
  const interviews = count("interviewing");

  [
    { label: "Applications", value: apps.length, note: `+${thisWeek} this week`,
      accent: "#2F6FED", tint: "#E0EAFD", icon: ICONS.users, go: "all" },
    { label: "Open roles", value: openJobs.length,
      // Derived, like every other note. Jobs carry no closing date, so this
      // reports drafts rather than inventing a "closing soon" count.
      note: drafts ? `${drafts} in draft` : (openJobs.length ? "All accepting applications" : "None published"),
      accent: "#FF6B35", tint: "#FFEEE6", icon: ICONS.brief, go: null },
    { label: "Interviews", value: interviews,
      note: interviews ? `${interviews} scheduled` : "None scheduled",
      accent: "#D6961E", tint: "#FDF3DE", icon: ICONS.users, go: "interviewing" },
    { label: "Offers made", value: offers,
      note: offers ? "Awaiting response" : "None yet",
      accent: "#1C9E5E", tint: "#E4F7ED", icon: ICONS.brief, go: "offer" }
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

    if (c.go) {
      b.addEventListener("click", () => { location.href = `applications.html?status=${c.go}`; });
    } else {
      b.addEventListener("click", () => { location.href = "jobs.html"; });
    }
    stats.appendChild(b);
  });
  page.appendChild(stats);

  /* --- chart + by role -------------------------------------------------- */

  const grid = el("div", "kzd-ad__grid");

  const chartCard = el("section", "kzd-ad__card");
  chartCard.appendChild(el("h2", "kzd-ad__card-title", "Applications over time"));
  chartCard.appendChild(el("p", "kzd-ad__card-sub", `Last ${WEEKS} weeks`));
  chartCard.appendChild(buildChart(bucketByWeek(apps)));
  grid.appendChild(chartCard);

  const roleCard = el("section", "kzd-ad__card");
  roleCard.appendChild(el("h2", "kzd-ad__card-title", "By role"));

  const perRole = openJobs
    .map((j) => ({ job: j, n: apps.filter((a) => a.jobId === j.id).length }))
    .sort((a, b) => b.n - a.n);
  const peak = Math.max(1, ...perRole.map((r) => r.n));

  if (!perRole.length) {
    roleCard.appendChild(el("p", "kzd-ad__empty", "No open roles"));
  } else {
    perRole.forEach((r, i) => {
      const row = el("div", "kzd-ad__role");
      const top = el("div", "kzd-ad__role-top");
      top.appendChild(el("span", "kzd-ad__role-name", r.job.title));
      top.appendChild(el("span", "kzd-ad__role-count", String(r.n)));
      row.appendChild(top);
      const track = el("div", "kzd-ad__role-track");
      const bar = el("span", "kzd-ad__role-bar");
      bar.style.background = ROLE_COLOURS[i % ROLE_COLOURS.length];
      // Final value set directly: the CSS keyframe grows it from zero, so the
      // resting state is correct even if no animation frame ever runs.
      bar.style.width = `${(r.n / peak) * 100}%`;
      track.appendChild(bar);
      row.appendChild(track);
      roleCard.appendChild(row);
    });
  }
  grid.appendChild(roleCard);
  page.appendChild(grid);

  /* --- recent ----------------------------------------------------------- */

  const recentCard = el("section", "kzd-ad__card");
  const head = el("div", "kzd-ad__card-head");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.justifyContent = "space-between";
  head.appendChild(el("h2", "kzd-ad__card-title", "Recent applications"));
  const viewAll = el("a", null, "View all");
  viewAll.href = "applications.html";
  viewAll.style.color = "#2F6FED";
  viewAll.style.fontSize = "14.5px";
  viewAll.style.textDecoration = "none";
  head.appendChild(viewAll);
  recentCard.appendChild(head);

  const recent = apps.slice(0, 5);
  if (!recent.length) {
    recentCard.appendChild(el("p", "kzd-ad__empty", "No applications yet"));
  } else {
    const table = el("table", "kzd-ad__table");
    const thead = el("thead");
    const hr = el("tr");
    ["Applicant", "Role", "Applied", "Status"].forEach((h) => hr.appendChild(el("th", null, h)));
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = el("tbody");
    recent.forEach((a) => {
      const tr = el("tr");
      tr.tabIndex = 0;

      const c1 = el("td");
      c1.dataset.cell = "applicant";
      const person = el("div", "kzd-ad__person");
      person.appendChild(el("span", "kzd-ad__ini", initials(a.fullName)));
      const who = el("div");
      who.appendChild(el("div", "kzd-ad__person-name", a.fullName));
      person.appendChild(who);
      c1.appendChild(person);
      tr.appendChild(c1);

      const c2 = el("td", null, a.jobTitle || "—"); c2.dataset.cell = "role"; tr.appendChild(c2);
      const c3 = el("td", null, fmtDate(a.submittedAt)); c3.dataset.cell = "applied"; tr.appendChild(c3);
      const c4 = el("td"); c4.dataset.cell = "status"; c4.appendChild(stageChip(a.stage)); tr.appendChild(c4);

      const open = () => openApplicant(a.id, { onChange: () => render(page, shell) });
      tr.addEventListener("click", open);
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    recentCard.appendChild(table);
  }
  page.appendChild(recentCard);
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

(async () => {
  let shell;
  try {
    shell = await mountShell({ active: "overview", title: "Overview", subtitle: "Careers activity at a glance" });
  } catch (e) {
    return;                                  // redirecting, nothing to draw
  }

  // Lets the shell's search and notifications open an applicant here.
  window.KZDAdminOpenApplicant = (id) =>
    openApplicant(id, { onChange: () => render(shell.page, shell) });

  await render(shell.page, shell);
})();

/* ==========================================================================
   KZD Admin — SETTINGS

   Deliberately small. Everything here is honest about what a static frontend
   can and cannot do: the controls that cannot work yet are visibly disabled
   with a reason, rather than present and dead.
   ========================================================================== */

import {
  store, el, svg, ICONS, mountShell, toast, errorBlock, confirmDialog, currentUser
} from "./kzd-admin.js";

let shell, page;

function card(title, sub) {
  const box = el("section", "kzd-ad__cms-sec");
  const head = el("div", "kzd-ad__cms-head");
  const t = el("div");
  t.appendChild(el("h2", "kzd-ad__card-title", title));
  if (sub) t.appendChild(el("p", "kzd-ad__card-sub", sub));
  head.appendChild(t);
  box.appendChild(head);
  return box;
}

function readOnly(host, label, value) {
  const wrap = el("div", "kzd-ad__field");
  wrap.appendChild(el("label", "kzd-ad__label", label));
  const v = el("p", "kzd-ad__pair-value", value || "—");
  wrap.appendChild(v);
  host.appendChild(wrap);
}

function disabledControl(host, label, why, buttonLabel) {
  const row = el("div", "kzd-ad__file");
  const icon = el("span", "kzd-ad__file-icon");
  icon.appendChild(svg(ICONS.doc));
  row.appendChild(icon);
  const t = el("div");
  t.style.flex = "1 1 auto";
  t.appendChild(el("div", "kzd-ad__file-name", label));
  t.appendChild(el("div", "kzd-ad__file-size", why));
  row.appendChild(t);
  const b = el("button", "kzd-ad__btn kzd-ad__btn--ghost", buttonLabel);
  b.type = "button";
  b.disabled = true;
  b.title = why;
  row.appendChild(b);
  host.appendChild(row);
}

(async () => {
  try {
    shell = await mountShell({ active: "settings", title: "Settings" });
  } catch (e) { return; }
  page = shell.page;

  const me = currentUser();
  shell.setSubtitle(me ? me.email : "");

  /* --- account --------------------------------------------------------- */
  const acc = card("Your account", "Read from the prototype account store");
  readOnly(acc, "Name", me ? `${me.firstName} ${me.lastName}`.trim() : "—");
  readOnly(acc, "Email", me ? me.email : "—");
  readOnly(acc, "Role", me ? me.role || "user" : "—");

  // TODO(backend): PATCH /api/auth/password. Passwords are plain text in
  // localStorage today (see the banner in js/kzd-store.js), so offering a
  // change here would imply a security model that does not exist.
  disabledControl(acc, "Change password",
    "Available once accounts move to the server", "Change");
  page.appendChild(acc);

  /* --- integrations ---------------------------------------------------- */
  const integ = card("Integrations", "None of these can run from a static frontend");

  /* TODO(backend): Google Drive archiving needs OAuth with a server-side token
     exchange and the Drive API v3. Intended folder structure:
         /KZD Careers/{year}/{role}/{applicant name}/ */
  disabledControl(integ, "Google Drive",
    "Connects once Drive integration is added", "Connect");

  // TODO(backend): applicant email needs a server and a sending domain.
  disabledControl(integ, "Email notifications to applicants",
    "Requires a mail service on the server", "Configure");
  page.appendChild(integ);

  /* --- data ------------------------------------------------------------ */
  const data = card("Data", "Everything lives in this browser only");

  const warn = el("div", "kzd-ad__error");
  warn.style.background = "#FFF8E9";
  warn.style.borderColor = "#F5DDA8";
  warn.style.color = "#8A6414";
  warn.appendChild(el("span", null,
    "This prototype stores every application, job posting and content edit in this browser's localStorage. " +
    "Clearing site data deletes all of it, and nothing is shared between devices."));
  data.appendChild(warn);

  const counts = el("div", "kzd-ad__pairs");
  counts.style.marginTop = "18px";
  data.appendChild(counts);

  const exportRow = el("div", "kzd-ad__cms-actions");
  exportRow.style.marginTop = "20px";

  const dump = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Export all data as JSON");
  dump.type = "button";
  exportRow.appendChild(dump);

  const wipe = el("button", "kzd-ad__btn kzd-ad__btn--danger", "Reset demo data");
  wipe.type = "button";
  exportRow.appendChild(wipe);
  data.appendChild(exportRow);
  page.appendChild(data);

  async function paintCounts() {
    counts.textContent = "";
    try {
      const [jobs, apps, notes] = await Promise.all([
        store.getJobs(), store.getApplications(), store.getNotifications()
      ]);
      [["Job postings", jobs.length], ["Applications", apps.length],
       ["Notifications", notes.length], ["Unread", notes.filter((n) => !n.read).length]]
        .forEach(([k, v]) => {
          const d = el("div");
          d.appendChild(el("span", "kzd-ad__pair-label", k));
          d.appendChild(el("span", "kzd-ad__pair-value", String(v)));
          counts.appendChild(d);
        });

      dump.onclick = async () => {
        const payload = { exportedAt: new Date().toISOString(), jobs, applications: apps, notifications: notes };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = el("a");
        a.href = url;
        a.download = `kzd-admin-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast("Data exported.");
      };
    } catch (err) {
      counts.appendChild(errorBlock(`Could not read the store. ${err.message}`, paintCounts));
    }
  }

  wipe.addEventListener("click", async () => {
    const ok = await confirmDialog({
      title: "Reset the demo data?",
      body: "Every application, job posting and content edit in this browser will be deleted and the original demo data restored. This cannot be undone.",
      confirmLabel: "Reset everything"
    });
    if (!ok) return;
    try {
      await store.resetDemoData();
      toast("Demo data restored.");
      paintCounts();
      shell.refreshBell();
    } catch (err) {
      toast(`Could not reset. ${err.message}`, { error: true });
    }
  });

  await paintCounts();
})();

/* ==========================================================================
   KZD Admin — APPLICANT DETAIL MODAL

   Shared by Overview and Applications. Opening it, moving a stage and
   scheduling an interview all go through js/kzd-store.js, which is the same
   store the applicant's own job tracker (profile.html) reads — so a move here
   shows up there without either page knowing about the other.
   ========================================================================== */

import {
  store, el, svg, ICONS, fmtDate, fmtSize, initials, stageChip,
  modal, closeModal, toast, errorBlock, confirmDialog, STAGE_LABEL
} from "./kzd-admin.js";

/* --------------------------------------------------------------------------
   Small builders
   -------------------------------------------------------------------------- */

function pair(label, value) {
  const d = el("div");
  d.appendChild(el("span", "kzd-ad__pair-label", label));
  d.appendChild(el("span", "kzd-ad__pair-value", value || "—"));
  return d;
}

function field(form, { id, label, type = "text", value = "", required = false, placeholder = "", options = null, textarea = false, min = null }) {
  const wrap = el("div", "kzd-ad__field");
  const l = el("label", "kzd-ad__label", label);
  l.setAttribute("for", "kzd-ad-" + id);
  wrap.appendChild(l);

  let input;
  if (options) {
    input = el("select", "kzd-ad__select");
    options.forEach((o) => {
      const opt = el("option", null, o);
      opt.value = o;
      input.appendChild(opt);
    });
  } else if (textarea) {
    input = el("textarea", "kzd-ad__textarea");
    input.placeholder = placeholder;
  } else {
    input = el("input", "kzd-ad__input");
    input.type = type;
    input.placeholder = placeholder;
    if (min) input.min = min;
  }
  input.id = "kzd-ad-" + id;
  input.dataset.field = id;
  input.value = value;
  if (required) input.required = true;
  wrap.appendChild(input);

  const err = el("p", "kzd-ad__err");
  err.id = "kzd-ad-" + id + "-error";
  wrap.appendChild(err);

  form.appendChild(wrap);
  return { wrap, input, err };
}

function setError(f, message) {
  f.wrap.classList.toggle("has-error", !!message);
  f.err.textContent = message || "";
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/* --------------------------------------------------------------------------
   The modal
   -------------------------------------------------------------------------- */

/**
 * @param {string} id  application id
 * @param {object} opts { onChange } — called after any successful stage change
 *                      so the caller can re-render its own counts and rows.
 */
export async function openApplicant(id, opts = {}) {
  let app;
  try {
    app = await store.getApplication(id);
  } catch (err) {
    toast(`Could not open that applicant. ${err.message}`, { error: true });
    return;
  }

  modal({
    label: `Applicant: ${app.fullName}`,
    build: (box, api) => {
      /* --- header ------------------------------------------------------- */
      const head = el("div", "kzd-ad-modal__head");
      head.appendChild(el("span", "kzd-ad-modal__avatar", initials(app.fullName)));

      const who = el("div");
      who.style.flex = "1 1 auto";
      who.style.minWidth = "0";
      who.appendChild(el("h2", "kzd-ad-modal__name", app.fullName));
      who.appendChild(el("p", "kzd-ad-modal__contact",
        [app.email, app.phone].filter(Boolean).join(" · ")));
      head.appendChild(who);

      const chipHost = el("div");
      chipHost.appendChild(stageChip(app.stage));
      head.appendChild(chipHost);

      const x = el("button", "kzd-ad-modal__close");
      x.type = "button";
      x.setAttribute("aria-label", "Close");
      x.appendChild(svg(ICONS.x));
      x.addEventListener("click", () => api.close());
      head.appendChild(x);
      box.appendChild(head);

      /* --- body --------------------------------------------------------- */
      const body = el("div", "kzd-ad-modal__body");
      box.appendChild(body);

      // Application
      const s1 = el("section", "kzd-ad-modal__section");
      s1.appendChild(el("h3", "kzd-ad-modal__h", "Application"));
      const pairs = el("div", "kzd-ad__pairs");
      pairs.appendChild(pair("Role", app.jobTitle));
      pairs.appendChild(pair("Applied", fmtDate(app.submittedAt)));
      pairs.appendChild(pair("Location", app.location));
      pairs.appendChild(pair("Available from", app.startDate));
      s1.appendChild(pairs);
      body.appendChild(s1);

      // Documents
      const files = [].concat(app.cv || [], app.docs || []);
      const s2 = el("section", "kzd-ad-modal__section");
      s2.appendChild(el("h3", "kzd-ad-modal__h", "Documents"));
      if (!files.length) {
        s2.appendChild(el("p", "kzd-ad__empty", "No documents were attached"));
      } else {
        files.forEach((f) => {
          const row = el("div", "kzd-ad__file");
          const icon = el("span", "kzd-ad__file-icon");
          icon.appendChild(svg(ICONS.doc));
          row.appendChild(icon);
          const meta = el("div");
          meta.style.flex = "1 1 auto";
          meta.appendChild(el("div", "kzd-ad__file-name", f.name));
          meta.appendChild(el("div", "kzd-ad__file-size", fmtSize(f.size)));
          row.appendChild(meta);

          // TODO(backend): wire to GET /api/applications/:id/files/:fileId once
          // real file storage exists. Only the filename and size were ever
          // stored (see js/kzd-job.js), so there is nothing to hand over yet —
          // a working-looking button here would be a lie.
          const dl = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Download");
          dl.type = "button";
          dl.disabled = true;
          dl.title = "Available once file storage is connected";
          dl.setAttribute("aria-label", `Download ${f.name} — available once file storage is connected`);
          row.appendChild(dl);
          s2.appendChild(row);
        });
      }
      body.appendChild(s2);

      // Answers
      const answers = [
        ["Why do you want this role?", app.why],
        ["Tell us about something you have built.", app.built],
        ["How did you hear about this position?", app.source],
        ["Portfolio, GitHub or LinkedIn", app.portfolio],
        ["Skills selected", (app.skills || []).join(", ")]
      ].filter(([, v]) => v && String(v).trim());

      if (answers.length) {
        const s3 = el("section", "kzd-ad-modal__section kzd-ad__answers");
        s3.appendChild(el("h3", "kzd-ad-modal__h", "Answers"));
        answers.forEach(([q, a]) => {
          s3.appendChild(el("span", "kzd-ad__pair-label", q));
          s3.appendChild(el("p", null, a));
        });
        body.appendChild(s3);
      }

      /* --- move --------------------------------------------------------- */
      const s4 = el("section", "kzd-ad-modal__section");
      s4.appendChild(el("h3", "kzd-ad-modal__h", "Move this applicant"));
      const stepHost = el("div");
      s4.appendChild(stepHost);
      body.appendChild(s4);

      /** Writes the stage, then updates everything on screen without a reload. */
      async function commit(stage, meta, message, btn) {
        const spin = el("span", "kzd-ad__spin");
        const label = btn ? btn.textContent : "";
        if (btn) { btn.disabled = true; btn.textContent = ""; btn.appendChild(spin); }
        try {
          const updated = await store.setApplicationStage(app.id, stage, meta);
          app = updated;
          chipHost.textContent = "";
          chipHost.appendChild(stageChip(app.stage));
          showButtons();
          toast(message);
          if (typeof opts.onChange === "function") opts.onChange(app);
        } catch (err) {
          toast(`Could not update the stage. ${err.message}`, { error: true });
          if (btn) { btn.disabled = false; btn.textContent = label; }
        }
      }

      function showButtons() {
        const api2 = api;
        stepHost.textContent = "";

        const row = el("div", "kzd-ad__moves");

        const interview = el("button", "kzd-ad__btn kzd-ad__btn--amber", "Schedule interview");
        interview.type = "button";
        interview.addEventListener("click", showInterview);
        row.appendChild(interview);

        const offer = el("button", "kzd-ad__btn kzd-ad__btn--green", "Make an offer");
        offer.type = "button";
        offer.addEventListener("click", showOffer);
        row.appendChild(offer);

        const no = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Not proceeding");
        no.type = "button";
        no.addEventListener("click", async () => {
          const res = await confirmDialog({
            title: "Mark as not proceeding?",
            body: `${app.fullName} will be moved out of the active pipeline. They are not notified by this prototype.`,
            confirmLabel: "Not proceeding",
            withReason: true
          });
          if (!res) return;
          await commit("rejected", { rejectedReason: res.reason || "" }, `${app.fullName} marked as not proceeding.`);
        });
        row.appendChild(no);

        stepHost.appendChild(row);

        /* The bridge into the Employees module. This is the point of that
           module: an accepted applicant must not vanish at the end of the
           funnel. It carries name, contact, role and documents across, then
           opens the new record so the rest can be completed. */
        if (app.stage === "offer") {
          const convert = el("button", "kzd-ad__btn kzd-ad__btn--blue", "Convert to employee");
          convert.type = "button";
          convert.style.marginTop = "14px";
          convert.addEventListener("click", async () => {
            const label = convert.textContent;
            convert.disabled = true;
            convert.textContent = "";
            convert.appendChild(el("span", "kzd-ad__spin"));
            try {
              const emp = await store.convertApplicantToEmployee(app.id, {});
              toast(`${emp.firstName} ${emp.lastName} added as an employee.`);
              if (typeof opts.onChange === "function") opts.onChange(app);
              api.close();
              if (window.KZDAdminOpenEmployee) window.KZDAdminOpenEmployee(emp.id);
              else location.href = `employees.html?open=${encodeURIComponent(emp.id)}`;
            } catch (err) {
              convert.disabled = false;
              convert.textContent = label;
              toast(err.message, { error: true });
            }
          });
          stepHost.appendChild(convert);
        }

        // Drive archive — the trigger only. See the TODO below.
        if (app.stage === "offer") {
          const drive = el("div", "kzd-ad__file");
          drive.style.marginTop = "16px";
          const icon = el("span", "kzd-ad__file-icon");
          icon.appendChild(svg(ICONS.doc));
          drive.appendChild(icon);
          const t = el("div");
          t.style.flex = "1 1 auto";
          t.appendChild(el("div", "kzd-ad__file-name", "Archive documents to Drive"));
          t.appendChild(el("div", "kzd-ad__file-size", "Connects once Drive integration is added"));
          drive.appendChild(t);

          /* TODO(backend): Google Drive archiving cannot be done from a static
             frontend. It needs OAuth with a server-side token exchange — doing
             it in the browser would expose the client secret — plus the Drive
             API v3 files.create endpoint.
             Intended folder structure:
                 /KZD Careers/{year}/{role}/{applicant name}/
             e.g. /KZD Careers/2026/Junior Web Developer/Thandeka Mkhize/
             The server should copy the CV and every supporting document there
             on the move to Offer, then store the resulting Drive file ids on
             the application record. */
          const go = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Archive");
          go.type = "button";
          go.disabled = true;
          go.title = "Connects once Drive integration is added";
          drive.appendChild(go);
          stepHost.appendChild(drive);
        }

        stepHost.appendChild(el("p", "kzd-ad__movenote",
          "Changing the stage updates the applicant's job tracker immediately."));
      }

      /* Step two happens inside this modal, not in a new dialog. */
      function showInterview() {
        stepHost.textContent = "";
        const form = el("form");
        form.noValidate = true;

        const date = field(form, { id: "iv-date", label: "Interview date", type: "date",
          value: app.interviewAt || "", required: true, min: todayISO() });
        const time = field(form, { id: "iv-time", label: "Time", type: "time",
          value: app.interviewTime || "10:00", required: true });
        const fmt = field(form, { id: "iv-format", label: "Format",
          options: ["In person", "Online", "Phone"], value: app.interviewFormat || "Online" });
        const note = field(form, { id: "iv-note", label: "Note (optional)", textarea: true,
          value: app.interviewNote || "", placeholder: "Anything the applicant should bring or prepare." });

        const row2 = el("div", "kzd-ad__row2");
        row2.appendChild(date.wrap);
        row2.appendChild(time.wrap);
        form.insertBefore(row2, form.firstChild);

        const actions = el("div", "kzd-ad__moves");
        const confirm = el("button", "kzd-ad__btn kzd-ad__btn--amber", "Confirm interview");
        confirm.type = "submit";
        const cancel = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Cancel");
        cancel.type = "button";
        cancel.addEventListener("click", showButtons);
        actions.appendChild(confirm);
        actions.appendChild(cancel);
        form.appendChild(actions);

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          let bad = false;
          setError(date, ""); setError(time, "");

          if (!date.input.value) { setError(date, "Pick a date."); bad = true; }
          else if (date.input.value < todayISO()) { setError(date, "That date is in the past."); bad = true; }
          if (!time.input.value) { setError(time, "Pick a time."); bad = true; }
          if (bad) { (date.wrap.classList.contains("has-error") ? date : time).input.focus(); return; }

          await commit("interviewing", {
            interviewAt: date.input.value,
            interviewTime: time.input.value,
            interviewFormat: fmt.input.value,
            interviewNote: note.input.value.trim()
          }, `Interview scheduled for ${app.fullName}.`, confirm);
        });

        stepHost.appendChild(form);
        date.input.focus();
      }

      function showOffer() {
        stepHost.textContent = "";
        const form = el("form");
        form.noValidate = true;

        const start = field(form, { id: "of-start", label: "Proposed start date", type: "date",
          value: app.offerStartDate || "", required: true, min: todayISO() });
        const note = field(form, { id: "of-note", label: "Note (optional)", textarea: true,
          value: app.offerNote || "", placeholder: "Anything to include with the offer." });

        const actions = el("div", "kzd-ad__moves");
        const confirm = el("button", "kzd-ad__btn kzd-ad__btn--green", "Confirm offer");
        confirm.type = "submit";
        const cancel = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Cancel");
        cancel.type = "button";
        cancel.addEventListener("click", showButtons);
        actions.appendChild(confirm);
        actions.appendChild(cancel);
        form.appendChild(actions);

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          setError(start, "");
          if (!start.input.value) { setError(start, "Pick a start date."); start.input.focus(); return; }
          if (start.input.value < todayISO()) { setError(start, "That date is in the past."); start.input.focus(); return; }
          await commit("offer", {
            offerStartDate: start.input.value,
            offerNote: note.input.value.trim()
          }, `Offer recorded for ${app.fullName}.`, confirm);
        });

        stepHost.appendChild(form);
        start.input.focus();
      }

      showButtons();
    }
  });
}

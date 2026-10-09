/* ==========================================================================
   KZD Solutions — job detail page (job.html?job={id})

   Reads the id from the query string and renders that role out of the store
   (js/kzd-store.js), which is also what the admin dashboard writes to. One page
   for every job; an unknown or missing id renders the not-found state.

   FRONTEND ONLY. There is no server. Applications are written to localStorage
   and nothing is emailed. Every place a real API call belongs is marked
   TODO(backend). Authentication is the localStorage prototype in js/kzd-auth.js
   — read the banner at the top of that file.
   ========================================================================== */

(function () {
  "use strict";

  var DRAFT_KEY = "kzd_application_draft";
  var APPS_KEY = "kzd_applications";
  var SVG_NS = "http://www.w3.org/2000/svg";

  var CV_TYPES = [".pdf", ".doc", ".docx"];
  var CV_MAX = 5 * 1024 * 1024;             // 5MB
  var DOC_TYPES = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
  var DOC_MAX = 10 * 1024 * 1024;           // 10MB total

  var SKILLS = ["WordPress", "WooCommerce", "PHP", "Git", "Figma or Penpot", "Hosting and DNS"];

  var NEXT_TEXT = "You will get an email confirming we have your application. " +
    "Give us 30 days to review. If you have not heard from us by then, your application " +
    "was not successful this time. If you are shortlisted we will contact you with an " +
    "interview date and time.";

  var job = null;
  var section, panelDetails, panelApply, tabDetails, tabApply;

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* Bootstrap Icons sprite (Assets/icons/kzd-icons.svg): the one icon family
     on the site. Pass "#name" wherever path data used to go. */
  function glyph(name, cls) {
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("class", "kzd-icon" + (cls ? " " + cls : ""));
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    var u = document.createElementNS(SVG_NS, "use");
    u.setAttribute("href", "/Assets/icons/kzd-icons.svg#" + name);
    s.appendChild(u);
    return s;
  }

  function svg(viewBox, paths, cls) {
    if (typeof paths === "string" && paths.charAt(0) === "#") return glyph(paths.slice(1), cls);
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("viewBox", viewBox);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    if (cls) s.setAttribute("class", cls);
    (Array.isArray(paths) ? paths : [paths]).forEach(function (d) {
      var p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }

  var ICONS = {
    pin: "#geo-alt",
    clock: "#clock",
    people: "#people",
    arrowLeft: "#arrow-left",
    arrowRight: "#arrow-right",
    upload: "#upload",
    x: "#x-lg",
    info: "#info-circle",
    tick: "#check-lg"
  };

  function metaList(cls) {
    var ul = el("ul", cls);
    [["pin", job.location], ["clock", job.type], ["people", job.department]].forEach(function (pair) {
      if (!pair[1]) return;
      var li = el("li");
      li.appendChild(svg("0 0 24 24", ICONS[pair[0]]));
      li.appendChild(document.createTextNode(pair[1]));
      ul.appendChild(li);
    });
    return ul;
  }

  /* ---------------------------------------------------------------------
     Not found
     --------------------------------------------------------------------- */

  function renderMissing(id) {
    var box = el("div", "kzd-job__missing");
    box.appendChild(el("h1", "kzd-job__missing-title", "Role not found"));
    box.appendChild(el("p", "kzd-job__missing-body",
      id ? 'We could not find a role with the id "' + id + '". It may have been filled or removed.'
         : "No role was specified. Pick one from the current openings."));
    var a = el("a", "kzd-job__missing-link", "See all positions");
    a.href = "careers.html";
    a.appendChild(svg("0 0 24 24", ICONS.arrowRight));
    box.appendChild(a);

    var inner = section.querySelector(".kzd-job__inner-missing");
    inner.appendChild(box);
    inner.hidden = false;
    section.querySelector(".kzd-job__head").hidden = true;
    section.querySelector(".kzd-job__tabs-wrap").hidden = true;
    panelDetails.hidden = true;
    panelApply.hidden = true;
    document.title = "Role not found | KZD Solutions";
  }

  /* ---------------------------------------------------------------------
     Header
     --------------------------------------------------------------------- */

  function renderHead() {
    var back = section.querySelector(".kzd-job__back");
    back.insertBefore(svg("0 0 24 24", ICONS.arrowLeft), back.firstChild);

    var h = section.querySelector(".kzd-job__head-in");
    var t = el("h1", "kzd-job__title", job.title);
    t.id = "kzd-job-title";
    h.appendChild(t);
    h.appendChild(metaList("kzd-job__meta"));

    document.title = job.title + " | Careers at KZD Solutions";
  }

  /* ---------------------------------------------------------------------
     Tab 1 — job details
     --------------------------------------------------------------------- */

  function bulletList(items, ember) {
    var ul = el("ul", "kzd-job__list" + (ember ? " kzd-job__list--ember" : ""));
    items.forEach(function (item) {
      var li = el("li");
      if (typeof item === "string") {
        li.textContent = item;
      } else {
        li.appendChild(el("span", "kzd-job__lead", item.title));
        li.appendChild(document.createTextNode(item.body || ""));
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function sectionBlock(heading, node) {
    var s = el("section", "kzd-job__section kzd-job__rise");
    s.appendChild(el("h2", "kzd-job__h2", heading));
    s.appendChild(node);
    return s;
  }

  function applyButton(label, cls) {
    var b = el("button", "kzd-job__btn kzd-job__btn--primary" + (cls ? " " + cls : ""), label);
    b.type = "button";
    b.addEventListener("click", function () { requireAccount(b, function () { showTab("apply"); }); });
    return b;
  }

  function renderDetails() {
    var d = job.detail || {};
    var grid = el("div", "kzd-job__grid");

    /* --- left column --- */
    var main = el("div", "kzd-job__main");

    if (d.description && d.description.length) {
      var wrap = el("div");
      d.description.forEach(function (p) { wrap.appendChild(el("p", "kzd-job__p", p)); });
      main.appendChild(sectionBlock("Job description", wrap));
    }
    if (d.why && d.why.length) main.appendChild(sectionBlock("Why KZD Solutions?", bulletList(d.why, true)));
    if (d.workOn && d.workOn.length) main.appendChild(sectionBlock("What you will work on", bulletList(d.workOn)));
    if (d.lookingFor && d.lookingFor.length) main.appendChild(sectionBlock("What we are looking for", bulletList(d.lookingFor)));
    if (d.niceToHave && d.niceToHave.length) main.appendChild(sectionBlock("Nice to have", bulletList(d.niceToHave)));
    if (d.offer && d.offer.length) main.appendChild(sectionBlock("What we offer", bulletList(d.offer, true)));

    // Second call to action, so someone who read to the bottom need not scroll up.
    var tail = el("div", "kzd-job__tail");
    if (job.status === "closed") {
      var closed = el("p", "kzd-job__p", "This role has been filled and is no longer accepting applications.");
      closed.style.marginTop = "0";
      tail.appendChild(closed);
    } else {
      tail.appendChild(applyButton("Apply for this role", "kzd-job__btn--inline"));
    }
    main.appendChild(tail);

    /* --- sidebar --- */
    var side = el("aside", "kzd-job__side");
    var actions = el("div", "kzd-job__side-actions");

    if (job.status !== "closed") {
      actions.appendChild(applyButton("Apply for this role"));
    }

    var share = el("button", "kzd-job__btn kzd-job__btn--ghost", "Share this job");
    share.type = "button";
    var copied = el("p", "kzd-job__copied", "Link copied");
    copied.setAttribute("role", "status");

    share.addEventListener("click", function () {
      var url = window.location.href;
      function flash() {
        copied.classList.add("is-on");
        window.setTimeout(function () { copied.classList.remove("is-on"); }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(flash, fallback);
      } else { fallback(); }

      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); flash(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });

    actions.appendChild(share);
    side.appendChild(actions);
    side.appendChild(copied);
    side.appendChild(metaList("kzd-job__side-meta"));

    grid.appendChild(main);
    grid.appendChild(side);
    panelDetails.querySelector(".kzd-job__inner").appendChild(grid);
  }

  /* ---------------------------------------------------------------------
     Tab 2 — application form
     --------------------------------------------------------------------- */

  var fields = {};

  function makeField(opts) {
    var wrap = el("div", "kzd-job__field");
    var lab = el("label", "kzd-job__label");
    lab.setAttribute("for", opts.id);
    lab.appendChild(document.createTextNode(opts.label));
    if (opts.required) {
      var star = el("span", "kzd-job__req", "*");
      star.setAttribute("aria-hidden", "true");
      lab.appendChild(star);
    }
    wrap.appendChild(lab);

    var input;
    if (opts.tag === "textarea") {
      input = el("textarea", "kzd-job__textarea");
    } else {
      input = el("input", "kzd-job__input");
      input.type = opts.type || "text";
    }
    input.id = opts.id;
    input.name = opts.id;
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.required) input.required = true;
    if (opts.autocomplete) input.autocomplete = opts.autocomplete;
    wrap.appendChild(input);

    var err = el("p", "kzd-job__error");
    err.id = opts.id + "-error";
    err.setAttribute("role", "alert");
    wrap.appendChild(err);
    input.setAttribute("aria-describedby", err.id);

    var f = { wrap: wrap, input: input, error: err, rules: opts };
    fields[opts.id] = f;

    // Validate on blur, never on every keystroke.
    input.addEventListener("blur", function () { validateField(f); });
    input.addEventListener("input", function () {
      if (wrap.classList.contains("has-error")) validateField(f);
    });
    return f;
  }

  function setError(f, msg) {
    f.error.textContent = msg || "";
    f.wrap.classList.toggle("has-error", !!msg);
    if (f.input) f.input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validateField(f) {
    var v = (f.input.value || "").trim();
    var r = f.rules;

    if (r.required && !v) { setError(f, r.emptyMessage || "This field is required."); return false; }
    if (!v) { setError(f, ""); return true; }

    if (r.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError(f, "Enter a valid email address."); return false;
    }
    if (r.type === "tel" && !/^[0-9+()\s-]{9,}$/.test(v)) {
      setError(f, "Enter a valid phone number."); return false;
    }
    if (r.type === "url" && !/^https?:\/\/.+\..+/.test(v)) {
      setError(f, "Enter a full URL, starting with http:// or https://"); return false;
    }
    setError(f, "");
    return true;
  }

  /* --- file drop zones ------------------------------------------------- */

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function extOf(name) {
    var i = String(name).lastIndexOf(".");
    return i === -1 ? "" : String(name).slice(i).toLowerCase();
  }

  function makeDropField(opts) {
    var wrap = el("div", "kzd-job__field");
    var lab = el("label", "kzd-job__label");
    lab.setAttribute("for", opts.id);
    lab.appendChild(document.createTextNode(opts.label));
    if (opts.required) {
      var star = el("span", "kzd-job__req", "*");
      star.setAttribute("aria-hidden", "true");
      lab.appendChild(star);
    }
    wrap.appendChild(lab);

    var holder = el("div", "kzd-job__drop-holder");
    wrap.appendChild(holder);

    var err = el("p", "kzd-job__error");
    err.setAttribute("role", "alert");
    wrap.appendChild(err);

    var input = el("input");
    input.type = "file";
    input.id = opts.id;
    input.accept = opts.types.join(",");
    if (opts.multiple) input.multiple = true;
    input.hidden = true;
    wrap.appendChild(input);

    var f = { wrap: wrap, error: err, input: input, rules: opts, files: [] };
    fields[opts.id] = f;

    function drawZone() {
      holder.textContent = "";
      var zone = el("div", "kzd-job__drop");
      zone.tabIndex = 0;
      zone.setAttribute("role", "button");
      zone.setAttribute("aria-label", opts.label + ". Click to upload or drag and drop. " + opts.hint);
      zone.appendChild(svg("0 0 24 24", ICONS.upload));
      zone.appendChild(el("span", "kzd-job__drop-main", "Click to upload or drag and drop"));
      zone.appendChild(el("span", "kzd-job__drop-hint", opts.hint));

      zone.addEventListener("click", function () { input.click(); });
      zone.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
      });

      ["dragenter", "dragover"].forEach(function (ev) {
        zone.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          zone.classList.add("is-over");
        });
      });
      ["dragleave", "dragend"].forEach(function (ev) {
        zone.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          zone.classList.remove("is-over");
        });
      });
      zone.addEventListener("drop", function (e) {
        e.preventDefault(); e.stopPropagation();
        zone.classList.remove("is-over");
        accept(e.dataTransfer && e.dataTransfer.files);
      });

      holder.appendChild(zone);
    }

    function drawFiles() {
      holder.textContent = "";
      f.files.forEach(function (file, i) {
        var row = el("div", "kzd-job__file");
        row.appendChild(el("span", "kzd-job__file-name", file.name));
        row.appendChild(el("span", "kzd-job__file-size", fmtSize(file.size)));
        var x = el("button", "kzd-job__file-x");
        x.type = "button";
        x.setAttribute("aria-label", "Remove " + file.name);
        x.appendChild(svg("0 0 24 24", ICONS.x));
        x.addEventListener("click", function () {
          f.files.splice(i, 1);
          input.value = "";
          if (f.files.length) drawFiles(); else drawZone();
          setError(f, "");
        });
        row.appendChild(x);
        holder.appendChild(row);
      });
    }

    function accept(fileList) {
      if (!fileList || !fileList.length) return;
      var incoming = Array.prototype.slice.call(fileList);
      if (!opts.multiple) incoming = incoming.slice(0, 1);

      var picked = [];
      var total = 0;

      for (var i = 0; i < incoming.length; i++) {
        var file = incoming[i];
        if (opts.types.indexOf(extOf(file.name)) === -1) {
          setError(f, file.name + " is not an accepted file type. " + opts.hint);
          return;
        }
        total += file.size;
        // Keep ONLY the name and size. The bytes are never read, never encoded
        // and never written to localStorage — a base64 CV would blow the quota.
        picked.push({ name: file.name, size: file.size });
      }

      if (total > opts.max) {
        setError(f, "That is " + fmtSize(total) + ". The limit is " + fmtSize(opts.max) + ".");
        return;
      }

      // TODO(backend): POST the real File objects to /api/applications/upload
      // here and keep the returned storage ids. Nothing is uploaded today.
      setError(f, "");
      f.files = opts.multiple ? f.files.concat(picked) : picked;
      drawFiles();
    }

    input.addEventListener("change", function () { accept(input.files); });
    drawZone();
    return f;
  }

  function validateDrop(f) {
    if (f.rules.required && !f.files.length) {
      setError(f, "Please attach " + f.rules.label.toLowerCase() + ".");
      return false;
    }
    return true;
  }

  /* --- the form -------------------------------------------------------- */

  function renderApply() {
    var inner = panelApply.querySelector(".kzd-job__inner");

    if (job.status === "closed") {
      var box = el("div", "kzd-job__missing");
      box.appendChild(el("h2", "kzd-job__missing-title", "This role has been filled"));
      box.appendChild(el("p", "kzd-job__missing-body",
        "We are no longer accepting applications for " + job.title + ". Have a look at what else is open."));
      var a = el("a", "kzd-job__missing-link", "See all positions");
      a.href = "careers.html";
      a.appendChild(svg("0 0 24 24", ICONS.arrowRight));
      box.appendChild(a);
      inner.appendChild(box);
      return;
    }

    var form = el("form", "kzd-job__form");
    form.noValidate = true;

    /* MY INFORMATION */
    var fs1 = el("fieldset", "kzd-job__fs kzd-job__rise");
    fs1.appendChild(el("legend", "kzd-job__legend", "My information"));
    fs1.appendChild(el("p", "kzd-job__fs-sub", "Fill in your details below"));
    fs1.appendChild(makeField({ id: "fullName", label: "Full name", required: true, placeholder: "Your full name", autocomplete: "name" }).wrap);
    fs1.appendChild(makeField({ id: "email", label: "Email address", type: "email", required: true, placeholder: "you@example.com", autocomplete: "email" }).wrap);
    fs1.appendChild(makeField({ id: "phone", label: "Phone number", type: "tel", required: true, placeholder: "0XX XXX XXXX", autocomplete: "tel" }).wrap);
    fs1.appendChild(makeField({ id: "location", label: "Where are you based?", required: true, placeholder: "City or suburb" }).wrap);
    form.appendChild(fs1);

    /* DOCUMENTS */
    var fs2 = el("fieldset", "kzd-job__fs kzd-job__rise");
    fs2.appendChild(el("legend", "kzd-job__legend", "Documents"));
    fs2.appendChild(el("p", "kzd-job__fs-sub", "Upload your CV and any supporting documents"));
    fs2.appendChild(makeDropField({ id: "cv", label: "Your CV", required: true, types: CV_TYPES, max: CV_MAX, hint: "PDF or Word, max 5MB" }).wrap);
    fs2.appendChild(makeDropField({ id: "docs", label: "Qualifications and certificates", types: DOC_TYPES, max: DOC_MAX, multiple: true, hint: "PDF or images, max 10MB total" }).wrap);
    form.appendChild(fs2);

    /* QUESTIONS */
    var fs3 = el("fieldset", "kzd-job__fs kzd-job__rise");
    fs3.appendChild(el("legend", "kzd-job__legend", "Questions"));
    fs3.appendChild(el("p", "kzd-job__fs-sub", "Tell us a bit more about you"));
    fs3.appendChild(makeField({ id: "portfolio", label: "Portfolio, GitHub or LinkedIn", type: "url", placeholder: "https://" }).wrap);
    fs3.appendChild(makeField({ id: "source", label: "How did you hear about this position?", required: true, placeholder: "LinkedIn, a friend, our website…" }).wrap);
    fs3.appendChild(makeField({ id: "why", label: "Why do you want this role?", tag: "textarea", required: true, placeholder: "A short paragraph is fine. We would rather read something honest than something polished." }).wrap);
    fs3.appendChild(makeField({ id: "built", label: "Tell us about something you have built.", tag: "textarea", required: true, placeholder: "A site, an app, a school project. What was it, and what was hard about it?" }).wrap);

    var skillsWrap = el("div", "kzd-job__field");
    skillsWrap.appendChild(el("p", "kzd-job__label", "Which of these have you worked with?"));
    var checks = el("div", "kzd-job__checks");
    SKILLS.forEach(function (name, i) {
      var row = el("label", "kzd-job__check-row");
      var cb = el("input", "kzd-job__check");
      cb.type = "checkbox";
      cb.value = name;
      cb.name = "skills";
      cb.id = "skill-" + i;
      row.setAttribute("for", cb.id);
      row.appendChild(cb);
      row.appendChild(document.createTextNode(name));
      checks.appendChild(row);
    });
    skillsWrap.appendChild(checks);
    fs3.appendChild(skillsWrap);

    fs3.appendChild(makeField({ id: "startDate", label: "When could you start?", type: "date", required: true }).wrap);

    var callout = el("div", "kzd-job__callout");
    callout.appendChild(svg("0 0 24 24", ICONS.info));
    var ctext = el("div");
    ctext.appendChild(el("p", "kzd-job__callout-title", "What happens next"));
    ctext.appendChild(el("p", "kzd-job__callout-body", NEXT_TEXT));
    callout.appendChild(ctext);
    fs3.appendChild(callout);
    form.appendChild(fs3);

    /* LEGAL */
    var fs4 = el("fieldset", "kzd-job__fs kzd-job__rise");
    fs4.appendChild(el("legend", "kzd-job__legend", "Legal"));

    var consentWrap = el("div", "kzd-job__field");
    var consentRow = el("div", "kzd-job__consent");
    var consent = el("input", "kzd-job__check");
    consent.type = "checkbox";
    consent.id = "consent";
    var clabel = el("label", "kzd-job__consent-label");
    clabel.setAttribute("for", "consent");
    clabel.appendChild(document.createTextNode("I have read and accept the "));
    // TODO(content): the Recruitment Privacy Notice page does not exist yet.
    var pn = el("a", null, "Recruitment Privacy Notice");
    pn.href = "#";
    clabel.appendChild(pn);
    clabel.appendChild(document.createTextNode("."));
    var cstar = el("span", "kzd-job__req", "*");
    cstar.setAttribute("aria-hidden", "true");
    clabel.appendChild(cstar);
    consentRow.appendChild(consent);
    consentRow.appendChild(clabel);
    consentWrap.appendChild(consentRow);
    var cerr = el("p", "kzd-job__error");
    cerr.setAttribute("role", "alert");
    consentWrap.appendChild(cerr);
    fs4.appendChild(consentWrap);
    fields.consent = { wrap: consentWrap, input: consent, error: cerr, rules: { required: true, isCheck: true } };
    form.appendChild(fs4);

    form.appendChild(el("p", "kzd-job__required-note", "All fields marked with * are required."));

    var live = el("p", "kzd-job__live");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    form.appendChild(live);

    var submit = el("button", "kzd-job__btn kzd-job__btn--primary kzd-job__submit", "Submit application");
    submit.type = "submit";
    form.appendChild(submit);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      onSubmit(form, live, submit);
    });

    inner.appendChild(form);
    restoreDraft();
  }

  function onSubmit(form, live, submit) {
    var order = ["fullName", "email", "phone", "location", "cv", "docs",
                 "portfolio", "source", "why", "built", "startDate", "consent"];
    var firstBad = null;
    var count = 0;

    order.forEach(function (key) {
      var f = fields[key];
      if (!f) return;
      var ok;
      if (f.rules.isCheck) {
        ok = f.input.checked;
        setError(f, ok ? "" : "You need to accept the Recruitment Privacy Notice.");
      } else if (f.files) {
        ok = validateDrop(f);
      } else {
        ok = validateField(f);
      }
      if (!ok) { count++; if (!firstBad) firstBad = f; }
    });

    if (count) {
      live.textContent = count === 1
        ? "1 field needs attention."
        : count + " fields need attention.";
      var target = firstBad.input || firstBad.wrap;
      if (target.scrollIntoView) target.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
      if (target.focus) target.focus({ preventScroll: true });
      return;
    }

    live.textContent = "";

    // Applying needs an account. The draft is saved first so a part-filled form
    // survives the modal.
    if (!window.KZDAuth || !window.KZDAuth.isSignedIn()) {
      saveDraft();
      requireAccount(submit, function () { submitNow(form); });
      return;
    }
    submitNow(form);
  }

  function collect() {
    var out = { jobId: job.id, jobTitle: job.title, submittedAt: new Date().toISOString() };
    ["fullName", "email", "phone", "location", "portfolio", "source", "why", "built", "startDate"]
      .forEach(function (k) { if (fields[k]) out[k] = fields[k].input.value; });

    out.skills = Array.prototype.map.call(
      document.querySelectorAll('input[name="skills"]:checked'), function (c) { return c.value; });

    // Filenames and sizes ONLY — never the file contents.
    out.cv = fields.cv ? fields.cv.files.slice() : [];
    out.docs = fields.docs ? fields.docs.files.slice() : [];
    return out;
  }

  function submitNow(form) {
    var record = collect();

    // TODO(backend): the store's addApplication() becomes POST /api/applications
    // with the real files attached, and the server sends the confirmation email.
    // Today it lands in this browser only — nothing is transmitted, no email is
    // sent. It DOES reach the admin dashboard, which reads the same store.
    if (window.KZDStore) {
      window.KZDStore.addApplication(record).catch(function (err) {
        if (window.console) console.warn("[kzd-job] could not save application", err);
      });
      window.KZDStore.clearDraftSync();
    }

    var done = el("div", "kzd-job__done");
    var tick = el("div", "kzd-job__tick");
    tick.appendChild(svg("0 0 24 24", ICONS.tick));
    done.appendChild(tick);
    done.appendChild(el("h2", "kzd-job__done-title", "Application received"));
    done.appendChild(el("p", "kzd-job__done-body",
      "We have your application for " + job.title + ". Give us 30 days to review it. " +
      "If you have not heard from us by then, your application was not successful this time. " +
      "If you are shortlisted we will contact you with an interview date and time."));
    var a = el("a", "kzd-job__done-link", "See all positions");
    a.href = "careers.html";
    a.appendChild(svg("0 0 24 24", ICONS.arrowRight));
    done.appendChild(a);

    form.parentNode.replaceChild(done, form);
    done.setAttribute("tabindex", "-1");
    done.focus();
  }

  /* --- draft persistence ------------------------------------------------ */

  function saveDraft() {
    if (window.KZDStore) window.KZDStore.setDraftSync(collect());
  }

  function restoreDraft() {
    var d = window.KZDStore ? window.KZDStore.getDraftSync() : null;
    if (!d || d.jobId !== job.id) return;

    ["fullName", "email", "phone", "location", "portfolio", "source", "why", "built", "startDate"]
      .forEach(function (k) { if (fields[k] && d[k]) fields[k].input.value = d[k]; });

    (d.skills || []).forEach(function (name) {
      Array.prototype.forEach.call(document.querySelectorAll('input[name="skills"]'), function (c) {
        if (c.value === name) c.checked = true;
      });
    });
  }

  /**
   * Applying requires an account. Opens the prototype auth modal and runs the
   * callback once the visitor is signed in.
   */
  function requireAccount(opener, next) {
    if (window.KZDAuth && window.KZDAuth.isSignedIn()) { next(); return; }
    if (!window.KZDAuth) { next(); return; }
    saveDraft();
    window.KZDAuth.open({
      mode: "signin",
      opener: opener,
      onDone: function () { next(); }
    });
  }

  /* ---------------------------------------------------------------------
     Tabs
     --------------------------------------------------------------------- */

  function showTab(which, skipHash) {
    var toApply = which === "apply";
    var incoming = toApply ? panelApply : panelDetails;
    var outgoing = toApply ? panelDetails : panelApply;

    tabDetails.setAttribute("aria-selected", String(!toApply));
    tabApply.setAttribute("aria-selected", String(toApply));
    // The apply tab is a navy button until it is itself selected.
    tabApply.textContent = toApply ? "Application" : "Apply";
    tabDetails.tabIndex = toApply ? -1 : 0;
    tabApply.tabIndex = toApply ? 0 : -1;

    if (!skipHash) {
      var hash = toApply ? "#apply" : "#details";
      if (window.location.hash !== hash) history.pushState(null, "", hash);
    }

    if (reduced()) {
      outgoing.hidden = true;
      incoming.hidden = false;
      riseIn(incoming);
      return;
    }

    outgoing.classList.add("is-leaving");
    window.setTimeout(function () {
      outgoing.hidden = true;
      outgoing.classList.remove("is-leaving");
      incoming.hidden = false;
      incoming.classList.add("is-entering");
      void incoming.offsetWidth;
      incoming.classList.remove("is-entering");
      incoming.classList.add("is-entered");
      window.setTimeout(function () { incoming.classList.remove("is-entered"); }, 260);
      riseIn(incoming);
    }, 240);
  }

  /** Sections rise once per tab view. */
  function riseIn(panel) {
    if (reduced()) return;
    var nodes = panel.querySelectorAll(".kzd-job__rise:not(.is-in)");
    Array.prototype.forEach.call(nodes, function (n, i) {
      n.style.setProperty("--kzd-j-delay", (i * 70) + "ms");
      n.classList.add("is-in");
      window.setTimeout(function () { n.classList.add("is-settled"); }, i * 70 + 620);
    });
  }

  function wireTabs() {
    [tabDetails, tabApply].forEach(function (tab, i) {
      tab.addEventListener("click", function () { showTab(i === 0 ? "details" : "apply"); });
      tab.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        var other = i === 0 ? tabApply : tabDetails;
        showTab(i === 0 ? "apply" : "details");
        other.focus();
      });
    });

    // Hash keeps the state linkable and makes the back button work.
    window.addEventListener("popstate", function () {
      showTab(window.location.hash === "#apply" ? "apply" : "details", true);
    });
  }

  /* --------------------------------------------------------------------- */

  function init() {
    section = document.querySelector(".kzd-job");
    if (!section) return;

    panelDetails = section.querySelector("#kzd-panel-details");
    panelApply = section.querySelector("#kzd-panel-apply");
    tabDetails = section.querySelector("#kzd-tab-details");
    tabApply = section.querySelector("#kzd-tab-apply");

    var id = new URLSearchParams(window.location.search).get("job");

    // Reads the store, not careers.json — a job created or edited in the admin
    // dashboard has to show up here, and a browser cannot write a static file.
    Promise.resolve(window.KZDStoreReady)
      .then(function () { return window.KZDStore.getJobs(); })
      .then(function (roles) {
        job = roles.filter(function (r) {
          return r && (r.id === id || r.slug === id) && r.status !== "draft";
        })[0] || null;

        if (!job) { renderMissing(id); section.removeAttribute("aria-busy"); return; }

        renderHead();
        renderDetails();
        renderApply();
        wireTabs();

        if (!reduced()) section.classList.add("kzd-job--anim");

        showTab(window.location.hash === "#apply" ? "apply" : "details", true);
        section.removeAttribute("aria-busy");
      })
      .catch(function (err) {
        renderMissing(id);
        section.removeAttribute("aria-busy");
        if (window.console) console.warn("[kzd-job]", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

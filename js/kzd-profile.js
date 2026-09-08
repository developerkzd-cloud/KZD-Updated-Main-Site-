/* ==========================================================================
   KZD Solutions — applicant profile (profile.html)

   FRONTEND ONLY. Every read and write below goes to localStorage on this one
   device. Nothing is transmitted, nothing is shared between browsers, and an
   applicant clearing site data loses all of it. Each place a real API call
   belongs is marked TODO(backend).

   Storage it reads:
     kzd_session       { email, firstName }        — written by js/kzd-auth.js
     kzd_users         [ { firstName, lastName, email, ... } ]
     kzd_applications  [ { jobId, jobTitle, submittedAt, fullName, email,
                           phone, location, cv:[{name,size}], docs:[...] } ]
                                                   — written by js/kzd-job.js
   Storage it owns:
     kzd_profile       { personal, equity, experience, education, projects,
                         links, skills, languages }

   NOTE on what carries over from the application. The brief says name, email,
   phone, location and the CV come through — that is exactly what is seeded
   here, which is what makes a brand-new applicant land on 40%. The application
   form ALSO collects a skills checklist and a portfolio URL; those are
   deliberately NOT seeded, because doing so would put a fresh account at 70%
   and make the "third skill moves you to 50%" behaviour untestable. See the
   note in the handover — this is a product decision, not an oversight.
   ========================================================================== */

(function () {
  "use strict";

  var SESSION_KEY = "kzd_session";
  var USERS_KEY   = "kzd_users";
  var APPS_KEY    = "kzd_applications";
  var PROFILE_KEY = "kzd_profile";

  var SVG_NS = "http://www.w3.org/2000/svg";

  /* --- storage ---------------------------------------------------------- */

  /* All storage goes through js/kzd-store.js, the only module in the project
     that touches localStorage. */
  function S() { return window.KZDStore || null; }

  function read(key, fallback) {
    var st = S();
    if (!st) return fallback;
    if (key === SESSION_KEY) return st.getSessionSync() || fallback;
    if (key === USERS_KEY)   return st.getUsersSync();
    if (key === PROFILE_KEY) return st.getProfileSync() || fallback;
    if (key === APPS_KEY)    return st.getApplicationsSync();
    return fallback;
  }

  function write(key, value) {
    var st = S();
    if (!st) return false;
    try {
      if (key === PROFILE_KEY) { st.setProfileSync(value); return true; }
      return false;
    } catch (e) {
      if (window.console) console.warn("[kzd-profile] could not save", key, e);
      return false;
    }
  }

  /* --- small helpers ---------------------------------------------------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svg(paths, opts) {
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("viewBox", (opts && opts.box) || "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    (Array.isArray(paths) ? paths : [paths]).forEach(function (d) {
      var p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  function fmtSize(bytes) {
    if (typeof bytes !== "number" || !isFinite(bytes)) return "";
    if (bytes < 1024) return bytes + " B";
    var kb = bytes / 1024;
    if (kb < 1024) return Math.round(kb) + " KB";
    return (kb / 1024).toFixed(1) + " MB";
  }

  function nonEmpty(v) { return typeof v === "string" && v.trim() !== ""; }

  /* --- brand glyphs ------------------------------------------------------
     Inline only. An external logo URL can move or vanish, adds a third-party
     request to every page load, and can trip CORS — same reasoning as the
     footer social icons.                                                    */

  var ICONS = {
    pencil: ["M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z", "M14.5 7.5l2 2"],
    plus:   ["M12 5v14", "M5 12h14"],
    x:      ["M5 5l14 14", "M19 5L5 19"],
    info:   ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 11v5", "M12 7.6v.2"],
    doc:    ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z",
             "M14 3v5h5", "M9 13h6", "M9 17h4"],
    cert:   ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z",
             "M14 3v5h5", "M9 12h6", "M9 16h6"],
    trash:  ["M4 7h16", "M10 11v6", "M14 11v6",
             "M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12", "M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"],
    linkedin: "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z",
    github: "M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58l-.02-2.05c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3Z",
    globe: "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm8.2 7.2h-3.3a18.6 18.6 0 0 0-1.6-4.1 9.8 9.8 0 0 1 4.9 4.1ZM12 2.2c.8 1.2 1.5 2.6 2 4.9h-4c.5-2.3 1.2-3.7 2-4.9ZM2.5 14.4a9.9 9.9 0 0 1 0-4.8h3.8a20.6 20.6 0 0 0 0 4.8H2.5Zm.9 2.4h3.3c.4 1.5.9 2.9 1.6 4.1a9.8 9.8 0 0 1-4.9-4.1Zm3.3-9.6H3.4a9.8 9.8 0 0 1 4.9-4.1 18.6 18.6 0 0 0-1.6 4.1ZM12 21.8c-.8-1.2-1.5-2.6-2-4.9h4c-.5 2.3-1.2 3.7-2 4.9Zm2.4-7.4H9.6a18.4 18.4 0 0 1 0-4.8h4.8a18.4 18.4 0 0 1 0 4.8Zm.9 6.6c.7-1.2 1.2-2.6 1.6-4.1h3.3a9.8 9.8 0 0 1-4.9 4.1Zm2.4-6.6a20.6 20.6 0 0 0 0-4.8h3.8a9.9 9.9 0 0 1 0 4.8h-3.8Z",
    link: ["M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7",
           "M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"]
  };

  /* --- profile model ----------------------------------------------------- */

  function blankProfile() {
    return {
      personal: {
        firstName: "", lastName: "", email: "", phone: "",
        location: "", dob: "", street: "", postal: ""
      },
      equity: { rightToWork: "", populationGroup: "", gender: "", disability: "" },
      experience: [],
      education: [],
      projects: [],
      links: { linkedin: "", github: "", portfolio: "", other: "" },
      skills: [],
      languages: []
    };
  }

  var session = read(SESSION_KEY, null);
  var profile = null;
  var apps = [];

  /* Seeds the profile from the account and the application record. Only the
     five fields the brief names carry over; see the header note. */
  function hydrate() {
    profile = read(PROFILE_KEY, null);
    var fresh = !profile;
    if (fresh) profile = blankProfile();

    // Merge forward, so a profile saved by an older build still gets any new keys.
    var base = blankProfile();
    Object.keys(base).forEach(function (k) {
      if (profile[k] == null) profile[k] = base[k];
      else if (!Array.isArray(base[k]) && typeof base[k] === "object") {
        Object.keys(base[k]).forEach(function (j) {
          if (profile[k][j] == null) profile[k][j] = base[k][j];
        });
      }
    });

    apps = read(APPS_KEY, []).filter(function (a) {
      return a && (!session || !a.email || a.email.toLowerCase() === session.email.toLowerCase());
    });

    var user = null;
    if (session) {
      user = read(USERS_KEY, []).filter(function (u) {
        return u && u.email && u.email.toLowerCase() === session.email.toLowerCase();
      })[0] || null;
    }

    var latest = apps.length ? apps[apps.length - 1] : null;
    var p = profile.personal;

    // Account record is the better source for the name — it has both halves.
    if (!nonEmpty(p.firstName)) {
      if (user && nonEmpty(user.firstName)) p.firstName = user.firstName;
      else if (latest && nonEmpty(latest.fullName)) p.firstName = latest.fullName.trim().split(/\s+/)[0];
      else if (session && nonEmpty(session.firstName)) p.firstName = session.firstName;
    }
    if (!nonEmpty(p.lastName)) {
      if (user && nonEmpty(user.lastName)) p.lastName = user.lastName;
      else if (latest && nonEmpty(latest.fullName)) {
        var parts = latest.fullName.trim().split(/\s+/);
        if (parts.length > 1) p.lastName = parts.slice(1).join(" ");
      }
    }
    if (!nonEmpty(p.email))    p.email    = (user && user.email) || (latest && latest.email) || (session && session.email) || "";
    if (!nonEmpty(p.phone))    p.phone    = (latest && latest.phone) || "";
    if (!nonEmpty(p.location)) p.location = (latest && latest.location) || "";

    if (fresh) write(PROFILE_KEY, profile);
  }

  function save() {
    // TODO(backend): PATCH /api/profile with the changed fields and reconcile
    // the response, instead of trusting this device's copy.
    write(PROFILE_KEY, profile);
    refreshCompletion();
  }

  /* --- documents ---------------------------------------------------------
     Only filenames and sizes were ever stored (js/kzd-job.js keeps metadata
     and discards the bytes), so there is nothing to download here. */

  function documents() {
    var out = [];
    apps.forEach(function (a) {
      (a.cv || []).forEach(function (f) {
        out.push({ name: f.name, size: f.size, date: a.submittedAt, kind: "CV" });
      });
      (a.docs || []).forEach(function (f) {
        out.push({ name: f.name, size: f.size, date: a.submittedAt, kind: "QUALIFICATION" });
      });
    });
    return out;
  }

  function hasCV() {
    return apps.some(function (a) { return (a.cv || []).length > 0; });
  }

  /* --- completion --------------------------------------------------------
     Weights sum to exactly 100. Every one is evaluated against live data —
     nothing here is a constant, and the total is never written down. */

  var WEIGHTS = [
    { id: "personal",   weight: 20, label: "Personal details",
      done: function () {
        var p = profile.personal;
        return nonEmpty(p.firstName) && nonEmpty(p.lastName) &&
               nonEmpty(p.email) && nonEmpty(p.phone) && nonEmpty(p.location);
      } },
    { id: "cv",         weight: 20, label: "CV",          done: function () { return hasCV(); } },
    { id: "experience", weight: 15, label: "Work experience", done: function () { return profile.experience.length > 0; } },
    { id: "education",  weight: 15, label: "Education",   done: function () { return profile.education.length > 0; } },
    { id: "skills",     weight: 10, label: "Skills",      done: function () { return profile.skills.length >= 3; } },
    { id: "links",      weight: 10, label: "Portfolio and links",
      done: function () {
        var l = profile.links;
        return nonEmpty(l.linkedin) || nonEmpty(l.github) || nonEmpty(l.portfolio) || nonEmpty(l.other);
      } },
    { id: "languages",  weight: 5,  label: "Languages",   done: function () { return profile.languages.length > 0; } },
    { id: "projects",   weight: 5,  label: "Projects",    done: function () { return profile.projects.length > 0; } }
  ];

  function completion() {
    return WEIGHTS.reduce(function (sum, w) { return sum + (w.done() ? w.weight : 0); }, 0);
  }

  function firstIncomplete() {
    for (var i = 0; i < WEIGHTS.length; i++) if (!WEIGHTS[i].done()) return WEIGHTS[i].id;
    return null;
  }

  /* --- stage -------------------------------------------------------------
     js/kzd-job.js does not yet write a stage, so an application with none is
     treated as "applied". Only an admin will ever change it.
     TODO(backend): read the authoritative stage from /api/applications. */

  var STAGES = ["applied", "interviewing", "offer"];

  function stageOf(app) {
    var s = (app && app.stage || "").toLowerCase();
    return STAGES.indexOf(s) === -1 ? "applied" : s;
  }

  function furthestStage() {
    var best = -1;
    apps.forEach(function (a) { best = Math.max(best, STAGES.indexOf(stageOf(a))); });
    return best === -1 ? null : STAGES[best];
  }

  /* ======================================================================
     Rendering
     ====================================================================== */

  var root, panels = {}, tabs = [], meterFill, pctLive, banner, bannerSub;

  function initials() {
    var p = profile.personal;
    var a = (p.firstName || "").trim().charAt(0);
    var b = (p.lastName || "").trim().charAt(0);
    var s = (a + b).toUpperCase();
    return s || (p.email || "?").charAt(0).toUpperCase();
  }

  function fullName() {
    var p = profile.personal;
    var n = ((p.firstName || "") + " " + (p.lastName || "")).trim();
    return n || p.email || "Your profile";
  }

  function renderHeader() {
    root.querySelector(".kzd-pro__avatar").textContent = initials();
    root.querySelector(".kzd-pro__name").textContent = fullName();
    root.querySelector(".kzd-pro__email").textContent = profile.personal.email || "";

    var pill = root.querySelector(".kzd-pro__status");
    var stage = furthestStage();
    pill.className = "kzd-pro__status";
    if (!stage) { pill.hidden = true; return; }
    pill.hidden = false;

    var label = "Application in review";
    if (stage === "interviewing") { label = "Interview scheduled"; pill.classList.add("kzd-pro__status--interviewing"); }
    else if (stage === "offer")   { label = "Offer received";      pill.classList.add("kzd-pro__status--offer"); }
    pill.querySelector(".kzd-pro__status-label").textContent = label;
  }

  /* Count-up. Skipped entirely under reduced motion — the value is just set. */
  var countTimer = null;
  function setPercent(to, animate) {
    var node = root.querySelector(".kzd-pro__pct");
    var from = parseInt(node.textContent, 10);
    if (isNaN(from)) from = 0;

    if (countTimer) { cancelAnimationFrame(countTimer); countTimer = null; }

    if (!animate || reduced() || from === to) {
      node.textContent = to;
    } else {
      var start = performance.now();
      var step = function (now) {
        var t = Math.min(1, (now - start) / 400);
        var e = 1 - Math.pow(1 - t, 3);
        node.textContent = Math.round(from + (to - from) * e);
        if (t < 1) countTimer = requestAnimationFrame(step);
        else countTimer = null;
      };
      countTimer = requestAnimationFrame(step);
    }
    meterFill.style.width = to + "%";
  }

  function refreshCompletion(animate) {
    var pct = completion();
    banner.hidden = pct >= 100;
    setPercent(pct, animate !== false);

    var next = firstIncomplete();
    var w = next && WEIGHTS.filter(function (x) { return x.id === next; })[0];
    bannerSub.textContent = w
      ? "Add your " + w.label.toLowerCase() + " so we can match you to future roles."
      : "Your profile is complete.";

    // Announced once, as a settled sentence — the visual count-up would
    // otherwise be read out digit by digit.
    if (pctLive) pctLive.textContent = "Profile " + pct + "% complete.";
  }

  /* --- tab 1: profile ---------------------------------------------------- */

  function cardShell(title, opts) {
    var card = el("section", "kzd-pro__card kzd-pro__rise");
    if (opts && opts.id) card.dataset.section = opts.id;
    var head = el("div", "kzd-pro__card-head");
    var left = el("div");
    left.appendChild(el("h2", "kzd-pro__h", title));
    if (opts && opts.sub) left.appendChild(el("p", "kzd-pro__sub", opts.sub));
    head.appendChild(left);

    if (opts && opts.action) {
      var b = el("button", "kzd-pro__icon-btn");
      b.type = "button";
      b.setAttribute("aria-label", opts.actionLabel || "Edit");
      b.appendChild(svg(ICONS[opts.action]));
      b.addEventListener("click", opts.onAction);
      head.appendChild(b);
    }
    card.appendChild(head);
    return card;
  }

  function renderDocuments() {
    var card = cardShell("Documents", {
      id: "cv",
      sub: "Pulled through from your application",
      action: "pencil",
      actionLabel: "Edit documents",
      onAction: function () {
        // TODO(backend): re-uploading needs a real file endpoint. Only
        // filenames and sizes exist on this device, so there is nothing to
        // replace or download yet.
        notice("Documents come through from your application. Re-uploading will be available once applications are stored on the server.");
      }
    });

    var docs = documents();
    if (!docs.length) {
      card.appendChild(el("p", "kzd-pro__empty", "No documents yet"));
      return card;
    }

    var list = el("div", "kzd-pro__docs");
    docs.forEach(function (d) {
      var row = el("div", "kzd-pro__doc");
      var qual = d.kind === "QUALIFICATION";
      var tile = el("div", "kzd-pro__doc-tile" + (qual ? " kzd-pro__doc-tile--qual" : ""));
      tile.appendChild(svg(qual ? ICONS.cert : ICONS.doc));
      row.appendChild(tile);

      var body = el("div", "kzd-pro__doc-body");
      body.appendChild(el("p", "kzd-pro__doc-name", d.name));
      var bits = [];
      if (fmtDate(d.date)) bits.push("Uploaded " + fmtDate(d.date));
      if (fmtSize(d.size)) bits.push(fmtSize(d.size));
      body.appendChild(el("p", "kzd-pro__doc-meta", bits.join(" · ")));
      row.appendChild(body);

      row.appendChild(el("span", "kzd-pro__doc-tag", d.kind));
      list.appendChild(row);
    });
    card.appendChild(list);
    return card;
  }

  var ENTRY_FORMS = {
    experience: {
      title: "work experience",
      fields: [
        { id: "role",    label: "Job title", required: true },
        { id: "company", label: "Company", required: true },
        { id: "start",   label: "Start (e.g. Jan 2024)" },
        { id: "end",     label: "End (or leave blank if current)" }
      ],
      line1: function (e) { return e.role; },
      line2: function (e) { return e.company; },
      line3: function (e) { return [e.start, e.end || "Present"].filter(Boolean).join(" – "); }
    },
    education: {
      title: "education",
      fields: [
        { id: "qualification", label: "Qualification", required: true },
        { id: "institution",   label: "Institution", required: true },
        { id: "year",          label: "Year completed" }
      ],
      line1: function (e) { return e.qualification; },
      line2: function (e) { return e.institution; },
      line3: function (e) { return e.year; }
    },
    projects: {
      title: "project",
      fields: [
        { id: "name", label: "Project name", required: true },
        { id: "url",  label: "Link (optional)" },
        { id: "note", label: "What it does" }
      ],
      line1: function (e) { return e.name; },
      line2: function (e) { return e.note; },
      line3: function (e) { return e.url; }
    }
  };

  function renderEntryCard(key, heading, emptyText) {
    var spec = ENTRY_FORMS[key];
    var card = cardShell(heading, {
      id: key,
      action: "plus",
      actionLabel: "Add " + spec.title,
      onAction: function () { entryModal(key, null); }
    });

    var items = profile[key];
    if (!items.length) {
      card.appendChild(el("p", "kzd-pro__empty", emptyText));
      return card;
    }

    var ul = el("ul", "kzd-pro__list");
    items.forEach(function (item, i) {
      var li = el("li", "kzd-pro__entry");
      var body = el("div", "kzd-pro__entry-body");
      body.appendChild(el("p", "kzd-pro__entry-title", spec.line1(item) || ""));
      var l2 = spec.line2(item); if (l2) body.appendChild(el("p", "kzd-pro__entry-meta", l2));
      var l3 = spec.line3(item); if (l3) body.appendChild(el("p", "kzd-pro__entry-dates", l3));
      li.appendChild(body);

      var actions = el("div", "kzd-pro__entry-actions");
      var edit = el("button", "kzd-pro__icon-btn");
      edit.type = "button";
      edit.setAttribute("aria-label", "Edit " + (spec.line1(item) || spec.title));
      edit.appendChild(svg(ICONS.pencil));
      edit.addEventListener("click", function () { entryModal(key, i); });
      actions.appendChild(edit);

      var del = el("button", "kzd-pro__icon-btn");
      del.type = "button";
      del.setAttribute("aria-label", "Delete " + (spec.line1(item) || spec.title));
      del.appendChild(svg(ICONS.trash));
      del.addEventListener("click", function () {
        profile[key].splice(i, 1);
        save();
        renderTab("profile", true);
      });
      actions.appendChild(del);
      li.appendChild(actions);
      ul.appendChild(li);
    });
    card.appendChild(ul);
    return card;
  }

  var LINK_SPECS = [
    { id: "linkedin",  label: "LinkedIn",  icon: "linkedin", glyph: ICONS.linkedin },
    { id: "github",    label: "GitHub",    icon: "github",   glyph: ICONS.github },
    { id: "portfolio", label: "Portfolio", icon: "portfolio", glyph: ICONS.globe },
    { id: "other",     label: "Other",     icon: "other",    glyph: ICONS.link, stroke: true }
  ];

  function renderLinks() {
    var card = cardShell("Portfolio and links", {
      id: "links",
      action: "pencil",
      actionLabel: "Edit portfolio and links",
      onAction: linksModal
    });

    var grid = el("div", "kzd-pro__links");
    LINK_SPECS.forEach(function (spec) {
      var value = profile.links[spec.id];
      var filled = nonEmpty(value);

      var row = el(filled ? "a" : "div", "kzd-pro__link");
      if (filled) {
        row.href = /^https?:\/\//i.test(value) ? value : "https://" + value;
        row.target = "_blank";
        row.rel = "noopener noreferrer";
      }

      var tile = el("span", "kzd-pro__link-tile kzd-pro__link-tile--" + spec.icon);
      var g = svg(spec.glyph);
      if (spec.stroke) {
        g.setAttribute("fill", "none");
        g.setAttribute("stroke", "#FFFFFF");
        g.setAttribute("stroke-width", "2");
        g.setAttribute("stroke-linecap", "round");
      }
      tile.appendChild(g);
      row.appendChild(tile);

      var body = el("span", "kzd-pro__link-body");
      body.appendChild(el("span", "kzd-pro__link-label", spec.label));
      body.appendChild(el("span",
        "kzd-pro__link-value" + (filled ? "" : " kzd-pro__link-value--empty"),
        filled ? value.replace(/^https?:\/\//i, "") : "—"));
      row.appendChild(body);
      grid.appendChild(row);
    });
    card.appendChild(grid);
    return card;
  }

  function renderChipCard(key, heading, addLabel) {
    var card = cardShell(heading, {
      id: key,
      action: "plus",
      actionLabel: addLabel,
      onAction: function () { chipModal(key, heading, addLabel); }
    });

    var list = profile[key];
    if (!list.length) {
      card.appendChild(el("p", "kzd-pro__empty", "No " + heading.toLowerCase() + " added yet"));
      return card;
    }

    var ul = el("ul", "kzd-pro__chips");
    list.forEach(function (name, i) {
      var li = el("li", "kzd-pro__chip", name);
      var x = el("button", "kzd-pro__chip-x");
      x.type = "button";
      x.setAttribute("aria-label", "Remove " + name);
      x.appendChild(svg(ICONS.x));
      x.addEventListener("click", function () {
        profile[key].splice(i, 1);
        save();
        renderTab("profile", true);
      });
      li.appendChild(x);
      ul.appendChild(li);
    });
    card.appendChild(ul);
    return card;
  }

  function buildProfileTab() {
    var wrap = panels.profile;
    wrap.innerHTML = "";
    wrap.appendChild(renderDocuments());
    wrap.appendChild(renderEntryCard("experience", "Work experience", "No experience added yet"));
    wrap.appendChild(renderEntryCard("education", "Education", "No education added yet"));
    wrap.appendChild(renderEntryCard("projects", "Projects", "No projects added yet"));
    wrap.appendChild(renderLinks());
    wrap.appendChild(renderChipCard("skills", "Skills", "Add a skill"));
    wrap.appendChild(renderChipCard("languages", "Languages", "Add a language"));
  }

  /* --- tab 2: personal info ---------------------------------------------- */

  var PERSONAL_FIELDS = [
    { id: "firstName", label: "First name" },
    { id: "lastName",  label: "Last name" },
    { id: "email",     label: "Email address", type: "email" },
    { id: "phone",     label: "Phone number", type: "tel" },
    { id: "location",  label: "Location" },
    { id: "dob",       label: "Date of birth", type: "date" },
    { id: "street",    label: "Street address" },
    { id: "postal",    label: "Postal code" }
  ];

  /* South African Employment Equity categories. Deliberately NOT the US/UK set
     — no veteran status, no LGBTQ+ identity, no non-SA work authorisation.
     Every field carries "Prefer not to say".
     TODO(legal): have the POPIA wording below reviewed and signed off before
     launch. Under POPIA this is special personal information and needs
     explicit consent with a stated purpose. */
  var EQUITY_FIELDS = [
    { id: "rightToWork", label: "Right to work in South Africa",
      options: ["South African citizen", "Permanent resident", "Valid work visa", "No, I would need sponsorship", "Prefer not to say"] },
    { id: "populationGroup", label: "Population group",
      options: ["African", "Coloured", "Indian", "White", "Other", "Prefer not to say"] },
    { id: "gender", label: "Gender",
      options: ["Female", "Male", "Non-binary", "Prefer not to say"] },
    { id: "disability", label: "Do you have a disability?",
      options: ["Yes", "No", "Prefer not to say"] }
  ];

  var EQUITY_SUB = "Optional. Collected for Employment Equity reporting only, and stored under POPIA. It is never used to screen applications.";

  function fieldGrid(specs, store, editing) {
    var grid = el("div", "kzd-pro__fields");
    specs.forEach(function (spec) {
      var f = el("div", "kzd-pro__field");
      var id = "kzd-pro-" + spec.id;
      var label = el("label", "kzd-pro__label", spec.label);
      label.setAttribute("for", id);
      f.appendChild(label);

      if (editing) {
        var input;
        if (spec.options) {
          input = el("select", "kzd-pro__select");
          input.appendChild(el("option", null, "—"));
          spec.options.forEach(function (o) {
            var opt = el("option", null, o);
            opt.value = o;
            input.appendChild(opt);
          });
        } else {
          input = el("input", "kzd-pro__input");
          input.type = spec.type || "text";
        }
        input.id = id;
        input.dataset.field = spec.id;
        input.value = store[spec.id] || "";
        f.appendChild(input);
      } else {
        var v = store[spec.id];
        f.appendChild(el("p", "kzd-pro__value" + (nonEmpty(v) ? "" : " kzd-pro__value--empty"),
          nonEmpty(v) ? v : "—"));
      }
      grid.appendChild(f);
    });
    return grid;
  }

  /* Edit happens in place, not in a modal — the brief is explicit about it. */
  function editableCard(heading, sub, specs, storeKey) {
    var editing = false;

    function build() {
      var card = cardShell(heading, {
        id: storeKey,
        sub: sub,
        action: editing ? null : "pencil",
        actionLabel: "Edit " + heading.toLowerCase(),
        onAction: function () { editing = true; swap(); }
      });
      card.appendChild(fieldGrid(specs, profile[storeKey], editing));

      if (editing) {
        var actions = el("div", "kzd-pro__edit-actions");
        var saveBtn = el("button", "kzd-pro__btn kzd-pro__btn--primary", "Save");
        saveBtn.type = "button";
        saveBtn.addEventListener("click", function () {
          card.querySelectorAll("[data-field]").forEach(function (i) {
            profile[storeKey][i.dataset.field] = i.value.trim();
          });
          save();
          editing = false;
          swap();
          renderHeader();
        });
        var cancel = el("button", "kzd-pro__btn kzd-pro__btn--ghost", "Cancel");
        cancel.type = "button";
        cancel.addEventListener("click", function () { editing = false; swap(); });
        actions.appendChild(saveBtn);
        actions.appendChild(cancel);
        card.appendChild(actions);
      }
      return card;
    }

    var current = build();
    function swap() {
      var next = build();
      next.classList.add("is-in");
      current.replaceWith(next);
      current = next;
    }
    return current;
  }

  function buildPersonalTab() {
    var wrap = panels.personal;
    wrap.innerHTML = "";
    wrap.appendChild(editableCard("Personal details", null, PERSONAL_FIELDS, "personal"));
    wrap.appendChild(editableCard("Equity information", EQUITY_SUB, EQUITY_FIELDS, "equity"));
  }

  /* --- tab 3: job tracker ------------------------------------------------ */

  function buildTrackerTab() {
    var wrap = panels.tracker;
    wrap.innerHTML = "";

    // No action button: an applicant cannot move their own application.
    var card = cardShell("Job tracker", {
      id: "tracker",
      sub: "Roles you have applied for at KZD Solutions"
    });

    var board = el("div", "kzd-pro__board");
    var labels = { applied: "Applied", interviewing: "Interviewing", offer: "Offer" };

    STAGES.forEach(function (stage) {
      var mine = apps.filter(function (a) { return stageOf(a) === stage; });
      var col = el("div", "kzd-pro__col kzd-pro__col--" + stage);
      col.appendChild(el("p", "kzd-pro__col-label", labels[stage] + " (" + mine.length + ")"));

      var body = el("div", "kzd-pro__col-body");
      if (!mine.length) {
        body.appendChild(el("p", "kzd-pro__col-empty", "Nothing here yet"));
      } else {
        mine.forEach(function (a) {
          var c = el("article", "kzd-pro__app");
          var top = el("div", "kzd-pro__app-top");
          var mark = el("span", "kzd-pro__app-mark");
          var img = el("img");
          img.src = "Assets/logos/kzd-mark.png";
          img.alt = "";
          img.width = 96; img.height = 95;
          mark.appendChild(img);
          top.appendChild(mark);

          var info = el("div");
          info.appendChild(el("p", "kzd-pro__app-title", a.jobTitle || a.jobId || "Application"));
          var meta = [a.department, a.jobLocation || a.location].filter(nonEmpty).join(" · ");
          if (meta) info.appendChild(el("p", "kzd-pro__app-meta", meta));
          top.appendChild(info);
          c.appendChild(top);

          // TODO(backend): when the admin dashboard can schedule interviews,
          // fill this line with the date, time and format (in person / online).
          // It is deliberately left in place and empty so adding that needs no
          // restructuring of the card.
          if (stage === "interviewing") {
            var sched = el("p", "kzd-pro__app-schedule");
            if (nonEmpty(a.interviewAt)) {
              sched.textContent = [fmtDate(a.interviewAt), a.interviewTime, a.interviewFormat]
                .filter(nonEmpty).join(" · ");
            }
            c.appendChild(sched);
          }

          c.appendChild(el("p", "kzd-pro__app-date", "Applied " + fmtDate(a.submittedAt)));
          body.appendChild(c);
        });
      }
      col.appendChild(body);
      board.appendChild(col);
    });

    card.appendChild(board);
    wrap.appendChild(card);
  }

  /* ======================================================================
     Modals — reuse the auth-modal shell so it reads as one system.
     ====================================================================== */

  var openModal = null;

  function modal(title, sub, buildBody, onSubmit) {
    closeModal();

    var scrim = el("div", "kzd-auth-scrim");
    var box = el("div", "kzd-auth-modal");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    var close = el("button", "kzd-auth__close");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.appendChild(svg(ICONS.x));
    box.appendChild(close);

    var h = el("h2", "kzd-auth__title", title);
    h.id = "kzd-pro-modal-title";
    box.setAttribute("aria-labelledby", h.id);
    box.appendChild(h);
    if (sub) box.appendChild(el("p", "kzd-auth__sub", sub));

    var form = el("form", "kzd-auth__form");
    form.noValidate = true;
    buildBody(form);

    if (onSubmit) {
      var submit = el("button", "kzd-auth__primary", "Save");
      submit.type = "submit";
      form.appendChild(submit);
    }
    var cancel = el("button", "kzd-auth__secondary", onSubmit ? "Cancel" : "Close");
    cancel.type = "button";
    cancel.addEventListener("click", closeModal);
    form.appendChild(cancel);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!onSubmit || onSubmit(form) !== false) closeModal();
    });

    box.appendChild(form);
    scrim.appendChild(box);
    document.body.appendChild(scrim);

    var prevFocus = document.activeElement;
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function focusables() {
      return Array.prototype.filter.call(
        box.querySelectorAll("a[href], button:not([disabled]), input, select, textarea"),
        function (n) { return n.offsetWidth > 0 || n.offsetHeight > 0; });
    }

    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
      if (e.key !== "Tab") return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    close.addEventListener("click", closeModal);
    scrim.addEventListener("click", function (e) { if (e.target === scrim) closeModal(); });
    document.addEventListener("keydown", onKey);

    openModal = function () {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      openModal = null;
    };

    requestAnimationFrame(function () { scrim.classList.add("is-open"); });
    var f = focusables();
    if (f.length) f[0].focus();
  }

  function closeModal() { if (openModal) openModal(); }

  function notice(message) {
    modal("Documents", message, function () {}, null);
  }

  function textField(form, id, label, value, required) {
    var wrap = el("div", "kzd-auth__field");
    var l = el("label", "kzd-auth__label", label);
    l.setAttribute("for", "kzd-pro-f-" + id);
    if (required) l.appendChild(el("span", "kzd-auth__req", "*"));
    wrap.appendChild(l);
    var input = el("input", "kzd-auth__input");
    input.type = "text";
    input.id = "kzd-pro-f-" + id;
    input.dataset.field = id;
    input.value = value || "";
    wrap.appendChild(input);
    var err = el("p", "kzd-auth__error");
    err.id = "kzd-pro-f-" + id + "-error";
    wrap.appendChild(err);
    form.appendChild(wrap);
    return input;
  }

  function entryModal(key, index) {
    var spec = ENTRY_FORMS[key];
    var existing = index == null ? {} : profile[key][index];
    var verb = index == null ? "Add" : "Edit";

    modal(verb + " " + spec.title, null, function (form) {
      spec.fields.forEach(function (f) {
        textField(form, f.id, f.label, existing[f.id], f.required);
      });
    }, function (form) {
      var out = {}, ok = true;
      spec.fields.forEach(function (f) {
        var input = form.querySelector('[data-field="' + f.id + '"]');
        var v = input.value.trim();
        var errNode = form.querySelector("#kzd-pro-f-" + f.id + "-error");
        if (f.required && !v) {
          errNode.textContent = f.label + " is required.";
          input.closest(".kzd-auth__field").classList.add("has-error");
          ok = false;
        } else {
          errNode.textContent = "";
          input.closest(".kzd-auth__field").classList.remove("has-error");
        }
        out[f.id] = v;
      });
      if (!ok) return false;

      if (index == null) profile[key].push(out);
      else profile[key][index] = out;
      save();
      renderTab("profile", true);
    });
  }

  function linksModal() {
    modal("Portfolio and links", "Leave any of them blank.", function (form) {
      LINK_SPECS.forEach(function (s) {
        textField(form, s.id, s.label, profile.links[s.id], false);
      });
    }, function (form) {
      LINK_SPECS.forEach(function (s) {
        profile.links[s.id] = form.querySelector('[data-field="' + s.id + '"]').value.trim();
      });
      save();
      renderTab("profile", true);
    });
  }

  function chipModal(key, heading, addLabel) {
    modal(addLabel, "Press Enter to add each one.", function (form) {
      var input = textField(form, "chip", heading, "", false);
      var preview = el("ul", "kzd-pro__chips");
      form.appendChild(preview);

      function paint() {
        preview.innerHTML = "";
        profile[key].forEach(function (name, i) {
          var li = el("li", "kzd-pro__chip kzd-pro__chip--in", name);
          var x = el("button", "kzd-pro__chip-x");
          x.type = "button";
          x.setAttribute("aria-label", "Remove " + name);
          x.appendChild(svg(ICONS.x));
          x.addEventListener("click", function () {
            profile[key].splice(i, 1);
            save();
            paint();
          });
          li.appendChild(x);
          preview.appendChild(li);
        });
      }
      paint();

      input.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        var v = input.value.trim();
        if (!v) return;
        if (profile[key].indexOf(v) === -1) profile[key].push(v);
        input.value = "";
        save();
        paint();
      });
    }, function (form) {
      var input = form.querySelector('[data-field="chip"]');
      var v = input.value.trim();
      if (v && profile[key].indexOf(v) === -1) profile[key].push(v);
      save();
      renderTab("profile", true);
    });
  }

  /* ======================================================================
     Tabs
     ====================================================================== */

  var TAB_IDS = ["profile", "personal", "tracker"];
  var current = null;

  function buildTab(id) {
    if (id === "profile") buildProfileTab();
    else if (id === "personal") buildPersonalTab();
    else buildTrackerTab();
  }

  function stagger(panel) {
    var rises = panel.querySelectorAll(".kzd-pro__rise");
    Array.prototype.forEach.call(rises, function (n, i) {
      n.style.setProperty("--kzd-p-delay", (i * 60) + "ms");
      requestAnimationFrame(function () { n.classList.add("is-in"); });
    });
  }

  function renderTab(id, rebuildOnly) {
    if (rebuildOnly) {
      buildTab(id);
      stagger(panels[id]);
      return;
    }

    var from = current ? panels[current] : null;
    current = id;

    TAB_IDS.forEach(function (t) {
      var tab = tabs.filter(function (x) { return x.dataset.tab === t; })[0];
      tab.setAttribute("aria-selected", String(t === id));
      tab.tabIndex = t === id ? 0 : -1;
    });

    function show() {
      TAB_IDS.forEach(function (t) { panels[t].hidden = t !== id; });
      buildTab(id);
      var panel = panels[id];
      panel.classList.remove("is-leaving");
      if (!reduced()) {
        panel.classList.add("is-entering");
        requestAnimationFrame(function () {
          panel.classList.remove("is-entering");
          panel.classList.add("is-entered");
        });
      }
      stagger(panel);
    }

    if (from && from !== panels[id] && !reduced()) {
      from.classList.add("is-leaving");
      window.setTimeout(function () {
        from.classList.remove("is-leaving", "is-entered");
        show();
      }, 240);
    } else {
      show();
    }
  }

  function hashTab() {
    var h = (location.hash || "").replace("#", "");
    return TAB_IDS.indexOf(h) === -1 ? "profile" : h;
  }

  /* ======================================================================
     Boot
     ====================================================================== */

  function init() {
    root = document.querySelector(".kzd-pro");
    if (!root) return;

    // Signed-out visitors never see this page. careers.html?signin=1 opens the
    // sign-in modal on arrival.
    // TODO(backend): this is a client-side guard only — it hides the UI, it
    // does not protect data. The real protection is the server refusing to
    // return another applicant's record.
    if (!window.KZDAuth || !window.KZDAuth.isSignedIn()) {
      location.replace("careers.html?signin=1&next=profile.html");
      return;
    }

    hydrate();

    TAB_IDS.forEach(function (t) { panels[t] = root.querySelector('[data-panel="' + t + '"]'); });
    tabs = Array.prototype.slice.call(root.querySelectorAll(".kzd-pro__tab"));

    banner = root.querySelector(".kzd-pro__banner");
    bannerSub = root.querySelector(".kzd-pro__banner-sub");
    meterFill = root.querySelector(".kzd-pro__meter-fill");
    pctLive = root.querySelector(".kzd-pro__pct-live");

    root.querySelector(".kzd-pro__banner-btn").addEventListener("click", function () {
      var next = firstIncomplete();
      if (!next) return;
      if (current !== "profile" && (next === "personal")) { go("personal"); }
      else if (current !== "profile") { go("profile"); }
      window.setTimeout(function () {
        var target = root.querySelector('[data-section="' + next + '"]');
        if (target) {
          target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
          var btn = target.querySelector(".kzd-pro__icon-btn");
          if (btn) btn.focus({ preventScroll: true });
        }
      }, 260);
    });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { go(tab.dataset.tab); });
      tab.addEventListener("keydown", function (e) {
        var i = TAB_IDS.indexOf(tab.dataset.tab), n = null;
        if (e.key === "ArrowRight") n = (i + 1) % TAB_IDS.length;
        else if (e.key === "ArrowLeft") n = (i - 1 + TAB_IDS.length) % TAB_IDS.length;
        else if (e.key === "Home") n = 0;
        else if (e.key === "End") n = TAB_IDS.length - 1;
        if (n === null) return;
        e.preventDefault();
        go(TAB_IDS[n]);
        tabs[n].focus();
      });
    });

    if (!reduced()) root.classList.add("kzd-pro--anim");

    renderHeader();
    renderTab(hashTab());
    // First paint: fill the meter and set the number without a count-up.
    refreshCompletion(false);

    window.addEventListener("hashchange", function () {
      var t = hashTab();
      if (t !== current) renderTab(t);
    });

    root.removeAttribute("aria-busy");
  }

  function go(id) {
    if (id === current) return;
    // Hash carries the tab so refresh and Back both land where you were.
    location.hash = id;
    renderTab(id);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

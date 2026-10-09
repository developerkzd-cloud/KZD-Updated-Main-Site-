/* ==========================================================================
   KZD Admin — PAGE CONTENT (the CMS)

   PAYLOAD: LIKELY REPLACED. This screen is a small hand-built CMS, and
   Payload is a CMS with its own admin panel. Do not invest here. What to
   carry over is the FIELD MODEL: CONTENT_DEFAULTS in js/kzd-store.js lists
   every editable string per page (careers landing page, job detail page,
   application form, auth modals). Those become Payload fields, and the
   defaults become their initial values. The rest of the admin map is in
   js/kzd-admin.js.

   CAUTION, so nobody plans around behaviour that does not exist: only the
   "careers" group is read by a public page (js/kzd-careers.js, via
   getPageContent). The "job", "application" and "auth" groups are editable
   here, but js/kzd-job.js and js/kzd-auth.js hard-code the same strings, so
   editing those three changes nothing on the live site. Treat them as
   defaults still to be wired up, not as working editing.

   Every editable string on the careers pages, grouped by the page it belongs
   to and by section. Each section saves on its own — one giant form would mean
   one giant undo.

   The models here mirror js/kzd-store.js CONTENT_DEFAULTS exactly. The public
   pages read the same keys, so an edit here changes the live page.
   ========================================================================== */

import {
  store, el, svg, ICONS, mountShell, toast, errorBlock, confirmDialog
} from "./kzd-admin.js";

/* Field kinds: text | area | url | repeat
   `limit` adds a character counter and a soft cap. */
const MODELS = {
  careers: {
    label: "Careers landing page",
    blurb: "The eyebrow, headline, intro and every section on careers.html",
    preview: "../careers.html",
    sections: [
      { id: "Header", fields: [
        { key: "eyebrow", label: "Eyebrow", kind: "text", limit: 40 },
        { key: "h1", label: "Heading (H1)", kind: "text", limit: 90 },
        { key: "intro", label: "Intro paragraph", kind: "area", limit: 320 }
      ]},
      { id: "Current openings", fields: [
        { key: "openingsHeading", label: "Heading", kind: "text", limit: 60 },
        { key: "openingsEmpty", label: "Empty-state text", kind: "text", limit: 140 }
      ]},
      { id: "Why work here", fields: [
        { key: "whyHeading", label: "Heading", kind: "text", limit: 60 },
        { key: "whyCards", label: "Cards", kind: "repeat",
          shape: [{ key: "title", label: "Title", limit: 60 }, { key: "body", label: "Body", area: true, limit: 220 }] }
      ]},
      { id: "How hiring works", fields: [
        { key: "howHeading", label: "Heading", kind: "text", limit: 60 },
        { key: "howSteps", label: "Steps", kind: "repeat",
          shape: [{ key: "index", label: "Number", limit: 4 }, { key: "title", label: "Title", limit: 60 }, { key: "body", label: "Body", area: true, limit: 220 }] }
      ]},
      { id: "We focus on people", fields: [
        { key: "peopleHeading", label: "Heading", kind: "text", limit: 60 },
        { key: "peopleBody", label: "Body", kind: "area", limit: 260 },
        { key: "peopleLinkUrl", label: "Google reviews link", kind: "url" }
      ]}
    ]
  },
  job: {
    label: "Job detail page",
    blurb: "Section headings and the what-happens-next callout on job.html",
    preview: "../job.html?job=junior-web-developer",
    sections: [
      { id: "Section headings", fields: [
        { key: "descriptionHeading", label: "Job description", kind: "text", limit: 60 },
        { key: "whyHeading", label: "Why KZD Solutions", kind: "text", limit: 60 },
        { key: "workOnHeading", label: "What you will work on", kind: "text", limit: 60 },
        { key: "lookingForHeading", label: "What we are looking for", kind: "text", limit: 60 },
        { key: "niceToHaveHeading", label: "Nice to have", kind: "text", limit: 60 },
        { key: "offerHeading", label: "What we offer", kind: "text", limit: 60 }
      ]},
      { id: "What happens next", fields: [
        { key: "nextHeading", label: "Heading", kind: "text", limit: 60 },
        { key: "nextBody", label: "Body", kind: "area", limit: 400 }
      ]}
    ]
  },
  application: {
    label: "Application form",
    blurb: "Every label, placeholder, helper and heading on the apply tab",
    preview: "../job.html?job=junior-web-developer#apply",
    sections: [
      { id: "Section headings", fields: [
        { key: "infoHeading", label: "My information", kind: "text", limit: 60 },
        { key: "infoSub", label: "My information — sub", kind: "text", limit: 120 },
        { key: "docsHeading", label: "Documents", kind: "text", limit: 60 },
        { key: "docsSub", label: "Documents — sub", kind: "text", limit: 120 },
        { key: "questionsHeading", label: "Questions", kind: "text", limit: 60 },
        { key: "questionsSub", label: "Questions — sub", kind: "text", limit: 120 }
      ]},
      { id: "Field labels", fields: [
        { key: "fullNameLabel", label: "Full name — label", kind: "text", limit: 60 },
        { key: "fullNamePlaceholder", label: "Full name — placeholder", kind: "text", limit: 60 },
        { key: "emailLabel", label: "Email — label", kind: "text", limit: 60 },
        { key: "emailPlaceholder", label: "Email — placeholder", kind: "text", limit: 60 },
        { key: "phoneLabel", label: "Phone — label", kind: "text", limit: 60 },
        { key: "phonePlaceholder", label: "Phone — placeholder", kind: "text", limit: 60 },
        { key: "locationLabel", label: "Location — label", kind: "text", limit: 60 },
        { key: "locationPlaceholder", label: "Location — placeholder", kind: "text", limit: 60 }
      ]},
      { id: "Uploads and questions", fields: [
        { key: "cvLabel", label: "CV — label", kind: "text", limit: 60 },
        { key: "cvHelper", label: "CV — helper", kind: "text", limit: 80 },
        { key: "docsLabel", label: "Certificates — label", kind: "text", limit: 60 },
        { key: "docsHelper", label: "Certificates — helper", kind: "text", limit: 80 },
        { key: "portfolioLabel", label: "Portfolio — label", kind: "text", limit: 80 },
        { key: "sourceLabel", label: "Source — label", kind: "text", limit: 80 },
        { key: "whyLabel", label: "Why this role — label", kind: "text", limit: 80 },
        { key: "builtLabel", label: "Something you built — label", kind: "text", limit: 80 }
      ]},
      { id: "Privacy notice", fields: [
        { key: "privacyText", label: "Consent text", kind: "text", limit: 120 },
        { key: "privacyLinkLabel", label: "Link label", kind: "text", limit: 40 },
        { key: "privacyLinkUrl", label: "Link URL", kind: "url" }
      ]}
    ]
  },
  auth: {
    label: "Auth modals",
    blurb: "Titles, subtitles and button labels on the sign-in and register dialogs",
    preview: "../careers.html?signin=1",
    sections: [
      { id: "Sign in", fields: [
        { key: "signInTitle", label: "Title", kind: "text", limit: 60 },
        { key: "signInSub", label: "Subtitle", kind: "area", limit: 160 },
        { key: "signInButton", label: "Button label", kind: "text", limit: 30 },
        { key: "switchToRegister", label: "Switch link label", kind: "text", limit: 40 }
      ]},
      { id: "Register", fields: [
        { key: "registerTitle", label: "Title", kind: "text", limit: 60 },
        { key: "registerSub", label: "Subtitle", kind: "area", limit: 160 },
        { key: "registerButton", label: "Button label", kind: "text", limit: 30 },
        { key: "switchToSignIn", label: "Switch link label", kind: "text", limit: 40 }
      ]}
    ]
  }
};

let shell, page;

/* --------------------------------------------------------------------------
   List of pages
   -------------------------------------------------------------------------- */

function renderList() {
  page.textContent = "";
  shell.setSubtitle(`${Object.keys(MODELS).length} editable pages`);

  const list = el("div", "kzd-ad__pagelist");
  Object.entries(MODELS).forEach(([key, model]) => {
    const b = el("button", "kzd-ad__pagerow");
    b.type = "button";
    const t = el("div");
    t.appendChild(el("h2", "kzd-ad__card-title", model.label));
    t.appendChild(el("p", "kzd-ad__card-sub", model.blurb));
    b.appendChild(t);
    const chev = svg(ICONS.chevUp);
    chev.style.transform = "rotate(90deg)";
    chev.style.width = "18px";
    chev.style.height = "18px";
    chev.style.stroke = "currentColor";
    chev.style.fill = "none";
    chev.style.strokeWidth = "2";
    b.appendChild(chev);
    b.addEventListener("click", () => renderPage(key));
    list.appendChild(b);
  });
  page.appendChild(list);
}

/* --------------------------------------------------------------------------
   One page's sections
   -------------------------------------------------------------------------- */

async function renderPage(key) {
  const model = MODELS[key];
  page.textContent = "";
  shell.setSubtitle(model.label);

  let content;
  try {
    content = await store.getPageContent(key);
  } catch (err) {
    page.appendChild(errorBlock(`Could not load this content. ${err.message}`, () => renderPage(key)));
    return;
  }

  const bar = el("div", "kzd-ad__bar");
  const back = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "← All pages");
  back.type = "button";
  back.addEventListener("click", renderList);
  bar.appendChild(back);
  const actions = el("div", "kzd-ad__bar-actions");

  const prev = el("a", "kzd-ad__btn kzd-ad__btn--ghost", "Preview page");
  prev.href = model.preview;
  prev.target = "_blank";
  prev.rel = "noopener noreferrer";
  prev.style.textDecoration = "none";
  actions.appendChild(prev);
  bar.appendChild(actions);
  page.appendChild(bar);

  model.sections.forEach((sec) => page.appendChild(buildSection(key, model, sec, content)));
}

function buildSection(pageKey, model, sec, content) {
  const box = el("section", "kzd-ad__cms-sec");
  const head = el("div", "kzd-ad__cms-head");
  head.appendChild(el("h2", "kzd-ad__card-title", sec.id));
  const actions = el("div", "kzd-ad__cms-actions");
  head.appendChild(actions);
  box.appendChild(head);

  const body = el("div");
  box.appendChild(body);

  // Working copy so Cancel really cancels.
  let draft = {};
  sec.fields.forEach((f) => {
    draft[f.key] = f.kind === "repeat"
      ? JSON.parse(JSON.stringify(content[f.key] || []))
      : (content[f.key] ?? "");
  });

  const saveBtn = el("button", "kzd-ad__btn kzd-ad__btn--primary", "Save");
  saveBtn.type = "button";
  const cancelBtn = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Cancel");
  cancelBtn.type = "button";
  const resetBtn = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Reset to default");
  resetBtn.type = "button";
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  actions.appendChild(resetBtn);

  function counter(input, limit, host) {
    if (!limit) return;
    const c = el("span", "kzd-ad__count");
    const paint = () => {
      c.textContent = `${input.value.length}/${limit}`;
      c.style.color = input.value.length > limit ? "#D93025" : "";
    };
    input.addEventListener("input", paint);
    paint();
    host.appendChild(c);
  }

  function textField(host, { label, value, limit, area, url, onInput, aria }) {
    const wrap = el("div", "kzd-ad__field");
    const lab = el("label", "kzd-ad__label", label);
    const id = "cms-" + Math.random().toString(36).slice(2, 8);
    lab.setAttribute("for", id);
    counter(null, null, lab);
    wrap.appendChild(lab);

    const input = area ? el("textarea", "kzd-ad__textarea") : el("input", "kzd-ad__input");
    if (!area) input.type = url ? "url" : "text";
    input.id = id;
    input.value = value ?? "";
    if (aria) input.setAttribute("aria-label", aria);
    input.addEventListener("input", () => onInput(input.value));
    wrap.appendChild(input);
    counter(input, limit, lab);
    host.appendChild(wrap);
    return input;
  }

  function paint() {
    body.textContent = "";
    sec.fields.forEach((f) => {
      if (f.kind === "repeat") {
        body.appendChild(repeatGroup(f));
        return;
      }
      textField(body, {
        label: f.label,
        value: draft[f.key],
        limit: f.limit,
        area: f.kind === "area",
        url: f.kind === "url",
        onInput: (v) => { draft[f.key] = v; }
      });
    });
  }

  function repeatGroup(f) {
    const wrap = el("div");
    const head2 = el("div", "kzd-ad__sec-head");
    head2.appendChild(el("h3", "kzd-ad__sec-title", f.label));
    const add = el("button", "kzd-ad__btn kzd-ad__btn--ghost");
    add.type = "button";
    add.appendChild(svg(ICONS.plus));
    add.appendChild(el("span", null, "Add"));
    add.addEventListener("click", () => {
      const blank = {};
      f.shape.forEach((s) => { blank[s.key] = ""; });
      draft[f.key].push(blank);
      paint();
    });
    head2.appendChild(add);
    wrap.appendChild(head2);

    const list = el("ul", "kzd-ad__items");
    const items = draft[f.key];

    if (!items.length) list.appendChild(el("li", "kzd-ad__empty", "None yet"));

    items.forEach((item, i) => {
      const li = el("li", "kzd-ad__item");
      li.draggable = true;

      const grip = el("span", "kzd-ad__grip");
      grip.setAttribute("aria-hidden", "true");
      grip.textContent = "⠿";
      li.appendChild(grip);

      const fields = el("div", "kzd-ad__item-fields");
      f.shape.forEach((s) => {
        textField(fields, {
          label: "",
          aria: `${f.label} ${i + 1} ${s.label}`,
          value: item[s.key],
          limit: s.limit,
          area: s.area,
          onInput: (v) => { item[s.key] = v; }
        });
        const lastLabel = fields.querySelector(".kzd-ad__field:last-child .kzd-ad__label");
        if (lastLabel) lastLabel.textContent = s.label;
      });
      li.appendChild(fields);

      const tools = el("div", "kzd-ad__item-tools");
      const mk = (label, fn, disabled, rotate) => {
        const b = el("button", "kzd-ad__kebab");
        b.type = "button";
        b.setAttribute("aria-label", label);
        b.disabled = !!disabled;
        if (disabled) b.title = rotate ? "Already last" : "Already first";
        const g = svg(ICONS.chevUp);
        if (rotate) g.style.transform = "rotate(180deg)";
        b.appendChild(g);
        if (!disabled) b.addEventListener("click", fn);
        return b;
      };
      tools.appendChild(mk(`Move ${f.label} ${i + 1} up`, () => {
        [items[i - 1], items[i]] = [items[i], items[i - 1]]; paint();
      }, i === 0, false));
      tools.appendChild(mk(`Move ${f.label} ${i + 1} down`, () => {
        [items[i + 1], items[i]] = [items[i], items[i + 1]]; paint();
      }, i === items.length - 1, true));

      const del = el("button", "kzd-ad__kebab");
      del.type = "button";
      del.setAttribute("aria-label", `Remove ${f.label} ${i + 1}`);
      del.appendChild(svg(ICONS.x));
      del.addEventListener("click", () => { items.splice(i, 1); paint(); });
      tools.appendChild(del);
      li.appendChild(tools);

      li.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(i));
        li.classList.add("is-dragging");
      });
      li.addEventListener("dragend", () => li.classList.remove("is-dragging"));
      li.addEventListener("dragover", (e) => { e.preventDefault(); li.classList.add("is-over"); });
      li.addEventListener("dragleave", () => li.classList.remove("is-over"));
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        li.classList.remove("is-over");
        const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (isNaN(from) || from === i) return;
        const [moved] = items.splice(from, 1);
        items.splice(i, 0, moved);
        paint();
      });

      list.appendChild(li);
    });

    wrap.appendChild(list);
    return wrap;
  }

  saveBtn.addEventListener("click", async () => {
    const label = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "";
    saveBtn.appendChild(el("span", "kzd-ad__spin"));
    try {
      const updated = await store.savePageContent(pageKey, draft);
      Object.assign(content, updated);
      toast(`"${sec.id}" saved. The public page uses it immediately.`);
    } catch (err) {
      toast(`Could not save. ${err.message}`, { error: true });
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = label;
    }
  });

  cancelBtn.addEventListener("click", () => {
    sec.fields.forEach((f) => {
      draft[f.key] = f.kind === "repeat"
        ? JSON.parse(JSON.stringify(content[f.key] || []))
        : (content[f.key] ?? "");
    });
    paint();
    toast("Changes discarded.");
  });

  resetBtn.addEventListener("click", async () => {
    const ok = await confirmDialog({
      title: `Reset "${sec.id}" to default?`,
      body: "The original wording that ships with the site will be restored for this section only.",
      confirmLabel: "Reset"
    });
    if (!ok) return;
    try {
      const fresh = await store.resetPageContent(pageKey, sec.fields.map((f) => f.key));
      Object.assign(content, fresh);
      sec.fields.forEach((f) => {
        draft[f.key] = f.kind === "repeat"
          ? JSON.parse(JSON.stringify(fresh[f.key] || []))
          : (fresh[f.key] ?? "");
      });
      paint();
      toast(`"${sec.id}" reset to default.`);
    } catch (err) {
      toast(`Could not reset. ${err.message}`, { error: true });
    }
  });

  paint();
  return box;
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

(async () => {
  try {
    shell = await mountShell({ active: "content", title: "Page content" });
  } catch (e) { return; }
  page = shell.page;
  renderList();
})();

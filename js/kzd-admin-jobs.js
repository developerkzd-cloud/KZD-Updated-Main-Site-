/* ==========================================================================
   KZD Admin — JOB POSTINGS

   PAYLOAD: LIKELY REPLACED. The site is moving to Payload CMS, and Payload
   ships its own admin panel; job postings are exactly what it manages. Do not
   invest in this screen. What to carry over is the DATA MODEL, not the UI:
   the posting fields in js/kzd-store.js (SEED_JOBS shows the shape: id, slug,
   title, department, type, location, status open|closed, summary, detail),
   the six body sections, and the two item shapes below. The Next side already
   reads jobs through one seam, kzd-next/src/lib/content.ts. The rest of the
   admin map is in js/kzd-admin.js.

   Full CRUD. Every field the public job page renders is editable here, which
   is why the editor mirrors the six body sections exactly.

   Items in a section are either a plain bullet (a string) or a bold-lead
   bullet ({ title, body }) — the same two shapes js/kzd-job.js renders.

   Reordering works by drag AND by keyboard. Drag alone is not accessible: it
   is unusable with a keyboard, a switch device or a screen reader, so the
   move-up / move-down buttons are the primary control and drag is the
   enhancement.
   ========================================================================== */

import {
  store, el, svg, ICONS, kebabIcon, fmtDate,
  mountShell, toast, errorBlock, skeletonRows, confirmDialog, modal
} from "./kzd-admin.js";

const SECTIONS = [
  { key: "description",  label: "Job description",       kind: "text"  },
  { key: "why",          label: "Why KZD Solutions",     kind: "lead"  },
  { key: "workOn",       label: "What you will work on",  kind: "plain" },
  { key: "lookingFor",   label: "What we are looking for", kind: "plain" },
  { key: "niceToHave",   label: "Nice to have",          kind: "plain" },
  { key: "offer",        label: "What we offer",         kind: "lead"  }
];

const TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const STATUSES = ["open", "closed", "draft"];

let shell, page;
let dirty = false;

/* --------------------------------------------------------------------------
   Unsaved-changes guard
   -------------------------------------------------------------------------- */

function setDirty(v) {
  dirty = v;
  if (v) window.addEventListener("beforeunload", beforeUnload);
  else window.removeEventListener("beforeunload", beforeUnload);
}

function beforeUnload(e) { e.preventDefault(); e.returnValue = ""; }

async function guard() {
  if (!dirty) return true;
  const ok = await confirmDialog({
    title: "Discard unsaved changes?",
    body: "This posting has edits that have not been saved.",
    confirmLabel: "Discard"
  });
  if (ok) setDirty(false);
  return !!ok;
}

/* --------------------------------------------------------------------------
   LIST
   -------------------------------------------------------------------------- */

async function renderList() {
  page.textContent = "";
  setDirty(false);

  const bar = el("div", "kzd-ad__bar");
  bar.appendChild(el("div"));                 // left slot, keeps space-between honest
  const actions = el("div", "kzd-ad__bar-actions");
  const add = el("button", "kzd-ad__btn kzd-ad__btn--primary");
  add.type = "button";
  add.appendChild(svg(ICONS.plus));
  add.appendChild(el("span", null, "New job posting"));
  add.addEventListener("click", () => renderEditor(null));
  actions.appendChild(add);
  bar.appendChild(actions);
  page.appendChild(bar);

  const card = el("section", "kzd-ad__card");
  page.appendChild(card);

  const skel = el("table", "kzd-ad__table");
  const sb = el("tbody");
  sb.appendChild(skeletonRows(4, 6));
  skel.appendChild(sb);
  card.appendChild(skel);

  let jobs, apps;
  try {
    [jobs, apps] = await Promise.all([store.getJobs(), store.getApplications()]);
  } catch (err) {
    card.textContent = "";
    card.appendChild(errorBlock(`Could not load job postings. ${err.message}`, renderList));
    return;
  }

  card.textContent = "";
  const open = jobs.filter((j) => j.status === "open").length;
  shell.setSubtitle(`${jobs.length} posting${jobs.length === 1 ? "" : "s"} · ${open} open`);

  if (!jobs.length) {
    card.appendChild(el("p", "kzd-ad__empty", "No job postings yet. Create the first one."));
    return;
  }

  const table = el("table", "kzd-ad__table");
  const thead = el("thead");
  const hr = el("tr");
  ["Title", "Department", "Type", "Location", "Status", "Applications", "Created", ""]
    .forEach((h) => hr.appendChild(el("th", null, h)));
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el("tbody");
  jobs.forEach((j) => {
    const n = apps.filter((a) => a.jobId === j.id).length;
    const tr = el("tr");
    tr.tabIndex = 0;

    const t = el("td"); t.dataset.cell = "applicant";
    t.appendChild(el("div", "kzd-ad__person-name", j.title));
    t.appendChild(el("div", "kzd-ad__person-mail", `/${j.slug}`));
    tr.appendChild(t);

    const dep = el("td", null, j.department || "—"); dep.dataset.cell = "role"; tr.appendChild(dep);
    const typ = el("td", null, j.type || "—"); typ.dataset.cell = "role"; tr.appendChild(typ);
    const loc = el("td", null, j.location || "—"); loc.dataset.cell = "role"; tr.appendChild(loc);

    const st = el("td"); st.dataset.cell = "status";
    const chipCls = j.status === "open" ? "offer" : (j.status === "draft" ? "reviewing" : "rejected");
    st.appendChild(el("span", `kzd-ad__chip kzd-ad__chip--${chipCls}`, j.status.toUpperCase()));
    tr.appendChild(st);

    const cnt = el("td", null, String(n)); cnt.dataset.cell = "applied"; tr.appendChild(cnt);
    const cr = el("td", null, fmtDate(j.createdAt)); cr.dataset.cell = "applied"; tr.appendChild(cr);

    const menuCell = el("td"); menuCell.dataset.cell = "menu";
    const kebab = el("button", "kzd-ad__kebab");
    kebab.type = "button";
    kebab.setAttribute("aria-label", `Actions for ${j.title}`);
    kebab.setAttribute("aria-haspopup", "menu");
    kebab.appendChild(kebabIcon());
    kebab.addEventListener("click", (e) => { e.stopPropagation(); jobMenu(kebab, j, n); });
    menuCell.appendChild(kebab);
    tr.appendChild(menuCell);

    tr.addEventListener("click", (e) => { if (!e.target.closest(".kzd-ad__kebab")) renderEditor(j.id); });
    tr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); renderEditor(j.id); }
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);
}

function jobMenu(anchor, job, appCount) {
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

  add("Edit", () => renderEditor(job.id));

  add("Duplicate", async () => {
    const copy = JSON.parse(JSON.stringify(job));
    delete copy.id;
    copy.title = `${job.title} (copy)`;
    copy.slug = "";
    copy.status = "draft";
    try {
      const made = await store.saveJob(copy);
      toast(`Duplicated as "${made.title}".`);
      renderList();
    } catch (err) { toast(`Could not duplicate. ${err.message}`, { error: true }); }
  });

  add(job.status === "closed" ? "Reopen" : "Close", async () => {
    try {
      await store.saveJob({ ...job, status: job.status === "closed" ? "open" : "closed" });
      toast(job.status === "closed" ? "Posting reopened." : "Posting closed.");
      renderList();
      shell.refreshBell();
    } catch (err) { toast(`Could not update. ${err.message}`, { error: true }); }
  });

  add("Delete", async () => {
    const warn = appCount
      ? `${job.title} has ${appCount} application${appCount === 1 ? "" : "s"} attached. Deleting the posting does not delete them, but they will no longer link to a live role.`
      : `${job.title} will be removed permanently.`;
    const ok = await confirmDialog({ title: "Delete this posting?", body: warn, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await store.deleteJob(job.id);
      toast(`"${job.title}" deleted.`);
      renderList();
    } catch (err) { toast(`Could not delete. ${err.message}`, { error: true }); }
  }, true);

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

/* --------------------------------------------------------------------------
   EDITOR
   -------------------------------------------------------------------------- */

function blankJob() {
  return {
    title: "", slug: "", department: "", type: "Full-time", location: "Durban",
    status: "draft", summary: "",
    detail: { description: [], why: [], workOn: [], lookingFor: [], niceToHave: [], offer: [] }
  };
}

async function renderEditor(id) {
  page.textContent = "";

  let job;
  if (id) {
    try { job = JSON.parse(JSON.stringify(await store.getJob(id))); }
    catch (err) { page.appendChild(errorBlock(`Could not load that posting. ${err.message}`, renderList)); return; }
  } else {
    job = blankJob();
  }

  job.detail = Object.assign({ description: [], why: [], workOn: [], lookingFor: [], niceToHave: [], offer: [] }, job.detail || {});
  let slugTouched = !!job.slug;

  shell.setSubtitle(id ? `Editing "${job.title}"` : "New job posting");

  /* --- header ---------------------------------------------------------- */
  const bar = el("div", "kzd-ad__bar");
  const back = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "← All postings");
  back.type = "button";
  back.addEventListener("click", async () => { if (await guard()) renderList(); });
  bar.appendChild(back);

  const actions = el("div", "kzd-ad__bar-actions");

  const previewToggle = el("button", "kzd-ad__btn kzd-ad__btn--ghost", "Preview");
  previewToggle.type = "button";
  previewToggle.setAttribute("aria-pressed", "false");
  actions.appendChild(previewToggle);

  const saveBtn = el("button", "kzd-ad__btn kzd-ad__btn--primary", "Save posting");
  saveBtn.type = "button";
  actions.appendChild(saveBtn);
  bar.appendChild(actions);
  page.appendChild(bar);

  /* --- layout: editor | live preview ----------------------------------- */
  const split = el("div", "kzd-ad__split");
  const form = el("div", "kzd-ad__card");
  const preview = el("aside", "kzd-ad__card kzd-ad__preview");
  split.appendChild(form);
  split.appendChild(preview);
  page.appendChild(split);

  previewToggle.addEventListener("click", () => {
    const on = split.classList.toggle("is-preview");
    previewToggle.setAttribute("aria-pressed", String(on));
  });

  /* --- basics ---------------------------------------------------------- */
  const mkField = (parent, { label, value, id, type = "text", options, textarea, hint }) => {
    const wrap = el("div", "kzd-ad__field");
    const l = el("label", "kzd-ad__label", label);
    l.setAttribute("for", "job-" + id);
    wrap.appendChild(l);
    let input;
    if (options) {
      input = el("select", "kzd-ad__select");
      options.forEach((o) => { const opt = el("option", null, o); opt.value = o; input.appendChild(opt); });
    } else if (textarea) {
      input = el("textarea", "kzd-ad__textarea");
    } else {
      input = el("input", "kzd-ad__input");
      input.type = type;
    }
    input.id = "job-" + id;
    input.value = value || "";
    wrap.appendChild(input);
    if (hint) wrap.appendChild(el("p", "kzd-ad__hint", hint));
    const err = el("p", "kzd-ad__err");
    wrap.appendChild(err);
    parent.appendChild(wrap);
    return { wrap, input, err };
  };

  form.appendChild(el("h2", "kzd-ad__card-title", "Basics"));

  const fTitle = mkField(form, { label: "Job title", value: job.title, id: "title" });
  const fSlug = mkField(form, { label: "Slug", value: job.slug, id: "slug",
    hint: "Used in the public URL: job.html?job=<slug>. Generated from the title until you edit it." });

  const row1 = el("div", "kzd-ad__row2");
  const fDept = mkField(row1, { label: "Department", value: job.department, id: "dept" });
  const fType = mkField(row1, { label: "Type", value: job.type, id: "type", options: TYPES });
  form.appendChild(row1);

  const row2 = el("div", "kzd-ad__row2");
  const fLoc = mkField(row2, { label: "Location", value: job.location, id: "loc" });
  const fStatus = mkField(row2, { label: "Status", value: job.status, id: "status", options: STATUSES });
  form.appendChild(row2);

  const fSummary = mkField(form, { label: "Summary", value: job.summary, id: "summary", textarea: true,
    hint: "One or two lines. Shown on the careers listing card." });

  fTitle.input.addEventListener("input", () => {
    if (!slugTouched) fSlug.input.value = store.slugify(fTitle.input.value);
    change();
  });
  fSlug.input.addEventListener("input", () => { slugTouched = true; change(); });
  [fDept, fType, fLoc, fStatus, fSummary].forEach((f) => f.input.addEventListener("input", change));

  /* --- body sections --------------------------------------------------- */
  form.appendChild(el("h2", "kzd-ad__card-title", "Body sections"));
  form.appendChild(el("p", "kzd-ad__card-sub",
    "Reorder with the arrows or by dragging. The arrows are the accessible route — drag is an extra."));

  SECTIONS.forEach((sec) => form.appendChild(buildSection(sec)));

  function buildSection(sec) {
    const box = el("section", "kzd-ad__sec");
    const head = el("div", "kzd-ad__sec-head");
    head.appendChild(el("h3", "kzd-ad__sec-title", sec.label));

    const addBtn = el("button", "kzd-ad__btn kzd-ad__btn--ghost");
    addBtn.type = "button";
    addBtn.appendChild(svg(ICONS.plus));
    addBtn.appendChild(el("span", null, "Add item"));
    head.appendChild(addBtn);
    box.appendChild(head);

    const list = el("ul", "kzd-ad__items");
    list.dataset.section = sec.key;
    box.appendChild(list);

    const paint = () => {
      list.textContent = "";
      const items = job.detail[sec.key];
      if (!items.length) {
        list.appendChild(el("li", "kzd-ad__empty", "No items yet"));
        return;
      }
      items.forEach((item, i) => list.appendChild(buildItem(sec, item, i, items, paint)));
    };

    addBtn.addEventListener("click", () => {
      job.detail[sec.key].push(sec.kind === "lead" ? { title: "", body: "" } : "");
      change();
      paint();
      const inputs = list.querySelectorAll("input, textarea");
      inputs[inputs.length - 1]?.focus();
    });

    paint();
    return box;
  }

  function buildItem(sec, item, i, items, paint) {
    const li = el("li", "kzd-ad__item");
    li.draggable = true;
    li.dataset.index = String(i);

    const grip = el("span", "kzd-ad__grip");
    grip.setAttribute("aria-hidden", "true");
    grip.textContent = "⠿";
    li.appendChild(grip);

    const fields = el("div", "kzd-ad__item-fields");

    if (sec.kind === "lead") {
      const t = el("input", "kzd-ad__input");
      t.value = item.title || "";
      t.placeholder = "Bold lead";
      t.setAttribute("aria-label", `${sec.label} item ${i + 1} title`);
      t.addEventListener("input", () => { items[i].title = t.value; change(); });
      fields.appendChild(t);

      const b = el("textarea", "kzd-ad__textarea");
      b.value = item.body || "";
      b.placeholder = "Paragraph";
      b.setAttribute("aria-label", `${sec.label} item ${i + 1} body`);
      b.addEventListener("input", () => { items[i].body = b.value; change(); });
      fields.appendChild(b);
    } else {
      const one = el(sec.kind === "text" ? "textarea" : "input", sec.kind === "text" ? "kzd-ad__textarea" : "kzd-ad__input");
      one.value = item || "";
      one.placeholder = sec.kind === "text" ? "Paragraph" : "Bullet";
      one.setAttribute("aria-label", `${sec.label} item ${i + 1}`);
      one.addEventListener("input", () => { items[i] = one.value; change(); });
      fields.appendChild(one);
    }
    li.appendChild(fields);

    const tools = el("div", "kzd-ad__item-tools");

    const mkTool = (label, glyph, fn, disabled) => {
      const b = el("button", "kzd-ad__kebab");
      b.type = "button";
      b.setAttribute("aria-label", label);
      b.disabled = !!disabled;
      if (disabled) b.title = label.includes("up") ? "Already first" : "Already last";
      b.appendChild(svg(glyph));
      if (!disabled) b.addEventListener("click", fn);
      return b;
    };

    // Keyboard route — the primary one.
    tools.appendChild(mkTool(`Move item ${i + 1} up`, ICONS.chevUp, () => {
      [items[i - 1], items[i]] = [items[i], items[i - 1]];
      change(); paint();
      li.parentNode?.children[i - 1]?.querySelector("button:not([disabled])")?.focus();
    }, i === 0));

    const down = mkTool(`Move item ${i + 1} down`, ICONS.chevUp, () => {
      [items[i + 1], items[i]] = [items[i], items[i + 1]];
      change(); paint();
    }, i === items.length - 1);
    down.querySelector("svg").style.transform = "rotate(180deg)";
    tools.appendChild(down);

    const del = el("button", "kzd-ad__kebab");
    del.type = "button";
    del.setAttribute("aria-label", `Remove item ${i + 1}`);
    del.appendChild(svg(ICONS.x));
    del.addEventListener("click", () => { items.splice(i, 1); change(); paint(); });
    tools.appendChild(del);

    li.appendChild(tools);

    /* Drag — the enhancement. */
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(i));
      e.dataTransfer.effectAllowed = "move";
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
      change();
      paint();
    });

    return li;
  }

  /* --- live preview ---------------------------------------------------- */
  let previewTimer = null;
  function change() {
    setDirty(true);
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(paintPreview, 250);      // debounced
  }

  function collect() {
    return {
      ...job,
      title: fTitle.input.value.trim(),
      slug: fSlug.input.value.trim(),
      department: fDept.input.value.trim(),
      type: fType.input.value,
      location: fLoc.input.value.trim(),
      status: fStatus.input.value,
      summary: fSummary.input.value.trim()
    };
  }

  function paintPreview() {
    const j = collect();
    preview.textContent = "";
    preview.appendChild(el("p", "kzd-ad__card-sub", "Live preview — the public job page"));

    preview.appendChild(el("h2", "kzd-ad__pv-title", j.title || "Untitled role"));
    const meta = [j.location, j.type, j.department].filter(Boolean).join(" · ");
    preview.appendChild(el("p", "kzd-ad__pv-meta", meta || "—"));
    if (j.summary) preview.appendChild(el("p", "kzd-ad__pv-summary", j.summary));

    SECTIONS.forEach((sec) => {
      const items = (job.detail[sec.key] || []).filter((it) =>
        sec.kind === "lead" ? (it.title || it.body) : String(it || "").trim());
      if (!items.length) return;

      preview.appendChild(el("h3", "kzd-ad__pv-h", sec.label));
      if (sec.kind === "text") {
        items.forEach((it) => preview.appendChild(el("p", "kzd-ad__pv-p", it)));
      } else {
        const ul = el("ul", "kzd-ad__pv-list");
        items.forEach((it) => {
          const li = el("li");
          if (sec.kind === "lead") {
            li.appendChild(el("strong", null, it.title || ""));
            if (it.body) li.appendChild(el("p", null, it.body));
          } else {
            li.textContent = it;
          }
          ul.appendChild(li);
        });
        preview.appendChild(ul);
      }
    });
  }

  paintPreview();

  /* --- save ------------------------------------------------------------ */
  saveBtn.addEventListener("click", async () => {
    fTitle.err.textContent = "";
    fTitle.wrap.classList.remove("has-error");
    fSlug.err.textContent = "";
    fSlug.wrap.classList.remove("has-error");

    const next = collect();
    if (!next.title) {
      fTitle.err.textContent = "A job needs a title.";
      fTitle.wrap.classList.add("has-error");
      fTitle.input.focus();
      return;
    }

    const label = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "";
    saveBtn.appendChild(el("span", "kzd-ad__spin"));

    try {
      const saved = await store.saveJob(next);
      setDirty(false);
      toast(`"${saved.title}" saved.`);
      renderList();
    } catch (err) {
      saveBtn.disabled = false;
      saveBtn.textContent = label;
      if (/slug/i.test(err.message)) {
        fSlug.err.textContent = err.message;
        fSlug.wrap.classList.add("has-error");
        fSlug.input.focus();
      } else {
        toast(`Could not save. ${err.message}`, { error: true });
      }
    }
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

(async () => {
  try {
    shell = await mountShell({ active: "jobs", title: "Job postings" });
  } catch (e) { return; }
  page = shell.page;

  const editId = new URLSearchParams(location.search).get("edit");
  if (editId) await renderEditor(editId);
  else await renderList();
})();

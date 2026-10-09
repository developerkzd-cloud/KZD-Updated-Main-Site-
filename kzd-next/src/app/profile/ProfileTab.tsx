"use client";

/* ==========================================================================
   Tab 1: "Profile" — documents pulled through from a submitted job
   application, plus work experience, education, projects, links, skills and
   languages, each editable through a modal. Ported from buildProfileTab()
   and its supporting renderers in js/kzd-profile.js.
   ========================================================================== */

import { useMemo, useState } from "react";
import type {
  EducationEntry,
  ExperienceEntry,
  KzdApplication,
  KzdProfile,
  ProfileLinks,
  ProjectEntry,
} from "@/lib/kzdStore";
import EditModal from "./EditModal";
import EntryModal, { type EntryTypeSpec } from "./EntryModal";
import LinksModal from "./LinksModal";
import ChipModal from "./ChipModal";
import {
  CertIcon,
  DocIcon,
  GithubIcon,
  GlobeIcon,
  LinkedInIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "./icons";
import { fmtDate, fmtSize, nonEmpty } from "./helpers";
import styles from "./profile.module.css";

type Doc = { name: string; size: number; date: string | undefined; kind: "CV" | "QUALIFICATION" };

function documentsFrom(apps: KzdApplication[]): Doc[] {
  const out: Doc[] = [];
  apps.forEach((a) => {
    (a.cv ?? []).forEach((f) => out.push({ name: f.name, size: f.size, date: a.submittedAt, kind: "CV" }));
    (a.docs ?? []).forEach((f) => out.push({ name: f.name, size: f.size, date: a.submittedAt, kind: "QUALIFICATION" }));
  });
  return out;
}

const EXPERIENCE_SPEC: EntryTypeSpec<ExperienceEntry> = {
  title: "work experience",
  fields: [
    { id: "role", label: "Job title", required: true },
    { id: "company", label: "Company", required: true },
    { id: "start", label: "Start (e.g. Jan 2024)" },
    { id: "end", label: "End (or leave blank if current)" },
  ],
  line1: (e) => e.role,
  line2: (e) => e.company,
  line3: (e) => [e.start, e.end || "Present"].filter(Boolean).join(" – "),
};

const EDUCATION_SPEC: EntryTypeSpec<EducationEntry> = {
  title: "education",
  fields: [
    { id: "qualification", label: "Qualification", required: true },
    { id: "institution", label: "Institution", required: true },
    { id: "year", label: "Year completed" },
  ],
  line1: (e) => e.qualification,
  line2: (e) => e.institution,
  line3: (e) => e.year,
};

const PROJECT_SPEC: EntryTypeSpec<ProjectEntry> = {
  title: "project",
  fields: [
    { id: "name", label: "Project name", required: true },
    { id: "url", label: "Link (optional)" },
    { id: "note", label: "What it does" },
  ],
  line1: (e) => e.name,
  line2: (e) => e.note,
  line3: (e) => e.url,
};

const LINK_SPECS: { id: keyof ProfileLinks; label: string; icon: "linkedin" | "github" | "portfolio" | "other" }[] = [
  { id: "linkedin", label: "LinkedIn", icon: "linkedin" },
  { id: "github", label: "GitHub", icon: "github" },
  { id: "portfolio", label: "Portfolio", icon: "portfolio" },
  { id: "other", label: "Other", icon: "other" },
];

function LinkGlyph({ icon }: { icon: "linkedin" | "github" | "portfolio" | "other" }) {
  if (icon === "linkedin") return <LinkedInIcon />;
  if (icon === "github") return <GithubIcon />;
  if (icon === "portfolio") return <GlobeIcon />;
  return <LinkIcon />;
}

type Modal =
  | { kind: "notice" }
  | { kind: "entry"; key: "experience" | "education" | "projects"; index: number | null }
  | { kind: "links" }
  | { kind: "chip"; key: "skills" | "languages" };

export default function ProfileTab({
  profile,
  apps,
  onChange,
}: {
  profile: KzdProfile;
  apps: KzdApplication[];
  onChange: (next: KzdProfile) => void;
}) {
  const [modal, setModal] = useState<Modal | null>(null);
  const docs = useMemo(() => documentsFrom(apps), [apps]);

  function updateExperience(entries: ExperienceEntry[]) {
    onChange({ ...profile, experience: entries });
  }
  function updateEducation(entries: EducationEntry[]) {
    onChange({ ...profile, education: entries });
  }
  function updateProjects(entries: ProjectEntry[]) {
    onChange({ ...profile, projects: entries });
  }

  return (
    <div className={styles.tabBody}>
      {/* Documents ----------------------------------------------------- */}
      <section className={styles.card} data-section="cv">
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.cardH}>Documents</h2>
            <p className={styles.cardSub}>Pulled through from your application</p>
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Edit documents"
            onClick={() => setModal({ kind: "notice" })}
          >
            <PencilIcon />
          </button>
        </div>
        {docs.length === 0 ? (
          <p className={styles.empty}>No documents yet</p>
        ) : (
          <div className={styles.docs}>
            {docs.map((d, i) => {
              const qual = d.kind === "QUALIFICATION";
              const bits = [d.date && fmtDate(d.date) ? `Uploaded ${fmtDate(d.date)}` : "", fmtSize(d.size)].filter(Boolean);
              return (
                <div className={styles.doc} key={`${d.name}-${i}`}>
                  <div className={`${styles.docTile} ${qual ? styles.docTileQual : ""}`}>
                    {qual ? <CertIcon /> : <DocIcon />}
                  </div>
                  <div className={styles.docBody}>
                    <p className={styles.docName}>{d.name}</p>
                    <p className={styles.docMeta}>{bits.join(" · ")}</p>
                  </div>
                  <span className={styles.docTag}>{d.kind}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Work experience ------------------------------------------------ */}
      <EntryCard
        heading="Work experience"
        sectionId="experience"
        emptyText="No experience added yet"
        items={profile.experience}
        spec={EXPERIENCE_SPEC}
        onAdd={() => setModal({ kind: "entry", key: "experience", index: null })}
        onEdit={(i) => setModal({ kind: "entry", key: "experience", index: i })}
        onDelete={(i) => updateExperience(profile.experience.filter((_, idx) => idx !== i))}
      />

      {/* Education -------------------------------------------------------- */}
      <EntryCard
        heading="Education"
        sectionId="education"
        emptyText="No education added yet"
        items={profile.education}
        spec={EDUCATION_SPEC}
        onAdd={() => setModal({ kind: "entry", key: "education", index: null })}
        onEdit={(i) => setModal({ kind: "entry", key: "education", index: i })}
        onDelete={(i) => updateEducation(profile.education.filter((_, idx) => idx !== i))}
      />

      {/* Projects ---------------------------------------------------------- */}
      <EntryCard
        heading="Projects"
        sectionId="projects"
        emptyText="No projects added yet"
        items={profile.projects}
        spec={PROJECT_SPEC}
        onAdd={() => setModal({ kind: "entry", key: "projects", index: null })}
        onEdit={(i) => setModal({ kind: "entry", key: "projects", index: i })}
        onDelete={(i) => updateProjects(profile.projects.filter((_, idx) => idx !== i))}
      />

      {/* Portfolio and links ------------------------------------------------ */}
      <section className={styles.card} data-section="links">
        <div className={styles.cardHead}>
          <h2 className={styles.cardH}>Portfolio and links</h2>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Edit portfolio and links"
            onClick={() => setModal({ kind: "links" })}
          >
            <PencilIcon />
          </button>
        </div>
        <div className={styles.links}>
          {LINK_SPECS.map((spec) => {
            const value = profile.links[spec.id];
            const filled = nonEmpty(value);
            const body = (
              <>
                <span className={`${styles.linkTile} ${styles[`linkTile_${spec.icon}`]}`}>
                  <LinkGlyph icon={spec.icon} />
                </span>
                <span className={styles.linkBody}>
                  <span className={styles.linkLabel}>{spec.label}</span>
                  <span className={`${styles.linkValue} ${filled ? "" : styles.linkValueEmpty}`}>
                    {filled ? value.replace(/^https?:\/\//i, "") : "—"}
                  </span>
                </span>
              </>
            );
            if (!filled) {
              return (
                <div className={styles.link} key={spec.id}>
                  {body}
                </div>
              );
            }
            const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
            return (
              <a className={styles.link} key={spec.id} href={href} target="_blank" rel="noopener noreferrer">
                {body}
              </a>
            );
          })}
        </div>
      </section>

      {/* Skills / languages -------------------------------------------- */}
      <ChipCard
        heading="Skills"
        sectionId="skills"
        addLabel="Add a skill"
        items={profile.skills}
        onOpen={() => setModal({ kind: "chip", key: "skills" })}
        onRemove={(i) => onChange({ ...profile, skills: profile.skills.filter((_, idx) => idx !== i) })}
      />
      <ChipCard
        heading="Languages"
        sectionId="languages"
        addLabel="Add a language"
        items={profile.languages}
        onOpen={() => setModal({ kind: "chip", key: "languages" })}
        onRemove={(i) => onChange({ ...profile, languages: profile.languages.filter((_, idx) => idx !== i) })}
      />

      {/* Modals ----------------------------------------------------------- */}
      {modal?.kind === "notice" && (
        <EditModal title="Documents" onClose={() => setModal(null)}>
          {/* TODO(backend): re-uploading needs a real file endpoint. Only
              filenames and sizes exist on this device, so there is nothing to
              replace or download yet. */}
          <p className={styles.noticeBody}>
            Documents come through from your application. Re-uploading will be available once
            applications are stored on the server.
          </p>
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnGhost} onClick={() => setModal(null)}>
              Close
            </button>
          </div>
        </EditModal>
      )}

      {modal?.kind === "entry" && modal.key === "experience" && (
        <EntryModal
          spec={EXPERIENCE_SPEC}
          initial={modal.index == null ? null : profile.experience[modal.index]}
          onClose={() => setModal(null)}
          onSave={(entry) => {
            const next = [...profile.experience];
            if (modal.index == null) next.push(entry);
            else next[modal.index] = entry;
            updateExperience(next);
          }}
        />
      )}
      {modal?.kind === "entry" && modal.key === "education" && (
        <EntryModal
          spec={EDUCATION_SPEC}
          initial={modal.index == null ? null : profile.education[modal.index]}
          onClose={() => setModal(null)}
          onSave={(entry) => {
            const next = [...profile.education];
            if (modal.index == null) next.push(entry);
            else next[modal.index] = entry;
            updateEducation(next);
          }}
        />
      )}
      {modal?.kind === "entry" && modal.key === "projects" && (
        <EntryModal
          spec={PROJECT_SPEC}
          initial={modal.index == null ? null : profile.projects[modal.index]}
          onClose={() => setModal(null)}
          onSave={(entry) => {
            const next = [...profile.projects];
            if (modal.index == null) next.push(entry);
            else next[modal.index] = entry;
            updateProjects(next);
          }}
        />
      )}

      {modal?.kind === "links" && (
        <LinksModal
          links={profile.links}
          onClose={() => setModal(null)}
          onSave={(links) => onChange({ ...profile, links })}
        />
      )}

      {modal?.kind === "chip" && modal.key === "skills" && (
        <ChipModal
          heading="Skills"
          addLabel="Add a skill"
          items={profile.skills}
          onClose={() => setModal(null)}
          onChange={(skills) => onChange({ ...profile, skills })}
        />
      )}
      {modal?.kind === "chip" && modal.key === "languages" && (
        <ChipModal
          heading="Languages"
          addLabel="Add a language"
          items={profile.languages}
          onClose={() => setModal(null)}
          onChange={(languages) => onChange({ ...profile, languages })}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function EntryCard<T extends Record<string, string>>({
  heading,
  sectionId,
  emptyText,
  items,
  spec,
  onAdd,
  onEdit,
  onDelete,
}: {
  heading: string;
  sectionId: string;
  emptyText: string;
  items: T[];
  spec: EntryTypeSpec<T>;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <section className={styles.card} data-section={sectionId}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardH}>{heading}</h2>
        <button type="button" className={styles.iconBtn} aria-label={`Add ${spec.title}`} onClick={onAdd}>
          <PlusIcon />
        </button>
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ul className={styles.entryList}>
          {items.map((item, i) => {
            const line1 = spec.line1(item);
            const line2 = spec.line2(item);
            const line3 = spec.line3(item);
            return (
              <li className={styles.entry} key={i}>
                <div className={styles.entryBody}>
                  <p className={styles.entryTitle}>{line1}</p>
                  {line2 && <p className={styles.entryMeta}>{line2}</p>}
                  {line3 && <p className={styles.entryDates}>{line3}</p>}
                </div>
                <div className={styles.entryActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label={`Edit ${line1 || spec.title}`}
                    onClick={() => onEdit(i)}
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label={`Delete ${line1 || spec.title}`}
                    onClick={() => onDelete(i)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ChipCard({
  heading,
  sectionId,
  addLabel,
  items,
  onOpen,
  onRemove,
}: {
  heading: string;
  sectionId: string;
  addLabel: string;
  items: string[];
  onOpen: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className={styles.card} data-section={sectionId}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardH}>{heading}</h2>
        <button type="button" className={styles.iconBtn} aria-label={addLabel} onClick={onOpen}>
          <PlusIcon />
        </button>
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>No {heading.toLowerCase()} added yet</p>
      ) : (
        <ul className={styles.chips}>
          {items.map((name, i) => (
            <li className={styles.chip} key={name}>
              {name}
              <button
                type="button"
                className={styles.chipX}
                aria-label={`Remove ${name}`}
                onClick={() => onRemove(i)}
              >
                <XIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

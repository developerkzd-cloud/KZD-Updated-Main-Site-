"use client";

/* ==========================================================================
   Tab 2: "Personal info" — personal details plus the POPIA-flagged
   Employment Equity fields, both edited in place (no modal — the original
   brief in js/kzd-profile.js is explicit that this tab edits inline while
   the profile tab uses dialogs). Ported from buildPersonalTab() and
   editableCard().
   ========================================================================== */

import { useState } from "react";
import type { KzdProfile, ProfileEquity, ProfilePersonal } from "@/lib/kzdStore";
import { nonEmpty } from "./helpers";
import { PencilIcon } from "./icons";
import styles from "./profile.module.css";

interface FieldSpec<T> {
  id: keyof T & string;
  label: string;
  type?: string;
  options?: string[];
}

const PERSONAL_FIELDS: FieldSpec<ProfilePersonal>[] = [
  { id: "firstName", label: "First name" },
  { id: "lastName", label: "Last name" },
  { id: "email", label: "Email address", type: "email" },
  { id: "phone", label: "Phone number", type: "tel" },
  { id: "location", label: "Location" },
  { id: "dob", label: "Date of birth", type: "date" },
  { id: "street", label: "Street address" },
  { id: "postal", label: "Postal code" },
];

/* South African Employment Equity categories. Deliberately NOT the US/UK set
   — no veteran status, no LGBTQ+ identity, no non-SA work authorisation.
   Every field carries "Prefer not to say".
   TODO(legal): have the POPIA wording below reviewed and signed off before
   launch. Under POPIA this is special personal information and needs
   explicit consent with a stated purpose. */
const EQUITY_FIELDS: FieldSpec<ProfileEquity>[] = [
  {
    id: "rightToWork",
    label: "Right to work in South Africa",
    options: [
      "South African citizen",
      "Permanent resident",
      "Valid work visa",
      "No, I would need sponsorship",
      "Prefer not to say",
    ],
  },
  {
    id: "populationGroup",
    label: "Population group",
    options: ["African", "Coloured", "Indian", "White", "Other", "Prefer not to say"],
  },
  { id: "gender", label: "Gender", options: ["Female", "Male", "Non-binary", "Prefer not to say"] },
  { id: "disability", label: "Do you have a disability?", options: ["Yes", "No", "Prefer not to say"] },
];

const EQUITY_SUB =
  "Optional. Collected for Employment Equity reporting only, and stored under POPIA. It is never used to screen applications.";

function EditableCard<T extends Record<string, string>>({
  heading,
  sectionId,
  sub,
  fields,
  value,
  onSave,
}: {
  heading: string;
  sectionId: string;
  sub?: string;
  fields: FieldSpec<T>[];
  value: T;
  onSave: (next: T) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<T>(value);

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  function save() {
    const trimmed = Object.fromEntries(
      fields.map((f) => [f.id, draft[f.id].trim()])
    ) as T;
    onSave(trimmed);
    setEditing(false);
  }

  return (
    <section className={styles.card} data-section={sectionId}>
      <div className={styles.cardHead}>
        <div>
          <h2 className={styles.cardH}>{heading}</h2>
          {sub && <p className={styles.cardSub}>{sub}</p>}
        </div>
        {!editing && (
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Edit ${heading.toLowerCase()}`}
            onClick={startEdit}
          >
            <PencilIcon />
          </button>
        )}
      </div>

      <div className={styles.fields}>
        {fields.map((f) => {
          const inputId = `pro-personal-${heading}-${f.id}`;
          if (!editing) {
            const v = value[f.id];
            return (
              <div className={styles.field} key={f.id}>
                <span className={styles.label}>{f.label}</span>
                <p className={`${styles.value} ${nonEmpty(v) ? "" : styles.valueEmpty}`}>
                  {nonEmpty(v) ? v : "—"}
                </p>
              </div>
            );
          }
          return (
            <div className={styles.field} key={f.id}>
              <label className={styles.label} htmlFor={inputId}>
                {f.label}
              </label>
              {f.options ? (
                <select
                  id={inputId}
                  className={styles.select}
                  value={draft[f.id]}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.id]: e.target.value }))}
                >
                  <option value="">—</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={inputId}
                  className={styles.input}
                  type={f.type ?? "text"}
                  value={draft[f.id]}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.id]: e.target.value }))}
                />
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <div className={styles.editActions}>
          <button type="button" className={styles.btnPrimary} onClick={save}>
            Save
          </button>
          <button type="button" className={styles.btnGhost} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}

export default function PersonalInfoTab({
  profile,
  onChange,
}: {
  profile: KzdProfile;
  onChange: (next: KzdProfile) => void;
}) {
  return (
    <div className={styles.tabBody}>
      <EditableCard
        heading="Personal details"
        sectionId="personal"
        fields={PERSONAL_FIELDS}
        value={profile.personal}
        onSave={(personal) => onChange({ ...profile, personal })}
      />
      <EditableCard
        heading="Equity information"
        sectionId="equity"
        sub={EQUITY_SUB}
        fields={EQUITY_FIELDS}
        value={profile.equity}
        onSave={(equity) => onChange({ ...profile, equity })}
      />
    </div>
  );
}

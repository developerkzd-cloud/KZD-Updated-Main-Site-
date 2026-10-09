"use client";

/* Edit dialog for the four portfolio/link fields. Ported from linksModal()
   in js/kzd-profile.js. All four are optional. */

import { useState, type FormEvent } from "react";
import type { ProfileLinks } from "@/lib/kzdStore";
import EditModal from "./EditModal";
import styles from "./profile.module.css";

const LINK_FIELDS: { id: keyof ProfileLinks; label: string }[] = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "github", label: "GitHub" },
  { id: "portfolio", label: "Portfolio" },
  { id: "other", label: "Other" },
];

export default function LinksModal({
  links,
  onSave,
  onClose,
}: {
  links: ProfileLinks;
  onSave: (links: ProfileLinks) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<ProfileLinks>(links);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = LINK_FIELDS.reduce(
      (acc, f) => ({ ...acc, [f.id]: values[f.id].trim() }),
      {} as ProfileLinks
    );
    onSave(trimmed);
    onClose();
  }

  return (
    <EditModal title="Portfolio and links" subtitle="Leave any of them blank." onClose={onClose}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        {LINK_FIELDS.map((f) => {
          const inputId = `pro-link-${f.id}`;
          return (
            <div className={styles.field} key={f.id}>
              <label className={styles.label} htmlFor={inputId}>
                {f.label}
              </label>
              <input
                id={inputId}
                className={styles.input}
                type="text"
                value={values[f.id]}
                onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
              />
            </div>
          );
        })}
        <div className={styles.modalActions}>
          <button type="submit" className={styles.btnPrimary}>
            Save
          </button>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </EditModal>
  );
}

"use client";

/* Add/edit dialog for a single work experience, education or project entry.
   Generic over the entry shape so the same component serves all three lists
   — ported from entryModal() in js/kzd-profile.js, which built the same form
   from a per-type field spec. */

import { useState, type FormEvent } from "react";
import EditModal from "./EditModal";
import styles from "./profile.module.css";

export interface EntryFieldSpec<T> {
  id: keyof T & string;
  label: string;
  required?: boolean;
}

export interface EntryTypeSpec<T> {
  title: string;
  fields: EntryFieldSpec<T>[];
  line1: (e: T) => string;
  line2: (e: T) => string;
  line3: (e: T) => string;
}

export default function EntryModal<T extends Record<string, string>>({
  spec,
  initial,
  onSave,
  onClose,
}: {
  spec: EntryTypeSpec<T>;
  /** null means "adding a new entry"; otherwise the entry being edited. */
  initial: T | null;
  onSave: (entry: T) => void;
  onClose: () => void;
}) {
  const blank = Object.fromEntries(spec.fields.map((f) => [f.id, ""])) as T;
  const [values, setValues] = useState<T>(initial ?? blank);
  const [errors, setErrors] = useState<Partial<Record<keyof T & string, string>>>({});
  const verb = initial ? "Edit" : "Add";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof T & string, string>> = {};
    spec.fields.forEach((f) => {
      if (f.required && !values[f.id].trim()) {
        nextErrors[f.id] = `${f.label} is required.`;
      }
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const trimmed = Object.fromEntries(
      spec.fields.map((f) => [f.id, values[f.id].trim()])
    ) as T;
    onSave(trimmed);
    onClose();
  }

  return (
    <EditModal title={`${verb} ${spec.title}`} onClose={onClose}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        {spec.fields.map((f) => {
          const inputId = `pro-entry-${f.id}`;
          const errorId = `${inputId}-error`;
          return (
            <div className={styles.field} key={f.id}>
              <label className={styles.label} htmlFor={inputId}>
                {f.label}
                {f.required && (
                  <span className={styles.req} aria-hidden="true">
                    *
                  </span>
                )}
              </label>
              <input
                id={inputId}
                className={styles.input}
                type="text"
                value={values[f.id]}
                aria-describedby={errorId}
                aria-invalid={errors[f.id] ? "true" : "false"}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.id]: e.target.value }) as T)
                }
              />
              <p className={styles.fieldError} id={errorId} role="alert">
                {errors[f.id] ?? ""}
              </p>
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

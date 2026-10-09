"use client";

/* Add/remove dialog for the skills and languages chip lists. Ported from
   chipModal() in js/kzd-profile.js: type a value, press Enter to add it,
   click a chip's x to remove it. Changes are saved as they happen rather
   than batched behind the Save button, matching the original. */

import { useState, type KeyboardEvent } from "react";
import EditModal from "./EditModal";
import { XIcon } from "./icons";
import styles from "./profile.module.css";

export default function ChipModal({
  heading,
  addLabel,
  items,
  onChange,
  onClose,
}: {
  heading: string;
  addLabel: string;
  items: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v || items.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...items, v]);
    setDraft("");
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    add();
  }

  return (
    <EditModal title={addLabel} subtitle="Press Enter to add each one." onClose={onClose}>
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="pro-chip-input">
            {heading}
          </label>
          <input
            id="pro-chip-input"
            className={styles.input}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        {items.length > 0 && (
          <ul className={styles.chips}>
            {items.map((name, i) => (
              <li className={styles.chip} key={name}>
                {name}
                <button
                  type="button"
                  className={styles.chipX}
                  aria-label={`Remove ${name}`}
                  onClick={() => remove(i)}
                >
                  <XIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnPrimary} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </EditModal>
  );
}

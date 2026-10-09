"use client";

/* ==========================================================================
   A small, reusable modal shell for the profile page's edit-in-a-dialog
   flows (work experience / education / projects entries, portfolio links,
   skills and languages chips, and the read-only documents notice).

   Ported from the modal() helper in js/kzd-profile.js, which itself reused
   the auth modal's chrome so every dialog in the app reads as one system.
   Behaviour kept: focus moves into the dialog on open, Tab is trapped inside
   it, Escape and a backdrop click both close it, and focus returns to
   whatever opened it on close.
   ========================================================================== */

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./profile.module.css";
import Icon from "@/components/Icon/Icon";

export default function EditModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function focusables(): HTMLElement[] {
      if (!dialog) return [];
      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((n) => n.offsetWidth > 0 || n.offsetHeight > 0);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;
      if (!dialog?.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const f = focusables();
    if (f.length) f[0].focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div
      className={styles.scrim}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <button type="button" className={styles.modalClose} aria-label="Close" onClick={onClose}>
          <Icon name="x-lg" />
        </button>
        <h2 className={styles.modalTitle} id={titleId}>
          {title}
        </h2>
        {subtitle && <p className={styles.modalSub}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

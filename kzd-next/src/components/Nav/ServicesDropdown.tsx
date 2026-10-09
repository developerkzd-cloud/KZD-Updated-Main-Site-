"use client";

/* ==========================================================================
   The Services mega panel — the ONLY interactive part of the desktop nav.

   Everything else in Nav.tsx stays a Server Component; this is the client
   boundary and it wraps one <li>. Opening on hover matches a pointer user's
   expectation, and opening on focus matches a keyboard user's, so both are
   wired rather than picking one.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/nav";
import styles from "./Nav.module.css";
import Icon from "@/components/Icon/Icon";

export default function ServicesDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const itemRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  /* Escape returns focus to the trigger, and the trigger opens on focus. Without
     this flag those two fight and the panel reopens the instant it closes. */
  const suppressFocusOpen = useRef(false);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        suppressFocusOpen.current = true;
        triggerRef.current?.focus();
      }
    }
    function onPointer(e: MouseEvent) {
      if (!itemRef.current?.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <li
      ref={itemRef}
      className={styles.item}
      data-open={open}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      /* Tabbing out of the whole item closes it. */
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => {
          if (suppressFocusOpen.current) { suppressFocusOpen.current = false; return; }
          setOpen(true);
        }}
      >
        {item.label}
        <Icon className={styles.caret} name="chevron-down" size="dense" />
      </button>

      <ul className={styles.mega}>
        {item.groups?.map((group) => (
          <li className={styles.megaGroup} key={group.heading}>
            <p className={styles.megaHead}>{group.heading}</p>
            <ul>
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link className={styles.megaLink} href={link.href} onClick={() => setOpen(false)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </li>
  );
}

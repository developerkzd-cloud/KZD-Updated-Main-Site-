"use client";

/* ==========================================================================
   The Services dropdown — six individual services plus a feature column,
   confirmed against Penpot's "Nav — Services dropdown (desktop)" board
   (Item 01-06, with a "Soon" marker on exactly 03/05/06 — AI Builder,
   Telecommunications, Accounting & Business Compliance).

   Behaviour, all from the brief:
     - opens on hover OR keyboard focus, with a 150ms hover-intent delay so
       a pointer passing over it doesn't flicker it open
     - fade + 8px rise, 220ms (css) — reduced-motion kills this globally via
       the shared token file's transition-duration override, so no separate
       check is needed here
     - the page behind dims 35% (the .scrim)
     - chevron rotates 180deg while open (css, driven by aria-expanded)
     - closes on Escape, outside click, or the pointer leaving
     - "Services" itself is a real link to /services; the chevron is a
       separate button that only toggles the panel (so touch can open it
       without navigating away)

   Layout and copy match the dropdown's Penpot screenshot: dark feature card
   on the left, a 2x3 grid of numbered services, a notch pointing at
   "Services".
   ========================================================================== */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import Button from "@/components/Button/Button";
import { SERVICES, serviceHref } from "@/lib/services";
import styles from "./Nav.module.css";

const HOVER_INTENT_MS = 150;

export default function ServicesDropdown() {
  const [open, setOpen] = useState(false);
  const current = usePathname().startsWith("/services");
  const itemRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const caretRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Escape returns focus to the trigger, and the trigger opens on focus.
     Without this flag those two fight and the panel reopens the instant it
     closes. */
  const suppressFocusOpen = useRef(false);

  const clearTimer = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }, []);

  const openWithIntent = useCallback(() => {
    clearTimer();
    openTimer.current = setTimeout(() => setOpen(true), HOVER_INTENT_MS);
  }, [clearTimer]);

  const closeNow = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeNow();
        suppressFocusOpen.current = true;
        (caretRef.current ?? triggerRef.current)?.focus();
      }
    }
    function onPointer(e: MouseEvent) {
      if (!itemRef.current?.contains(e.target as Node)) closeNow();
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, closeNow]);

  useEffect(() => clearTimer, [clearTimer]);

  /* The panel is centred on the page, not on the trigger, so the notch has
     to be told where "Services" sits within it. */
  useLayoutEffect(() => {
    if (!open) return;
    function placeNotch() {
      const panel = panelRef.current;
      const trigger = triggerRef.current;
      if (!panel || !trigger) return;
      const t = trigger.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      panel.style.setProperty("--notch-x", `${t.left + t.width / 2 - p.left}px`);
    }
    placeNotch();
    window.addEventListener("resize", placeNotch);
    return () => window.removeEventListener("resize", placeNotch);
  }, [open]);

  return (
    <li
      ref={itemRef}
      className={`${styles.item} ${styles.servicesItem}`}
      data-open={open}
      onMouseEnter={openWithIntent}
      onMouseLeave={closeNow}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) closeNow();
      }}
    >
      <Link
        ref={triggerRef}
        href="/services"
        className={styles.trigger}
        aria-current={current ? "page" : undefined}
        onFocus={() => {
          if (suppressFocusOpen.current) {
            suppressFocusOpen.current = false;
            return;
          }
          setOpen(true);
        }}
      >
        Services
      </Link>
      <button
        ref={caretRef}
        type="button"
        className={styles.caretBtn}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="kzd-services-panel"
        aria-label={open ? "Close services menu" : "Open services menu"}
        onClick={() => (open ? closeNow() : setOpen(true))}
      >
        <Icon className={styles.caret} name="chevron-down" size="dense" />
      </button>

      <div
        className={`${styles.scrim} ${open ? styles.scrimOpen : ""}`}
        aria-hidden="true"
        onClick={closeNow}
      />

      <div id="kzd-services-panel" ref={panelRef} className={styles.mega}>
        <div className={styles.featureCol}>
          <p className={styles.featureEyebrow}>Our services</p>
          <p className={styles.featureTitle}>Everything under one roof.</p>
          <p className={styles.featureBody}>
            Websites, software, support and more, built and run by one Durban team.
          </p>
          <Button variant="light" href="/services" icon="right" className={styles.viewAll} onClick={closeNow}>
            View all
          </Button>
        </div>

        <ul className={styles.itemList}>
          {SERVICES.map((s, i) => (
            <li key={s.slug}>
              <Link className={styles.megaLink} href={serviceHref(s)} onClick={closeNow}>
                <span className={styles.megaLinkNum}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.megaLinkName}>{s.name}</span>
                <span className={styles.megaLinkDesc}>{s.description}</span>
                {s.comingSoon && <span className={styles.soon}>Soon</span>}
                <span className={styles.arrowDisc} aria-hidden="true">
                  <Icon name="arrow-up-right" size="dense" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

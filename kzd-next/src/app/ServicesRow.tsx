"use client";

/* ==========================================================================
   ServicesRow — the homepage service cards and their prev/next arrows.

   Ported from js/kzd-services.js. The row is a plain horizontally
   scrollable strip; the arrows advance it by exactly one card plus one gap,
   read off the live layout rather than hardcoded, so a card-width change
   cannot desync them.

   The arrows disable rather than sit dead: with three cards and three
   visible there is nothing to advance to, so they only come alive once the
   row actually overflows (mobile, or a narrow window). That is the legacy
   syncArrows() behaviour, kept because a live-looking control that does
   nothing is worse than a visibly disabled one.

   Cards arrive as `children` so they stay server-rendered — only the
   scrolling is client-side.
   ========================================================================== */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./page.module.css";

export default function ServicesRow({ children }: { children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const max = row.scrollWidth - row.clientWidth;
    const overflowing = max > 2;
    setAtStart(!overflowing || row.scrollLeft <= 2);
    setAtEnd(!overflowing || row.scrollLeft >= max - 2);
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const frame = requestAnimationFrame(sync);
    row.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    /* Fonts landing changes card widths, so re-check once they are ready. */
    document.fonts?.ready.then(sync).catch(() => {});

    return () => {
      cancelAnimationFrame(frame);
      row.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  /** One card plus one gap — how far a single advance moves the track. */
  function advance(dir: 1 | -1) {
    const row = rowRef.current;
    if (!row) return;
    const first = row.firstElementChild;
    if (!first) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 24;
    const step = first.getBoundingClientRect().width + gap;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: dir * step, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <>
      <div className={styles.servicesRow} ref={rowRef} tabIndex={0} role="group" aria-label="Services">
        {children}
      </div>

      <div className={styles.servicesNav}>
        <button
          type="button"
          className={styles.servicesArrow}
          aria-label="Previous service"
          disabled={atStart}
          onClick={() => advance(-1)}
        >
          <svg viewBox="0 0 18 18" focusable="false" aria-hidden="true">
            <path d="M11.5 3.5 L5.5 9 l6 5.5" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.servicesArrow}
          aria-label="Next service"
          disabled={atEnd}
          onClick={() => advance(1)}
        >
          <svg viewBox="0 0 18 18" focusable="false" aria-hidden="true">
            <path d="M6.5 3.5 L12.5 9 l-6 5.5" />
          </svg>
        </button>
      </div>
    </>
  );
}

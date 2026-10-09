"use client";

/* ==========================================================================
   AboutStatBar — the homepage About section's two progress bars (Business
   Growth 98%, New Technology 85%). Starts at 0 width and grows to `pct`
   once scrolled into view, mirroring the legacy site's stat-bar reveal
   (index.html's kzd-about__bar, driven by js/kzd-about.js).
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

export default function AboutStatBar({ pct }: { pct: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setGrown(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.aboutTrack} aria-hidden="true" ref={ref}>
      <span className={styles.aboutBar} style={{ width: grown ? `${pct}%` : 0 }} />
    </div>
  );
}

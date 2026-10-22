"use client";

/* ==========================================================================
   ServicesTabs — "Our services" on /services.

   A real tablist: arrow keys (and Home/End) move between tabs, roving
   tabindex, aria-selected / aria-controls. Desktop: tabs stagger in from the
   left, the detail card slides in from the right; hovering a tab nudges it
   4px; the active tab turns #1A1A1A with white text and its shadow fades in.
   Switching cross-fades the content out (150ms) then in (250ms) with the rows
   rising 12px, 40ms apart, while the card's height animates so the page
   below doesn't jump. Mobile: the tabs are a horizontal scroll-snap pill row
   and the tapped pill scrolls itself into view.
   /services#consulting etc. opens straight on that tab.
   ========================================================================== */

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Reveal from "@/components/Reveal/Reveal";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import type { ServiceTab } from "./content";
import styles from "./services.module.css";

const OUT_MS = 150;

export default function ServicesTabs({ tabs, initial = 1 }: { tabs: ServiceTab[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  const [shown, setShown] = useState(initial);
  const [leaving, setLeaving] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const select = (i: number, focus = false) => {
    if (focus) tabRefs.current[i]?.focus();
    tabRefs.current[i]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    if (i === active) return;
    setActive(i);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (timer.current) clearTimeout(timer.current);
    if (reduced) {
      setShown(i);
      return;
    }
    setLeaving(true);
    timer.current = setTimeout(() => {
      setShown(i);
      setLeaving(false);
    }, OUT_MS);
  };

  /* Deep links from the nav/footer (#consulting, #development, …). */
  useEffect(() => {
    let frame = 0;
    const fromHash = () => {
      const i = tabs.findIndex((t) => t.id === window.location.hash.slice(1));
      if (i < 0) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setActive(i);
        setShown(i);
      });
    };
    fromHash();
    /* Same-page links (e.g. /services#ai-builder clicked while already here)
       change only the hash, without remounting. */
    window.addEventListener("hashchange", fromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [tabs]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /* Animate the card to its content's height, so nothing below jumps. */
  useLayoutEffect(() => {
    const card = cardRef.current;
    const content = contentRef.current;
    if (!card || !content) return;
    const fit = () => {
      card.style.height = `${content.offsetHeight}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(content);
    return () => ro.disconnect();
    /* The content node remounts per tab (key), so re-observe on change. */
  }, [shown]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = tabs.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: active === last ? 0 : active + 1,
      ArrowRight: active === last ? 0 : active + 1,
      ArrowUp: active === 0 ? last : active - 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    select(moves[e.key], true);
  };

  const tab = tabs[shown];

  return (
    <div className={styles.tabs}>
      <div className={styles.tabList} role="tablist" aria-label="Our services" onKeyDown={onKeyDown}>
        {tabs.map((t, i) => (
          <Reveal key={t.id} from="left" style={{ "--d": i } as CSSProperties} className={styles.tabReveal}>
            <button
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`svc-tab-${t.id}`}
              aria-selected={i === active}
              aria-controls="svc-tabpanel"
              tabIndex={i === active ? 0 : -1}
              className={styles.tab}
              onClick={() => select(i)}
            >
              <span className={styles.tabNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.tabName}>{t.name}</span>
              <span className={styles.tabTagline}>{t.tagline}</span>
            </button>
          </Reveal>
        ))}
      </div>

      <Reveal from="right" style={{ "--d": 1 } as CSSProperties} className={styles.panelReveal}>
        <div
          ref={cardRef}
          className={styles.panel}
          role="tabpanel"
          id="svc-tabpanel"
          aria-labelledby={`svc-tab-${tabs[active].id}`}
          tabIndex={0}
        >
          <div ref={contentRef} key={tab.id} className={`${styles.panelContent} ${leaving ? styles.leaving : ""}`}>
            <h3 className={styles.panelTitle}>{tab.name}</h3>
            <p className={styles.panelIntro}>{tab.intro}</p>
            <ul className={styles.rows}>
              {tab.rows.map((row, i) => (
                <li key={row.label} style={{ "--i": i } as CSSProperties}>
                  <Link className={styles.row} href={row.href}>
                    <span className={styles.rowNum}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.rowLabel}>{row.label}</span>
                    <ArrowIcon className={styles.rowArrow} />
                  </Link>
                </li>
              ))}
            </ul>
            <Link className={styles.cta} href={tab.cta.href}>
              {tab.cta.label}
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

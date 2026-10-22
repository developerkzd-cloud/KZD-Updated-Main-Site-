"use client";

/* ==========================================================================
   ChipString — the thin cord the R1M card hangs from, tied to the bottom of
   the yellow "About us" badge. Written to take more cords (CORDS) if another
   card is ever tethered.

   Both ends of each cord are measured from the live layout every frame (the
   cards and the badge float on CSS animations), and each cord is a
   quadratic curve whose sag breathes and sways on its own slow phase, so it
   reads as a real string flexing with its card. Runs only while the panel
   is on screen; under reduced motion the cords are drawn once and left still.
   ========================================================================== */

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

/* The pill inside the badge artwork (viewBox 0 0 400 192: rect x 50..400,
   y 62..162), as fractions of the badge box. */
const PILL_TOP = 62 / 192;
const PILL_BOTTOM = 162 / 192;
const PILL_LEFT = 70 / 400;
const PILL_RIGHT = 380 / 400;

type Cord = {
  /** data-string-to value on the card. */
  to: string;
  /** Which pill edge the cord leaves from, and which card edge it reaches. */
  edge: "top" | "bottom";
  /** Gravity sag as a share of the cord's length (a hanging cord sags more
      than a taut tether). */
  sag: number;
  sway: number;
  phase: number;
};

const CORDS: Cord[] = [
  { to: "cost", edge: "bottom", sag: 0.14, sway: 10, phase: 0 },
];

export default function ChipString() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const pinRefs = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    const panel = svg?.parentElement;
    const badge = panel?.querySelector<HTMLElement>("[data-string-from]");
    if (!svg || !panel || !badge) return;
    const cards = CORDS.map((c) => panel.querySelector<HTMLElement>(`[data-string-to="${c.to}"]`));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let running = false;

    const draw = (now: number) => {
      const p = panel.getBoundingClientRect();
      if (!p.width) return;
      const b = badge.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${p.width} ${p.height}`);
      const t = reduced ? 0 : now / 1000;

      CORDS.forEach((cord, i) => {
        const card = cards[i];
        if (!card) return;
        const c = card.getBoundingClientRect();

        // Card end: the eyelet, centred on the card edge facing the badge.
        const ex = c.left + c.width / 2 - p.left;
        const ey = cord.edge === "bottom" ? c.top - p.top + 2 : c.bottom - p.top - 2;

        // Badge end: on the pill edge, directly under/over the card where
        // possible, kept within the pill's straight run.
        const minX = b.left - p.left + b.width * PILL_LEFT;
        const maxX = b.left - p.left + b.width * PILL_RIGHT;
        const sx = Math.min(Math.max(ex, minX), maxX);
        const sy =
          cord.edge === "bottom"
            ? b.top - p.top + b.height * PILL_BOTTOM - 4
            : b.top - p.top + b.height * PILL_TOP + 4;

        const length = Math.hypot(ex - sx, ey - sy);
        const breathe = Math.sin(t * 1.1 + cord.phase);
        const drift = Math.sin(t * 0.7 + cord.phase * 1.3);
        const cx = (sx + ex) / 2 + drift * cord.sway;
        const cy = (sy + ey) / 2 + length * cord.sag + breathe * 4;

        pathRefs.current[i]?.setAttribute(
          "d",
          `M${sx.toFixed(1)},${sy.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`
        );
        pinRefs.current[i]?.setAttribute("cx", sx.toFixed(1));
        pinRefs.current[i]?.setAttribute("cy", sy.toFixed(1));
      });
    };

    const loop = (now: number) => {
      draw(now);
      if (running) frame = requestAnimationFrame(loop);
    };

    draw(performance.now());
    if (reduced) {
      const ro = new ResizeObserver(() => draw(0));
      ro.observe(panel);
      return () => ro.disconnect();
    }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        frame = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting) {
        running = false;
        cancelAnimationFrame(frame);
      }
    });
    io.observe(panel);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, []);

  return (
    <svg ref={svgRef} className={styles.chipString} aria-hidden="true" focusable="false">
      {CORDS.map((cord, i) => (
        <g key={cord.to}>
          <path
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            className={styles.chipStringCord}
          />
          <circle
            ref={(el) => {
              pinRefs.current[i] = el;
            }}
            className={styles.chipStringPin}
            r="3.5"
          />
        </g>
      ))}
    </svg>
  );
}

"use client";

/* ==========================================================================
   CountUp — animates a number up to `to` once it scrolls into view.

   Used by the homepage About section (98% Business Growth, 85% New
   Technology, 1400+ Days of experience, etc.), replacing the legacy site's
   data-count-to / data-odo counters with the same IntersectionObserver
   technique Reveal already uses.

   The rendered value STARTS at `to`, not at 0. Counting up from a 0 initial
   state would put "0" in the server HTML, which is what a crawler — and
   anyone without JS — would read as the actual figure. So the real number
   ships in the markup, and the count is an enhancement the client layers on
   when the element is about to come into view.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1200;

export default function CountUp({
  to,
  prefix = "",
  suffix = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();

          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / DURATION_MS);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(to * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
          break;
        }
      },
      /* Deliberately high: the run should start as the figure comes into
         view, not after it has been sitting on screen already showing the
         final number. */
      { threshold: 0.9 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

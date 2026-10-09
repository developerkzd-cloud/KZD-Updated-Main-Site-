"use client";

/* ==========================================================================
   BrandReveal — the brand block that closes the About section (the KZD
   plate and the founder quote).

   Ported from brandReveal() in js/kzd-about.js. This one is scroll-LINKED,
   not a play-once reveal: the block's position tracks scroll progress
   through a band, so it rises out from behind the mask's top edge as you
   come down the page and follows you back if you scroll up. Reveal cannot
   express that — it is a one-way on/off — which is why this is its own
   component.

   The mask genuinely clips (overflow: hidden) rather than just fading, so
   at progress 0 the block sits translated above the mask's top edge and is
   actually hidden, not merely transparent.

   Cost control, kept from the original: scroll and resize are passive and
   only raise a dirty flag; all measurement and writing happen in one rAF
   callback, with a single getBoundingClientRect per frame. The compositor
   hint is set only while the block is actually moving.

   Travel and starting opacity come from --kzd-brand-travel / --kzd-brand-
   fade so the breakpoints stay in CSS, exactly as the legacy did — the
   script reads them on init and again on resize.

   Resting state is the FINAL state: with no JS, blocked JS, or reduced
   motion, the block renders in place. The effect pulls it back on its first
   frame.
   ========================================================================== */

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./page.module.css";

/* Defaults, overridden by the CSS tokens when present. */
const TRAVEL = -68; /* percent of the block's own height */
const FADE = 0.3;

export default function BrandReveal({ children }: { children: ReactNode }) {
  const maskRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mask = maskRef.current;
    const brand = brandRef.current;
    if (!mask || !brand) return;

    /* No listeners, no rAF loop, no clip. The resting state is already the
       final state, so there is nothing to render. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let travel = TRAVEL;
    let fade = FADE;
    let ticking = false;
    let hinted = false;
    let lastP = -1;

    function readTokens() {
      if (!mask) return;
      const cs = getComputedStyle(mask);
      const t = parseFloat(cs.getPropertyValue("--kzd-brand-travel"));
      const f = parseFloat(cs.getPropertyValue("--kzd-brand-fade"));
      if (!Number.isNaN(t)) travel = t;
      if (!Number.isNaN(f)) fade = f;
    }

    function apply() {
      ticking = false;
      if (!mask || !brand) return;

      const rect = mask.getBoundingClientRect(); /* the only layout read */
      const vh = window.innerHeight;

      const start = vh * 0.88;
      const end = vh * 0.52;
      const raw = (start - rect.top) / (start - end);
      let p = Math.min(1, Math.max(0, raw));

      /* Snap the ends. Floating point leaves p at 0.99999998 at the top of
         the band, which would keep the block flagged "moving" forever and
         never let the compositor hint be released. */
      if (p > 0.999) p = 1;
      else if (p < 0.001) p = 0;

      if (p === lastP) return;
      lastP = p;

      const e = 1 - Math.pow(1 - p, 3); /* easeOutCubic */

      const moving = p > 0 && p < 1;
      if (moving && !hinted) {
        brand.style.willChange = "transform, opacity";
        hinted = true;
      } else if (!moving && hinted) {
        brand.style.willChange = "auto";
        hinted = false;
      }

      brand.style.transform = `translate3d(0, ${travel * (1 - e)}%, 0)`;
      brand.style.opacity = String(fade + (1 - fade) * e);
    }

    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }

    function onResize() {
      readTokens();
      lastP = -1; /* the breakpoint may have changed travel/fade */
      request();
    }

    readTokens();
    request();

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className={styles.aboutBrandMask} ref={maskRef}>
      <div className={styles.aboutBrand} ref={brandRef}>
        {children}
      </div>
    </div>
  );
}

/* ==========================================================================
   Reveal — fade/rise an element in once it scrolls into view.

   Replaces two things the static site pulled in separately for the same
   effect: the AOS CDN library (hosting/cloud/wordpress/vps-hosting/domain
   pages) and the hand-rolled IntersectionObserver over .chp-animate
   elements (hosting.html, domains.js).

   This is plain markup, not a client component: it renders the element with
   `data-reveal`, and the single RevealObserver mounted in the root layout
   flips `data-revealed` to "true" when it comes into view. One observer for
   the whole page instead of a hydrated component per element keeps dozens
   of client boundaries (and their hydration work) out of every page load.

   `as` picks the rendered tag (default "div"). It exists because some call
   sites need a real <li> (e.g. a card inside a <ul> — a <div> there would be
   invalid HTML) rather than an extra wrapping <div>.
   ========================================================================== */

import type { CSSProperties, ReactNode } from "react";
import styles from "./Reveal.module.css";

type Tag = "div" | "li" | "section" | "article";

export default function Reveal({
  children,
  className = "",
  as: Tag = "div",
  style,
  from = "below",
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  /** Pass `{ "--d": i }` to stagger siblings --reveal-stagger apart (see
      Reveal.module.css's `transition-delay`). */
  style?: CSSProperties;
  /** Direction it travels in from. */
  from?: "below" | "left" | "right";
}) {
  return (
    <Tag
      className={`${styles.reveal} ${className}`}
      style={style}
      data-reveal=""
      data-from={from === "below" ? undefined : from}
      // Plain, unscoped attribute so a page's own CSS can trigger a nested
      // animation (e.g. an SVG icon's stroke-dashoffset draw-in) off the same
      // moment, via `[data-revealed="true"] .whatever { ... }`.
      data-revealed="false"
    >
      {children}
    </Tag>
  );
}

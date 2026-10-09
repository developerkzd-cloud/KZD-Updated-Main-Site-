"use client";

/* ==========================================================================
   Reveal — fade/rise an element in once it scrolls into view.

   Replaces two things the static site pulled in separately for the same
   effect: the AOS CDN library (hosting/cloud/wordpress/vps-hosting/domain
   pages) and the hand-rolled IntersectionObserver over .chp-animate
   elements (hosting.html, domains.js). One small client component instead
   of a third-party script tag.

   `as` picks the rendered tag (default "div"). It exists because some call
   sites need a real <li> (e.g. a card inside a <ul> — a <div> there would be
   invalid HTML) rather than an extra wrapping <div>. A callback ref is used
   instead of useRef<T> so the single JSX expression below type-checks for
   every tag in Tag without a generic ref cast.
   ========================================================================== */

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Reveal.module.css";

type Tag = "div" | "li" | "section" | "article";

export default function Reveal({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
}) {
  const elRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        elRef.current = node;
      }}
      className={`${styles.reveal} ${visible ? styles.visible : ""} ${className}`}
      // Plain, unscoped attribute (unlike the CSS-Module-hashed `visible`
      // class above) so a page's own CSS can trigger a nested animation —
      // e.g. an SVG icon's stroke-dashoffset draw-in — off the same moment,
      // via `[data-revealed="true"] .whatever { ... }`.
      data-revealed={visible}
    >
      {children}
    </Tag>
  );
}

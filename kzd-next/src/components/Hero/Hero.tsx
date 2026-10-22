/* ==========================================================================
   Hero — full-bleed photo with the black gradient overlay, and a content
   slot on top.

   The overlay recipe (--hero-overlay) is read exactly off
   Homepage — Revamped > Hero > Overlay: linear, top to bottom, black at
   82% / 64% / 36% opacity at 0% / 50% / 100%.

   Scope is deliberately narrow — image, overlay, content container — not
   the page nav. The confirmed Hero board does carry its own Nav as a child
   (for a transparent-over-the-photo look), but that's a page-composition
   decision for whichever page uses this Hero, made when the shared Nav
   (Prompt 2) is wired up against it, not something this primitive decides.

   fullHeight honours the add-on's "fit the screen" rule: on, the hero fills
   the viewport (100svh, 100vh fallback); off, it keeps a fixed height, e.g.
   for a shorter secondary-page hero.
   ========================================================================== */

import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./Hero.module.css";

export default function Hero({
  src,
  alt,
  priority = true,
  fullHeight = true,
  minHeight,
  children,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  fullHeight?: boolean;
  /** Fixed height to use instead of fullHeight, e.g. "560px" for a secondary page. */
  minHeight?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[styles.hero, fullHeight && styles.fullHeight, className].filter(Boolean).join(" ")}
      style={minHeight ? { minHeight } : undefined}
    >
      <Image src={src} alt={alt} fill priority={priority} sizes="100vw" className={styles.image} />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

/* ==========================================================================
   SectionContainer — the shared content wrap + optional full-viewport fit.

   Wrap: max-width 1216px with a 112px gutter at 1440, confirmed on
   Homepage — Revamped > About (its content row sits inset 112px from each
   edge of the 1440 board: 112 + 1216 + 112 = 1440). The gutter narrows on
   smaller screens via clamp(); the mobile-width end of that clamp is a
   reasoned default, not yet checked against the 390-wide mobile boards.

   fullHeight: the add-on rule that every major section fit inside one
   screen on desktop. Pass `fullHeight` to get min-height: 100svh (100vh
   fallback) with its content vertically centred; omit it for sections that
   are allowed to be shorter than the viewport (e.g. the footer).
   ========================================================================== */

import type { ElementType, HTMLAttributes, ReactNode } from "react";
import styles from "./SectionContainer.module.css";

export default function SectionContainer({
  as: Tag = "section",
  fullHeight = false,
  children,
  className,
  ...rest
}: {
  as?: ElementType;
  fullHeight?: boolean;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={[styles.section, fullHeight && styles.fullHeight, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <div className={styles.inner}>{children}</div>
    </Tag>
  );
}

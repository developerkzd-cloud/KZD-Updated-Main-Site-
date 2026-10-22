/* ==========================================================================
   Eyebrow — the small uppercase section label.

   JetBrains Mono, wide tracking, plain text — never a dot-plus-label pill.
   Confirmed on About > Eyebrow ("ABOUT US"): --text-eyebrow-* in tokens.css.

   Two confirmed layouts, both from Penpot:
     - plain (default): just the label, left-aligned next to a headline
       (About section).
     - withRules: a hairline rule on each side, confirmed structurally on the
       Coming Soon boards (Eyebrow / "Eyebrow rule L" / "Eyebrow rule R" as
       siblings) — the centred "luxury" treatment for a page that opens on
       this label rather than leading into a headline below it.
   ========================================================================== */

import styles from "./Eyebrow.module.css";

export default function Eyebrow({
  children,
  withRules = false,
  className,
}: {
  children: string;
  withRules?: boolean;
  className?: string;
}) {
  if (!withRules) {
    return <p className={[styles.label, className].filter(Boolean).join(" ")}>{children}</p>;
  }
  return (
    <div className={[styles.withRules, className].filter(Boolean).join(" ")}>
      <span className={styles.rule} aria-hidden="true" />
      <p className={styles.label}>{children}</p>
      <span className={styles.rule} aria-hidden="true" />
    </div>
  );
}

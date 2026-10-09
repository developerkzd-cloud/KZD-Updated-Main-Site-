/* ==========================================================================
   Icon — the one icon family (Bootstrap Icons, outline variants), inline.

   Sizes come from the design system: 24 default, 20 dense, 40 feature,
   48 hero (the .kzd-icon classes in css/kzd-tokens.css). Always decorative
   here: the control around it carries the accessible name.
   ========================================================================== */

import { GLYPHS, type Glyph, type IconName } from "./glyphs";

type Size = "default" | "dense" | "feature" | "hero";

export default function Icon({
  name,
  size = "default",
  className,
}: {
  name: IconName;
  size?: Size;
  className?: string;
}) {
  const classes = ["kzd-icon", size !== "default" && `kzd-icon--${size}`, className].filter(Boolean).join(" ");
  return (
    <svg className={classes} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {(GLYPHS[name] as Glyph).map((p) => (
        <path key={p.d} d={p.d} fillRule={p.fillRule} />
      ))}
    </svg>
  );
}

export type { IconName };

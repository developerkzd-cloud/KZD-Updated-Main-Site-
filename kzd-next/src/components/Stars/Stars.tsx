/* ==========================================================================
   Stars — the gold rating stars.

   Confirmed on Homepage — Revamped > About > ChipGrowth: five literal "★"
   glyphs set in Inter, not SVG icons — reproduced exactly rather than
   substituted with an icon font. Gold colour --color-gold (#F5B301),
   confirmed in the same place.

   `rating` supports a partial count (e.g. individual testimonial reviews),
   rendering the remainder in --color-border rather than assuming every
   instance is a full five — the one confirmed example (the Google rating
   chip) happens to show all five filled, so that's this component's default.
   ========================================================================== */

import styles from "./Stars.module.css";

export default function Stars({
  rating = 5,
  max = 5,
  className,
}: {
  rating?: number;
  max?: number;
  className?: string;
}) {
  const filled = Math.max(0, Math.min(max, Math.round(rating)));
  return (
    <span
      className={[styles.stars, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={`Rated ${rating} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={i} aria-hidden="true" className={i < filled ? styles.filled : styles.empty}>
          ★
        </span>
      ))}
    </span>
  );
}

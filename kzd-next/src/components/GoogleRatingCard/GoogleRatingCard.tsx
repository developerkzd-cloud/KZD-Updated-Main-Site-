/* ==========================================================================
   GoogleRatingCard — the floating "4.9 / GOOGLE RATING" chip.

   Confirmed in full on Homepage — Revamped > About > ChipGrowth: white card,
   radius 16, --shadow-card-light, a 44px stat number, the gold Stars row,
   and a JetBrains Mono micro-label underneath.

   Presentational only — rating/count are props rather than hardcoded, so
   the real, current number lives in one place (whichever page renders it)
   and this component is never what would need editing if it changes.
   ========================================================================== */

import Stars from "@/components/Stars/Stars";
import styles from "./GoogleRatingCard.module.css";

export default function GoogleRatingCard({
  rating,
  label = "GOOGLE RATING",
  className,
}: {
  rating: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(" ")}>
      <p className={styles.value}>{rating.toFixed(1)}</p>
      <p className={styles.label}>{label}</p>
      <Stars rating={rating} />
    </div>
  );
}

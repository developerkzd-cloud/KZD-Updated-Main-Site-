"use client";

/* ==========================================================================
   TestimonialsCarousel — the homepage review cards on the shared
   SnapCarousel rail (swipe, drag, keys, arrows on desktop, centred dots).
   Long quotes clamp to five lines with a "Read more" toggle on desktop;
   mobile keeps the clamp only, as in the Penpot mobile frame.
   ========================================================================== */

import { useState } from "react";
import SnapCarousel from "@/components/SnapCarousel/SnapCarousel";
import Stars from "@/components/Stars/Stars";
import type { Review } from "@/lib/content";
import styles from "./TestimonialsCarousel.module.css";

const AVATAR_TONES = ["var(--color-ink)", "var(--color-secondary)", "var(--color-strong)"];
const CLAMP_CHARS = 150;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

function ReviewCard({ review, tone }: { review: Review; tone: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.text.length > CLAMP_CHARS;
  return (
    <article className={styles.card}>
      <Stars rating={review.rating} className={styles.stars} />
      <p className={`${styles.quote} ${expanded ? styles.quoteOpen : ""}`}>{review.text}</p>
      {long && (
        <button
          type="button"
          className={styles.more}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <div className={styles.author}>
        <span className={styles.avatar} style={{ background: tone }} aria-hidden="true">
          {initialsOf(review.author)}
        </span>
        <span className={styles.name}>{review.author}</span>
      </div>
    </article>
  );
}

export default function TestimonialsCarousel({ reviews }: { reviews: Review[] }) {
  return (
    <SnapCarousel
      label="Client reviews"
      arrows
      className={styles.rail}
      trackClassName={styles.track}
      slideClassName={styles.slide}
      dotsClassName={styles.dots}
      items={reviews.map((review, i) => (
        <ReviewCard key={review.author} review={review} tone={AVATAR_TONES[i % AVATAR_TONES.length]} />
      ))}
    />
  );
}

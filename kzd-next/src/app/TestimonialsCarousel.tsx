"use client";

/* ==========================================================================
   TestimonialsCarousel — the homepage review cards.

   Ported from js/kzd-testimonials.js, which paged the reviews with prev/next
   arrows and a row of dots. Both are reproduced here with swiper/react,
   already the app's carousel (see hosting/PlanCarousel.tsx).

   The arrows drive the instance directly (slidePrev/slideNext) rather than
   going through Swiper's Navigation module: the module wants element refs
   during render, which react-hooks/refs rejects, and driving it by hand also
   gives the real disabled state the legacy had — it set aria-disabled on
   both arrows whenever pageCount was 1.

   Cards are rendered here rather than passed in as children because Swiper
   needs each one wrapped in its own <SwiperSlide>.
   ========================================================================== */

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, A11y } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import type { Review } from "@/lib/content";
import styles from "./page.module.css";

const STAR = "M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z";

const AVATAR_TONES = [
  "var(--kzd-navy-400)",
  "var(--kzd-accent-ink)",
  "var(--kzd-status-hired)",
  "var(--kzd-status-probation)",
  "var(--kzd-status-active)",
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.tstCardStars} role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" aria-hidden="true">
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
}

export default function TestimonialsCarousel({ reviews }: { reviews: Review[] }) {
  const swiperRef = useRef<SwiperClass | null>(null);
  /* Both true until Swiper reports otherwise, which also covers the case the
     legacy handled with `aria-disabled` when pageCount <= 1: with three
     reviews and three visible there is nothing to page to, so the arrows sit
     visibly disabled instead of looking live and doing nothing. */
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = (swiper: SwiperClass) => {
    setAtStart(swiper.isBeginning);
    setAtEnd(swiper.isEnd);
  };

  return (
    <div className={styles.tstCarousel}>
      <Swiper
        modules={[Pagination, A11y]}
        slidesPerView={1}
        spaceBetween={22}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 22 },
          1024: { slidesPerView: 3, spaceBetween: 26 },
        }}
        pagination={{ clickable: true }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          sync(swiper);
        }}
        onSlideChange={sync}
        onResize={sync}
        className={styles.tstSwiper}
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.author + review.text.slice(0, 12)} className={styles.tstSlide}>
            <div className={styles.tstCard}>
              <Stars rating={review.rating} />
              <p className={styles.tstQuote}>{review.text}</p>
              <div className={styles.tstAuthor}>
                <span
                  className={styles.tstAvatar}
                  style={{ background: AVATAR_TONES[review.author.length % AVATAR_TONES.length] }}
                  aria-hidden="true"
                >
                  {initialsOf(review.author)}
                </span>
                <span className={styles.tstName}>{review.author}</span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        type="button"
        className={styles.tstPrev}
        aria-label="Previous reviews"
        disabled={atStart}
        onClick={() => swiperRef.current?.slidePrev()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <button
        type="button"
        className={styles.tstNext}
        aria-label="Next reviews"
        disabled={atEnd}
        onClick={() => swiperRef.current?.slideNext()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}

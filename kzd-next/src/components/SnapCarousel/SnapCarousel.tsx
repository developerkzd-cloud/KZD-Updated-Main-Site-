"use client";

/* ==========================================================================
   SnapCarousel — one swipeable rail for Testimonials and Our Clients.

   Native CSS scroll-snap does the real work (swipe on touch, trackpad,
   shift+wheel all come free and stay at native speed). On top of it:
     - mouse drag with grab/grabbing cursor; a drag never counts as a click
       (only a press that moves under 8px goes through)
     - arrow keys on the focused rail, with a visible focus ring
     - optional 44px prev/next buttons, disabled at either end
     - pager dots that follow the scroll position, centred under the rail
   Smooth scrolling drops to instant under prefers-reduced-motion.
   ========================================================================== */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "@/components/Icon/Icon";
import styles from "./SnapCarousel.module.css";

const DRAG_CLICK_TOLERANCE = 8;

export default function SnapCarousel({
  items,
  label,
  arrows = false,
  dots = true,
  className,
  trackClassName,
  slideClassName,
  dotsClassName,
}: {
  items: ReactNode[];
  label: string;
  arrows?: boolean;
  dots?: boolean;
  className?: string;
  trackClassName?: string;
  slideClassName?: string;
  dotsClassName?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [dragging, setDragging] = useState(false);

  const behavior = (): ScrollBehavior =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  /* Distance from one slide's start to the next (slide width + gap). */
  const step = useCallback(() => {
    const t = trackRef.current;
    if (!t || t.children.length < 2) return t?.clientWidth ?? 1;
    const a = t.children[0] as HTMLElement;
    const b = t.children[1] as HTMLElement;
    return b.offsetLeft - a.offsetLeft || a.offsetWidth;
  }, []);

  const measure = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const s = step();
    const max = t.scrollWidth - t.clientWidth;
    const count = max <= 2 ? 1 : Math.round(max / s) + 1;
    setPages(Math.min(count, items.length));
    setPage(max <= 2 ? 0 : t.scrollLeft >= max - 2 ? count - 1 : Math.round(t.scrollLeft / s));
  }, [items.length, step]);

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    t.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    return () => {
      t.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [measure]);

  const goTo = (i: number) => {
    const t = trackRef.current;
    if (!t) return;
    t.scrollTo({ left: i * step(), behavior: behavior() });
  };

  const nudge = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * step(), behavior: behavior() });
  };

  /* Mouse drag only — touch and pen already scroll natively. */
  const onPointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const t = trackRef.current;
    if (!t) return;
    drag.current = { active: true, startX: e.clientX, startScroll: t.scrollLeft, moved: 0 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    const t = trackRef.current;
    if (!d.active || !t) return;
    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));
    if (d.moved > DRAG_CLICK_TOLERANCE && !dragging) {
      setDragging(true);
      t.setPointerCapture(e.pointerId);
    }
    if (d.moved > DRAG_CLICK_TOLERANCE) t.scrollLeft = d.startScroll - dx;
  };

  const endDrag = () => {
    const d = drag.current;
    const t = trackRef.current;
    if (!d.active) return;
    d.active = false;
    if (!dragging || !t) return;
    setDragging(false);
    /* Snap is suspended while dragging; land on the nearest slide. */
    const s = step();
    t.scrollTo({ left: Math.round(t.scrollLeft / s) * s, behavior: behavior() });
  };

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      {/* The list keeps its list role (the region is the wrapper) and stays
          focusable so the scroller can be moved with the keyboard. */}
      <ul
        ref={trackRef}
        className={[styles.track, dragging && styles.dragging, trackClassName].filter(Boolean).join(" ")}
        tabIndex={0}
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => {
          if (drag.current.moved > DRAG_CLICK_TOLERANCE) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = 0;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowRight") { e.preventDefault(); nudge(1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-1); }
        }}
      >
        {items.map((item, i) => (
          <li key={i} className={[styles.slide, slideClassName].filter(Boolean).join(" ")}>
            {item}
          </li>
        ))}
      </ul>

      {arrows && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            aria-label="Previous"
            disabled={page === 0}
            onClick={() => nudge(-1)}
          >
            <Icon name="chevron-left" size="dense" />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            aria-label="Next"
            disabled={page >= pages - 1}
            onClick={() => nudge(1)}
          >
            <Icon name="chevron-right" size="dense" />
          </button>
        </>
      )}

      {dots && pages > 1 && (
        <div className={[styles.dots, dotsClassName].filter(Boolean).join(" ")}>
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={styles.dot}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === page || undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

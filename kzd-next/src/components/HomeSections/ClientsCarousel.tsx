"use client";

/* ==========================================================================
   ClientsCarousel — "Live sites, real businesses." on the homepage.

   Browser-window cards on an endless, swipeable marquee (ClientsMarquee
   below). A tap or click — never a drag — opens the preview modal:
     - backdrop #1A1A1A at 50% with an 8px blur, 250ms fade
     - dialog scales 0.96 -> 1 and rises 16px while fading, 350ms
     - screenshots slide in from the right, 60ms apart; slow 1.04 zoom on hover
     - traffic lights show their macOS symbols when the group is hovered;
       the red one closes, as do the X, Esc and a backdrop click
     - exit is the reverse in 250ms, then focus returns to the card
     - mobile: a bottom sheet whose screenshots swipe horizontally
   Images are the real site screenshots from the current site, copied into
   /public/images/clients/.
   ========================================================================== */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon/Icon";
import type { Client } from "@/app/services/content";
import { caseStudyHref } from "@/lib/caseStudies";
import styles from "./ClientsCarousel.module.css";

const EXIT_MS = 250;
const imageFor = (client: Client) => client.image ?? `/images/clients/${client.slug}.jpg`;

function Lights({ onClose }: { onClose?: () => void }) {
  return (
    <span className={styles.lights}>
      {onClose ? (
        <button type="button" className={`${styles.light} ${styles.red}`} aria-label="Close preview" onClick={onClose}>
          <span aria-hidden="true">×</span>
        </button>
      ) : (
        <span className={`${styles.light} ${styles.red}`} />
      )}
      <span className={`${styles.light} ${styles.yellow}`}>
        {onClose && <span aria-hidden="true">−</span>}
      </span>
      <span className={`${styles.light} ${styles.green}`}>
        {onClose && <span aria-hidden="true">+</span>}
      </span>
    </span>
  );
}

function ClientCard({
  client,
  onOpen,
  decorative,
}: {
  client: Client;
  onOpen: (c: Client, el: HTMLButtonElement) => void;
  decorative?: boolean;
}) {
  const live = client.status === "live";
  return (
    <button
      type="button"
      tabIndex={decorative ? -1 : undefined}
      className={styles.card}
      onMouseDown={(e) => {
        /* Stop a click on a half-visible card scrolling the rail to it. */
        e.preventDefault();
        e.currentTarget.focus({ preventScroll: true });
      }}
      onClick={(e) => onOpen(client, e.currentTarget)}
    >
      <span className="kzd-sr">Preview </span>
      <span className={styles.window}>
        <span className={styles.chrome}>
          <Lights />
          <span className={styles.domain}>{client.domain}</span>
        </span>
        <span className={styles.shot}>
          <Image
            src={imageFor(client)}
            alt=""
            fill
            sizes="(max-width: 900px) 78vw, 340px"
            className={styles.shotImg}
            draggable={false}
          />
          <span className={`${styles.status} ${live ? styles.statusLive : styles.statusSoon}`}>
            <span className={styles.beacon} aria-hidden="true" />
            {live ? "Live" : "Coming soon"}
          </span>
        </span>
      </span>
      <span className={styles.cat}>{client.category}</span>
      <span className={styles.name}>{client.name}</span>
    </button>
  );
}

function PreviewModal({ client, closing, onClose }: { client: Client; closing: boolean; onClose: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const shots = [{ src: imageFor(client), label: "Home" }];

  useEffect(() => {
    const pad = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (pad > 0) document.body.style.paddingRight = `${pad}px`;
    boxRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab" || !boxRef.current) return;
      const f = boxRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
    };
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      data-state={closing ? "closing" : "open"}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={boxRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kzd-client-preview-title"
      >
        <div className={styles.dialogChrome}>
          <Lights onClose={onClose} />
          <span className={styles.domain}>{client.domain}</span>
          <a
            className={styles.chromeIcon}
            href={`https://${client.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${client.domain} in a new tab`}
          >
            <Icon name="globe" size="dense" />
          </a>
          <button type="button" className={styles.close} aria-label="Close preview" onClick={onClose} data-autofocus>
            <Icon name="x-lg" size="dense" />
          </button>
        </div>

        <div className={styles.shots} data-count={shots.length}>
          {shots.map((s, i) => (
            <figure key={s.src} className={styles.shotPanel} style={{ animationDelay: `${120 + i * 60}ms` }}>
              <Image src={s.src} alt={`${client.name}: ${s.label}`} fill sizes="(max-width: 900px) 100vw, 880px" className={styles.panelImg} />
            </figure>
          ))}
        </div>

        <div className={styles.foot}>
          <div>
            <p className={styles.footCat}>{client.category}</p>
            <h3 className={styles.footName} id="kzd-client-preview-title">{client.name}</h3>
            <p className={styles.footDesc}>{client.description}</p>
          </div>
          <a className={styles.caseStudy} href={caseStudyHref("sites", client.slug)}>
            Case study
            <Icon name="arrow-up-right" size="dense" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------
   The rail: an endless marquee that is still a real scroller.

   The list renders three times; the scroll position drifts right on its own
   (requestAnimationFrame, tracked as a float so slow speeds don't stall on
   integer rounding) and wraps by one set width whenever it nears either end,
   which is invisible because the copies are identical. Because it is a
   genuine overflow-x scroller, swipe, trackpad and shift+wheel just work;
   mouse drag is added on top. Any of those, plus hover and keyboard focus,
   pauses the drift; it resumes after 3s idle. Under reduced motion there is
   no drift at all. Three dots track progress through one set.
   ------------------------------------------------------------------------ */

const SPEED_PX_PER_S = 38;
const DOTS = 3;
const IDLE_RESUME_MS = 3000;
/* Leaving with the mouse is a deliberate "carry on", so resume quickly. */
const HOVER_RESUME_MS = 250;
/* Upper bound on a touch pause, in case touchend/touchcancel never arrive. */
const TOUCH_FAILSAFE_MS = 8000;
/* Seconds to ease back up to full speed after a pause, so it never jerks. */
const RAMP_S = 0.6;
const DRAG_CLICK_TOLERANCE = 8;

function ClientsMarquee({
  clients,
  onOpen,
  modalOpen,
}: {
  clients: Client[];
  onOpen: (c: Client, el: HTMLButtonElement) => void;
  /** While a preview is open the rail holds still behind it, so the card
      that opened it is still in place when focus returns. */
  modalOpen: boolean;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const modalOpenRef = useRef(modalOpen);
  useEffect(() => {
    modalOpenRef.current = modalOpen;
  }, [modalOpen]);
  const pos = useRef(0);
  const setWidth = useRef(0);
  const lastWritten = useRef(0);
  const holdUntil = useRef(0);
  const touchStartedAt = useRef(0);
  const touchEndedAt = useRef(0);
  const lastHoverAt = useRef(0);
  /* Layout changes (resize, the modal's scroll lock) move scrollLeft too;
     those must not be mistaken for a person scrolling. */
  const ignoreScrollUntil = useRef(0);
  const dotRef = useRef(0);
  const drag = useRef({ active: false, startX: 0, startPos: 0, moved: 0 });
  const [dot, setDot] = useState(0);
  const [dragging, setDragging] = useState(false);
  /* The page loads with only the real set of cards; the two copies that
     make the loop seamless are added once the rail comes near the screen.
     That keeps about 300 elements and their images out of the first
     layout, which is most of the cost of this section. */
  const [looped, setLooped] = useState(false);
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLooped(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(t);
    return () => io.disconnect();
  }, []);

  const write = useCallback((p: number) => {
    const t = trackRef.current;
    const w = setWidth.current;
    if (!t || !w) return;
    let next = p;
    while (next >= w * 2) next -= w;
    while (next < w * 0.25) next += w;
    pos.current = next;
    t.scrollLeft = next;
    /* Remember what we asked for rather than reading scrollLeft back, which
       would force a layout on every frame. The scroll handler compares with
       a 1.5px tolerance, so the browser's pixel rounding is absorbed. */
    lastWritten.current = next;
    const within = (((next - w) % w) + w) % w;
    const d = Math.min(DOTS - 1, Math.floor(within / (w / DOTS)));
    if (d !== dotRef.current) {
      dotRef.current = d;
      setDot(d);
    }
  }, []);

  const speed = useRef(0);
  const hold = (ms = IDLE_RESUME_MS) => {
    holdUntil.current = performance.now() + ms;
  };

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    const measure = () => {
      const first = t.children[0] as HTMLElement | undefined;
      const copy = t.children[clients.length] as HTMLElement | undefined;
      if (!first || !copy) return;
      const ratio = setWidth.current ? (pos.current - setWidth.current) / setWidth.current : 0;
      ignoreScrollUntil.current = performance.now() + 400;
      setWidth.current = copy.offsetLeft - first.offsetLeft;
      write(setWidth.current * (1 + ratio));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(t);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    /* Touch screens leave a sticky :hover after a tap, so hover only counts
       on devices that really hover. */
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let running = false;
    let last = performance.now();
    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      /* Every pause reason is re-derived each frame from live state, never a
         flag that an event has to clear: a missed pointerleave / touchend /
         blur can therefore never leave the marquee stuck. */
      const hovered = canHover.matches && t.matches(":hover");
      if (hovered) lastHoverAt.current = now;
      const touching =
        touchStartedAt.current > touchEndedAt.current && now - touchStartedAt.current < TOUCH_FAILSAFE_MS;
      const paused =
        reduced.matches ||
        modalOpenRef.current ||
        now - lastHoverAt.current < HOVER_RESUME_MS ||
        touching ||
        drag.current.active ||
        now < holdUntil.current;
      if (paused) {
        speed.current = 0;
      } else {
        speed.current = Math.min(SPEED_PX_PER_S, speed.current + (SPEED_PX_PER_S / RAMP_S) * dt);
        write(pos.current + speed.current * dt);
      }
      frame = requestAnimationFrame(tick);
    };

    /* The loop only runs while the rail is on screen: off screen it would
       spend every frame on scroll writes nobody can see. */
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(t);

    /* Anything that moved the rail that wasn't us = a person scrolling. */
    const onScroll = () => {
      if (Math.abs(t.scrollLeft - lastWritten.current) < 1.5) return;
      if (performance.now() >= ignoreScrollUntil.current) hold();
      write(t.scrollLeft);
    };
    t.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      t.removeEventListener("scroll", onScroll);
    };
  }, [clients.length, write, looped]);

  const step = () => {
    const t = trackRef.current;
    const a = t?.children[0] as HTMLElement | undefined;
    const b = t?.children[1] as HTMLElement | undefined;
    return a && b ? b.offsetLeft - a.offsetLeft : 320;
  };

  const smoothTo = (left: number) => {
    hold();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    trackRef.current?.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className={styles.rail} role="region" aria-roledescription="carousel" aria-label="Client websites">
      <ul
        ref={trackRef}
        className={`${styles.track} ${dragging ? styles.dragging : ""}`}
        tabIndex={0}
        aria-label="Client websites"
        onPointerLeave={() => {
          if (drag.current.active) {
            drag.current.active = false;
            setDragging(false);
          }
        }}
        onFocus={(e) => {
          /* Keyboard focus only nudges a short pause: key presses inside the
             rail (onKeyDown) are what hold it for the 3s idle. That way focus
             handed back to a card when the modal closes never stalls it. */
          if ((e.target as HTMLElement).matches(":focus-visible")) hold(HOVER_RESUME_MS);
        }}
        onTouchStart={() => {
          touchStartedAt.current = performance.now();
          hold();
        }}
        onTouchEnd={() => {
          touchEndedAt.current = performance.now();
          hold();
        }}
        onTouchCancel={() => {
          touchEndedAt.current = performance.now();
          hold();
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0) return;
          drag.current = { active: true, startX: e.clientX, startPos: pos.current, moved: 0 };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.active) return;
          const dx = e.clientX - d.startX;
          d.moved = Math.max(d.moved, Math.abs(dx));
          if (d.moved > DRAG_CLICK_TOLERANCE) {
            if (!dragging) setDragging(true);
            write(d.startPos - dx);
          }
        }}
        onPointerCancel={() => {
          drag.current.active = false;
          setDragging(false);
        }}
        onPointerUp={() => {
          if (!drag.current.active) return;
          drag.current.active = false;
          if (dragging) {
            setDragging(false);
            hold();
          }
        }}
        onClickCapture={(e) => {
          if (drag.current.moved > DRAG_CLICK_TOLERANCE) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = 0;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          hold();
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            smoothTo(pos.current + step());
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            smoothTo(pos.current - step());
          }
        }}
      >
        {(looped ? [0, 1, 2] : [1]).map((copy) =>
          clients.map((c) => (
            <li key={`${copy}-${c.slug}`} className={styles.slide} aria-hidden={copy !== 1 || undefined}>
              <ClientCard client={c} onOpen={onOpen} decorative={copy !== 1} />
            </li>
          ))
        )}
      </ul>

      <div className={styles.dots}>
        {Array.from({ length: DOTS }, (_, i) => (
          <button
            key={i}
            type="button"
            className={styles.dot}
            aria-label={`Go to clients ${i + 1} of ${DOTS}`}
            aria-current={i === dot || undefined}
            onClick={() => smoothTo(setWidth.current + (i * setWidth.current) / DOTS)}
          />
        ))}
      </div>
    </div>
  );
}

export default function ClientsCarousel({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState<Client | null>(null);
  const [closing, setClosing] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onOpen = useCallback((c: Client, el: HTMLButtonElement) => {
    openerRef.current = el;
    setClosing(false);
    setOpen(c);
  }, []);

  const onClose = useCallback(() => {
    setClosing(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => {
      setOpen(null);
      setClosing(false);
      openerRef.current?.focus({ preventScroll: true });
    }, reduced ? 0 : EXIT_MS);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <>
      <ClientsMarquee clients={clients} onOpen={onOpen} modalOpen={open !== null} />
      <p className={styles.swipeHint} aria-hidden="true">
        Swipe to explore <Icon name="arrow-right" size="dense" />
      </p>
      {open && <PreviewModal client={open} closing={closing} onClose={onClose} />}
    </>
  );
}

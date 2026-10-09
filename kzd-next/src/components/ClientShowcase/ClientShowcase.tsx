"use client";

/* ==========================================================================
   ClientShowcase — "Live sites, real businesses.", shared by the homepage
   and /services.

   Ported from js/kzd-showcase.js + css/kzd-showcase.css. Each client is a
   browser-window mockup: a chrome bar with traffic lights and the domain,
   then the site screenshot. Hovering veils the shot and floats a "Preview"
   pill over it; clicking opens the same shot full size in a modal with the
   description and a "View project" action. The category and name sit below
   the card, outside it.

   ONE mode at every width, by request: the continuous marquee that used to
   be desktop-only now runs on mobile and tablet too, rather than swapping to
   the legacy's paged arrows-and-dots carousel below 900px. The list renders
   twice and the track translates -50%, so one period lands back on the
   first card; duration derives from the card count (card width + gap at a
   fixed px/sec), never hardcoded, so adding a client stays a data edit.

   The "Preview" pill is hover/focus-visible only, on every device — by
   request, not tied to input type or screen width. On a device with no
   hover it simply never shows; tapping the card still opens the modal
   directly either way, so nothing about opening the preview depends on it.

   Card width is a container query (100cqw capped at 378px, in the CSS) so
   it always fits whichever box this renders in — see the note there for why
   a viewport-relative or breakpoint-based width was wrong on /services.

   NO LINKS YET: every CLIENTS entry has an empty `url`, so the card and the
   modal's "View project" are buttons, exactly as the static site left them.
   Fill `url` in and both become real links.
   ========================================================================== */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Client } from "@/app/services/content";
import styles from "./ClientShowcase.module.css";
import Icon from "@/components/Icon/Icon";

const BASE = "/Assets/clients/r/";
/* Card 378 + 26 gap; the reference ran 6 cards in 45s. Holding that px/sec
   is what makes the duration derived rather than magic. */
const PX_PER_SEC = (6 * 404) / 45;
const CARD_PERIOD_PX = 404;
const EAGER = 2;

function ExternalGlyph() {
  return <Icon name="arrow-up-right" size="dense" />;
}

function ChromeBar({ domain, className }: { domain: string; className: string }) {
  return (
    <div className={className}>
      <span className={styles.lights}>
        <span className={`${styles.light} ${styles.lightR}`} />
        <span className={`${styles.light} ${styles.lightY}`} />
        <span className={`${styles.light} ${styles.lightG}`} />
      </span>
      <span className={styles.domain}>{domain}</span>
    </div>
  );
}

/* The legacy randomised each beacon's delay 0-800ms so the six never blink in
   unison. Random would differ between server and client render, so this is
   an index hash instead — same de-synced effect, no hydration mismatch. */
function beaconDelay(index: number) {
  return `${(index * 233) % 800}ms`;
}

function StatusBadge({ client, index }: { client: Client; index: number }) {
  const live = client.status === "live";
  const delay = beaconDelay(index);
  return (
    <span className={`${styles.status} ${live ? "" : styles.statusSoon}`}>
      <span className={styles.beacon}>
        <span className={styles.halo} style={{ animationDelay: delay }} />
        <span className={styles.dotlive} style={{ animationDelay: delay }} />
      </span>
      {live ? "Live" : "Coming soon"}
    </span>
  );
}

export default function ClientShowcase({ clients }: { clients: Client[] }) {
  const duration = ((clients.length * CARD_PERIOD_PX) / PX_PER_SEC).toFixed(2);
  const [open, setOpen] = useState<Client | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const closeModal = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
    openerRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;

    /* Scroll lock, compensating for the scrollbar so the page does not shift. */
    const pad = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (pad > 0) document.body.style.paddingRight = `${pad}px`;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key !== "Tab") return;
      const box = boxRef.current;
      if (!box) return;
      const f = box.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!f.length) {
        e.preventDefault();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;
      if (!box.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
    };
  }, [open, closeModal]);

  function Card({ client, index, dup }: { client: Client; index: number; dup?: boolean }) {
    return (
      <li className={styles.item} aria-hidden={dup || undefined} inert={dup || undefined}>
        <button
          type="button"
          className={styles.card}
          aria-label={`Preview ${client.name} — ${client.domain}`}
          tabIndex={dup ? -1 : undefined}
          onClick={(e) => {
            openerRef.current = e.currentTarget;
            setOpen(client);
          }}
        >
          <ChromeBar domain={client.domain} className={styles.chrome} />
          <div className={styles.shot}>
            <Image
              src={`${BASE}${client.slug}-800.jpg`}
              alt=""
              fill
              sizes="(max-width: 560px) 92vw, 378px"
              priority={index < EAGER && !dup}
              className={styles.shotImg}
            />
            <span className={styles.veil} />
            <span className={styles.preview}>
              Preview
              <ExternalGlyph />
            </span>
            <StatusBadge client={client} index={index} />
          </div>
        </button>
        <p className={styles.cat}>{client.category}</p>
        <p className={styles.name}>{client.name}</p>
      </li>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.rail}>
        <ul className={styles.track} style={{ animationDuration: `${duration}s` }}>
          {clients.map((client, i) => (
            <Card key={client.slug} client={client} index={i} />
          ))}
          {/* Second set: what makes the -50% wrap seamless. */}
          {clients.map((client, i) => (
            <Card key={`dup-${client.slug}`} client={client} index={i} dup />
          ))}
        </ul>
      </div>

      {open && (
        <div
          className={`${styles.scrim} ${styles.scrimOpen}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kzd-sc-modal-title"
            ref={boxRef}
          >
            <div className={styles.modalChrome}>
              <span className={styles.lights}>
                <span className={`${styles.light} ${styles.lightR}`} />
                <span className={`${styles.light} ${styles.lightY}`} />
                <span className={`${styles.light} ${styles.lightG}`} />
              </span>
              <span className={styles.domain}>{open.domain}</span>
              <Icon className={styles.globe} name="globe" size="dense" />
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Close preview"
                onClick={closeModal}
                autoFocus
              >
                <Icon name="x-lg" />
              </button>
            </div>

            <div className={styles.modalShot}>
              <Image
                src={`${BASE}${open.slug}-1200.jpg`}
                alt=""
                fill
                sizes="(max-width: 560px) 100vw, 880px"
                className={styles.modalShotImg}
              />
            </div>

            <div className={styles.modalFoot}>
              <p className={styles.modalCat}>{open.category}</p>
              <p className={styles.modalName} id="kzd-sc-modal-title">{open.name}</p>
              <p className={styles.modalDesc}>{open.description}</p>
              {/* Still a button: every CLIENTS entry's `url` is empty, as on
                  the static site. Fill it in to make this a real link. */}
              <button type="button" className={styles.modalGo}>
                View project
                <ExternalGlyph />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

/* ==========================================================================
   OfflineScreen — Penpot "404 Offline — Desktop" and "404 Offline — Mobile
   (Split)".

   Desktop: a white copy panel (logo, "404 · OFFLINE" eyebrow, headline,
   actions, a contact line) beside a dark panel with radar rings around a
   no-signal disc and a "Quick checks" card. Mobile: the dark panel becomes a
   short header with the logo, and the copy sits under it.

   It covers the whole viewport and makes the page behind it inert, so it
   works both as the /offline page (served by the service worker when a page
   can't load) and as the overlay OfflineGate shows when the connection
   drops mid-visit. Links don't prefetch and the logo is a plain <img>, not
   next/image: with no network there is nothing to prefetch or optimise,
   and the service worker caches the logo under this exact URL.
   ========================================================================== */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CONTACT } from "@/lib/nav";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import styles from "./OfflineScreen.module.css";

const CHECKS = ["Check your Wi-Fi or mobile data", "Restart your router", "Try again in a moment"];

function Brand({ className }: { className: string }) {
  return (
    <Link className={`${styles.brand} ${className}`} href="/" prefetch={false}>
      {/* eslint-disable-next-line @next/next/no-img-element -- cached by the service worker under this exact URL */}
      <img className={styles.brandMark} src="/Assets/logos/kzd-mark.png" width={96} height={95} alt="" />
      <span>KZD Solutions</span>
    </Link>
  );
}

export default function OfflineScreen() {
  const rootRef = useRef<HTMLDivElement>(null);

  /* Everything else on the page goes inert and stops scrolling while this
     is up, and focus moves into the dialog. */
  useEffect(() => {
    const root = rootRef.current;
    const others = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !el.contains(root)
    );
    others.forEach((el) => (el.inert = true));
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    root?.focus({ preventScroll: true });
    return () => {
      others.forEach((el) => (el.inert = false));
      html.style.overflow = overflow;
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.screen} role="dialog" aria-modal="true" aria-labelledby="kzd-offline-title" tabIndex={-1}>
      <div className={styles.copy}>
        <Brand className={styles.brandOnLight} />

        <div className={styles.body}>
          <p className={styles.eyebrow}>
            404 · Offline
            <span className={styles.rule} aria-hidden="true" />
          </p>
          <h1 className={styles.title} id="kzd-offline-title">
            You are
            <br />
            offline.
          </h1>
          <p className={styles.lead}>
            The page didn&rsquo;t load because your device has no internet connection.{" "}
            <span className={styles.desktopOnly}>Reconnect and we will pick up right where you left off.</span>
            <span className={styles.mobileOnly}>Reconnect and try again.</span>
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.retry} onClick={() => window.location.reload()}>
              Try again <ArrowIcon />
            </button>
            <Link className={styles.home} href="/" prefetch={false}>
              Go to homepage
            </Link>
          </div>
        </div>

        <footer className={styles.foot}>
          <a href={CONTACT.phoneHref}>Need help? {CONTACT.phoneLabel}</a>
          <a className={styles.desktopOnly} href={`mailto:${CONTACT.email}`}>
            {CONTACT.email}
          </a>
          <span className={styles.mobileOnly}>&copy; KZD Solutions</span>
        </footer>
      </div>
      <div className={styles.visual}>
        <Brand className={styles.brandOnDark} />
        <div className={styles.radar} aria-hidden="true">
          <span className={`${styles.ring} ${styles.ring3}`} />
          <span className={`${styles.ring} ${styles.ring2}`} />
          <span className={`${styles.ring} ${styles.ring1}`} />
          <span className={styles.disc}>
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M2.5 8.8a14 14 0 0 1 4.3-2.6M10.4 5.2A14 14 0 0 1 21.5 8.8" />
              <path d="M5.6 12a9.5 9.5 0 0 1 3.2-1.8M13.6 10a9.5 9.5 0 0 1 4.8 2" />
              <path d="M8.8 15.2a5 5 0 0 1 6.4 0" />
              <circle cx="12" cy="18.6" r="0.9" fill="currentColor" stroke="none" />
              <path d="M4 3.5l16 16" />
            </svg>
          </span>
        </div>

        <div className={styles.checks}>
          <p className={styles.checksLabel}>Quick checks</p>
          <ol className={styles.checkList}>
            {CHECKS.map((c, i) => (
              <li key={c}>
                <span className={styles.checkNum}>{String(i + 1).padStart(2, "0")}</span>
                {c}
              </li>
            ))}
          </ol>
        </div>
      </div>

    </div>
  );
}

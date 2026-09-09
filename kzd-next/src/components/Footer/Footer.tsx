/* ==========================================================================
   Footer — a Server Component, with no client boundary at all.

   It replaces BOTH footers the static site carried: the newer .kzd-footer on 7
   pages and the purchased theme's on the other 11. Those had already drifted
   (different markup and different link sets), and every change — adding Blog,
   removing About — had to be made twice against two different shapes.

   Social marks are inline SVG paths from src/lib/nav.ts, never hotlinked: an
   external logo URL can move or vanish, adds a third-party request to every
   page load, and can trip CORS.
   ========================================================================== */

import Image from "next/image";
import Link from "next/link";
import { CONTACT, FOOTER_COMPANY, FOOTER_SERVICES, SOCIALS } from "@/lib/nav";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Band 1 — contact */}
        <div className={styles.band1}>
          <div>
            <p className={styles.label}>Need support?</p>
            <a className={styles.email} href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </div>
          <div>
            <p className={styles.label}>Call us directly?</p>
            <a className={styles.phone} href={CONTACT.phoneHref}>
              {CONTACT.phoneLabel}
            </a>
          </div>
        </div>

        <hr className={styles.rule} />

        {/* Band 2 — brand and columns */}
        <div className={styles.band2}>
          <div>
            <Link className={styles.brand} href="/" aria-label="KZD Solutions — home">
              <Image className={styles.mark} src="/Assets/logos/kzd-mark.png" width={96} height={95} alt="" />
              <span className={styles.wordmark}>KZD Solutions</span>
            </Link>
            <p className={styles.tagline}>{CONTACT.tagline}</p>

            <ul className={styles.socials}>
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a
                    className={styles.social}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`KZD Solutions on ${s.name}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d={s.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.colHead}>Company</p>
            <ul className={styles.list}>
              {FOOTER_COMPANY.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                  {link.hot && <span className={styles.hot}>Hot</span>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.colHead}>Services</p>
            <ul className={styles.list}>
              {FOOTER_SERVICES.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <hr className={styles.rule} />

        {/* Band 3 — bottom bar */}
        <div className={styles.band3}>
          <p>&copy; Copyright KZD Solutions {year}.</p>
          <p className={styles.loc}>{CONTACT.location}</p>
        </div>
      </div>
    </footer>
  );
}

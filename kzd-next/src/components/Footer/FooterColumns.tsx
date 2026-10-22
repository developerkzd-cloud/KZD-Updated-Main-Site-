"use client";

/* ==========================================================================
   FooterColumns — Company / Services / Get in touch.

   Desktop: three always-open columns with mono headings.
   Mobile: each heading is a button; tapping toggles its panel, "+" turns to
   "−", the height animates over 250ms (grid-template-rows 0fr -> 1fr), and
   only one panel is open at a time. A closed panel is visibility:hidden so
   its links leave the tab order and the accessibility tree.
   ========================================================================== */

import { useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import Icon from "@/components/Icon/Icon";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import type { NavLink } from "@/lib/nav";
import styles from "./Footer.module.css";

/* Matches the phone block in Footer.module.css; tablets get open columns. */
const MOBILE = "(max-width: 640px)";

/* Headings are only toggles on mobile; on desktop the columns are always
   open, so a button there would announce a state that isn't real. */
function useIsMobile() {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(MOBILE);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOBILE).matches,
    () => false
  );
}

type Contact = { email: string; phoneHref: string; phoneLabel: string; location: string };

export default function FooterColumns({
  company,
  services,
  contact,
}: {
  company: (NavLink & { hot?: boolean })[];
  services: NavLink[];
  contact: Contact;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const section = (id: string, title: string, body: ReactNode) => {
    const isOpen = open === id;
    return (
      <div className={styles.col} data-open={isOpen || undefined}>
        <h2 className={styles.colHead}>
          {isMobile ? (
            <button
              type="button"
              className={styles.colToggle}
              aria-expanded={isOpen}
              aria-controls={`footer-${id}`}
              onClick={() => setOpen(isOpen ? null : id)}
            >
              {title}
              <span className={styles.colSign} aria-hidden="true" />
            </button>
          ) : (
            title
          )}
        </h2>
        <div id={`footer-${id}`} className={styles.panel}>
          <div className={styles.panelInner}>{body}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.cols}>
      {section(
        "company",
        "Company",
        <ul className={styles.list}>
          {company.map((link) => (
            <li key={link.label}>
              <Link href={link.href}>{link.label}</Link>
              {link.hot && <span className={styles.hot}>Hot</span>}
            </li>
          ))}
        </ul>
      )}

      {section(
        "services",
        "Services",
        <ul className={styles.list}>
          {services.map((link) => (
            <li key={link.label}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      )}

      {section(
        "contact",
        "Get in touch",
        <>
          <ul className={`${styles.list} ${styles.contactList}`}>
            <li>
              <Icon name="envelope" size="dense" />
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
            <li>
              <Icon name="telephone" size="dense" />
              <a href={contact.phoneHref}>{contact.phoneLabel}</a>
            </li>
            <li>
              <Icon name="geo-alt" size="dense" />
              <span>{contact.location}</span>
            </li>
          </ul>
          <Link className={styles.ctaDesktop} href="/contact">
            <ArrowIcon /> Let&rsquo;s Work Together
          </Link>
        </>
      )}
    </div>
  );
}

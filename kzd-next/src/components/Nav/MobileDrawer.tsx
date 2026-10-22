"use client";

/* ==========================================================================
   Mobile drawer — redesigned as a full-screen sheet that slides down from
   the top (was a side drawer), black & white, with numbered links and a
   Services accordion of the same six services as the desktop dropdown.

   Preserved from the previous version (still correct, still load-bearing):
     - 100dvh, not 100vh — vh is wrong once Safari's address bar hides
     - one close button, Escape closes it too
     - body scroll locked while open
     - focus trapped inside while open, Escape/X/any link-tap closes it
     - focus returns to the burger button on close
   Changed: focus moves to the first NAV LINK on open now (not whichever
   element happens to be first in the DOM), per the brief.
   ========================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_LINKS, CONTACT, NAV_ITEMS, SOCIALS } from "@/lib/nav";
import { SERVICES, serviceHref } from "@/lib/services";
import SocialIcons from "@/components/SocialIcons/SocialIcons";
import styles from "./MobileDrawer.module.css";
import Icon from "@/components/Icon/Icon";

export default function MobileDrawer({ burgerClass, barsClass, barClass }: { burgerClass: string; barsClass: string; barClass: string }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const pathname = usePathname();

  const panelRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setServicesOpen(false);
    burgerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    firstLinkRef.current?.focus();

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []
      ).filter((n) => n.offsetWidth > 0 || n.offsetHeight > 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;

      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];

      if (!panelRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className={burgerClass}
        data-open={open}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="kzd-mobile-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={barsClass}>
          <span className={barClass} />
          <span className={barClass} />
          <span className={barClass} />
        </span>
      </button>

      <div
        className={`${styles.scrim} ${open ? styles.scrimOpen : ""}`}
        hidden={!open}
        onClick={close}
        aria-hidden="true"
      />

      <div
        id="kzd-mobile-drawer"
        ref={panelRef}
        className={`${styles.panel} ${open ? styles.panelOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className={styles.head}>
          <Link className={styles.brand} href="/" onClick={close}>
            <Image className={styles.mark} src="/Assets/logos/kzd-mark.png" width={96} height={95} alt="" />
            <span className={styles.word}>KZD Solutions</span>
          </Link>
          <button type="button" className={styles.close} aria-label="Close menu" onClick={close}>
            <Icon name="x-lg" />
          </button>
        </div>

        <nav className={styles.body} aria-label="Main">
          <ul className={styles.list}>
            {NAV_ITEMS.map((item, d) => {
              if (item.label === "Services") {
                return (
                  <li key={item.label} style={{ ["--d" as string]: d }}>
                    <button
                      type="button"
                      className={`${styles.row} ${styles.trigger}`}
                      aria-expanded={servicesOpen}
                      aria-controls="kzd-drawer-services"
                      onClick={() => setServicesOpen((v) => !v)}
                    >
                      <span className={styles.num}>{String(d + 1).padStart(2, "0")}</span>
                      {item.label}
                      <Icon className={styles.caret} name="chevron-down" size="dense" />
                    </button>

                    <div
                      id="kzd-drawer-services"
                      className={styles.sub}
                      data-open={servicesOpen}
                      inert={!servicesOpen}
                    >
                      <div className={styles.subInner}>
                        <ul>
                          {SERVICES.map((s) => (
                            <li key={s.slug}>
                              <Link className={styles.subLink} href={serviceHref(s)} onClick={close}>
                                <span>{s.name}</span>
                                <span className={styles.subMeta}>{s.comingSoon ? "Soon" : s.tag}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              }
              return (
                <li key={item.label} style={{ ["--d" as string]: d }}>
                  <Link
                    ref={d === 0 ? firstLinkRef : undefined}
                    className={styles.row}
                    href={item.href}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    onClick={close}
                  >
                    <span className={styles.num}>{String(d + 1).padStart(2, "0")}</span>
                    {item.label}
                    <Icon className={styles.rowArrow} name="arrow-right" size="dense" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.actions}>
          <div className={styles.authRow}>
            {AUTH_LINKS.map((link, i) => (
              <a
                key={link.label}
                className={`${styles.btn} ${i === 0 ? styles.btnGhost : styles.btnPrimary}`}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className={styles.contact}>
            <a href={CONTACT.phoneHref}>{CONTACT.phoneLabel}</a>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </div>

          <SocialIcons links={SOCIALS} className={styles.socials} />
        </div>
      </div>
    </>
  );
}

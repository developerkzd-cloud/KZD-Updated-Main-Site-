"use client";

/* ==========================================================================
   Mobile drawer — the second and last client boundary in the nav.

   Behaviour carried over from js/kzd-nav.js verbatim, because it was built to
   fix seven specific faults and each fix is load-bearing:

     - full viewport, 100dvh not 100vh (vh is wrong once Safari hides the bar)
     - every row on the same left inset, the Services row included
     - the current page marked with an ember edge, never dimmed (dim reads as
       disabled)
     - one close button
     - the panel scrolls, so a long submenu stays reachable
     - focus trapped, Escape closes and returns focus to the trigger
     - body scroll locked while open
   ========================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_LINKS, NAV_ITEMS } from "@/lib/nav";
import styles from "./MobileDrawer.module.css";

export default function MobileDrawer({ burgerClass, barClass }: { burgerClass: string; barClass: string }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const pathname = usePathname();

  const panelRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    burgerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []
      ).filter((n) => n.offsetWidth > 0 || n.offsetHeight > 0);

    focusables()[0]?.focus();

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
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]);

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className={burgerClass}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="kzd-mobile-drawer"
        onClick={() => setOpen(true)}
      >
        <span className={barClass} />
        <span className={barClass} />
        <span className={barClass} />
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
            {/* Already white-on-transparent, so no filter here, unlike the light bar. */}
            <Image className={styles.mark} src="/Assets/logos/kzd-mark.png" width={96} height={95} alt="" />
            <span className={styles.word}>KZD Solutions</span>
          </Link>
          <button type="button" className={styles.close} aria-label="Close menu" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 5l14 14" /><path d="M19 5L5 19" />
            </svg>
          </button>
        </div>

        <nav className={styles.body} aria-label="Main">
          <ul className={styles.list}>
            {NAV_ITEMS.map((item) =>
              item.groups ? (
                <li key={item.label}>
                  <button
                    type="button"
                    className={`${styles.row} ${styles.trigger}`}
                    aria-expanded={servicesOpen}
                    aria-controls="kzd-drawer-services"
                    onClick={() => setServicesOpen((v) => !v)}
                  >
                    {item.label}
                    <svg className={styles.caret} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  <div
                    id="kzd-drawer-services"
                    className={styles.sub}
                    hidden={!servicesOpen}
                  >
                    {item.groups.map((group) => (
                      <div key={group.heading}>
                        <p className={styles.subHead}>{group.heading}</p>
                        <ul>
                          {group.links.map((link) => (
                            <li key={link.label}>
                              <Link className={styles.subLink} href={link.href} onClick={close}>
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </li>
              ) : (
                <li key={item.label}>
                  <Link
                    className={styles.row}
                    href={item.href}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>

        <div className={styles.actions}>
          {AUTH_LINKS.map((link, i) => (
            <a
              key={link.label}
              className={`${styles.btn} ${i === 0 ? styles.btnGhost : styles.btnEmber}`}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

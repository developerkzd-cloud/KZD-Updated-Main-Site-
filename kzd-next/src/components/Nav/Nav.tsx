/* ==========================================================================
   Nav — a Server Component.

   This is the biggest single win of the migration: the static site carried this
   markup in 18 separate HTML files, so adding "Blog" to the footer meant
   editing 18 of them and removing "About" meant editing 17. Here it is one
   file, and the links come from src/lib/nav.ts.

   Only two children are "use client":
     ServicesDropdown — one <li>, the mega panel
     MobileDrawer     — the hamburger and off-canvas panel
   Everything else, including every link, is server-rendered.
   ========================================================================== */

import Image from "next/image";
import Link from "next/link";
import { AUTH_LINKS, NAV_ITEMS } from "@/lib/nav";
import ServicesDropdown from "./ServicesDropdown";
import MobileDrawer from "./MobileDrawer";
import styles from "./Nav.module.css";

export default function Nav({ transparent = false }: { transparent?: boolean }) {
  return (
    <header className={`${styles.header} ${transparent ? styles.transparent : ""}`}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <Image
            className={styles.brandMark}
            src="/Assets/logos/kzd-mark.png"
            width={96}
            height={95}
            alt=""
            priority
          />
          <span className={styles.brandWord}>KZD Solutions</span>
        </Link>

        <nav aria-label="Main">
          <ul className={styles.list}>
            {NAV_ITEMS.map((item) =>
              item.groups ? (
                <ServicesDropdown key={item.label} item={item} />
              ) : (
                <li className={styles.item} key={item.label}>
                  <Link className={styles.link} href={item.href}>
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>

        <ul className={styles.auth}>
          {AUTH_LINKS.map((link) => (
            <li key={link.label}>
              <a className={styles.authLink} href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <MobileDrawer burgerClass={styles.burger} barClass={styles.burgerBar} />
      </div>
    </header>
  );
}

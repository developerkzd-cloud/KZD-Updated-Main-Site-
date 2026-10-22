/* ==========================================================================
   Footer — a Server Component; only the column accordions are client-side
   (FooterColumns).

   Desktop: brand + tagline + socials, then Company / Services / Get in touch
   columns, a "Let's Work Together" button, and a bottom bar.
   Mobile: everything centred; the three columns become accordions (one open
   at a time) and the button is a full-width white pill.

   Social marks are inline SVG paths from the shared icon set, never
   hotlinked.
   ========================================================================== */

import Image from "next/image";
import Link from "next/link";
import { CONTACT, FOOTER_COMPANY, SOCIALS } from "@/lib/nav";
import { SERVICES, serviceHref } from "@/lib/services";
import Icon from "@/components/Icon/Icon";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import FooterColumns from "./FooterColumns";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link className={styles.brand} href="/" aria-label="KZD Solutions home">
              <Image className={styles.mark} src="/Assets/logos/kzd-mark.png" width={96} height={95} alt="" />
              <span className={styles.wordmark}>KZD Solutions</span>
            </Link>
            <p className={styles.tagline}>
              From big problems <br className={styles.desktopBreak} />
              to simple solutions.
            </p>

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
                    <Icon name={s.icon} size="dense" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumns
            company={FOOTER_COMPANY}
            services={SERVICES.map((s) => ({ label: s.name, href: serviceHref(s) }))}
            contact={{
              email: CONTACT.email,
              phoneHref: CONTACT.phoneHref,
              phoneLabel: CONTACT.phoneLabel,
              location: CONTACT.location,
            }}
          />
        </div>

        <Link className={styles.ctaMobile} href="/contact">
          Let&rsquo;s Work Together <ArrowIcon />
        </Link>

        <div className={styles.bottom}>
          <p>&copy; {year} KZD Solutions. All rights reserved.</p>
          {/* No privacy or terms pages exist yet — plain text until they do,
              rather than links that 404. */}
          <p className={styles.legal}>
            <span>Privacy Policy</span>
            <span className={styles.legalSep} aria-hidden="true" />
            <span>Terms of Service</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

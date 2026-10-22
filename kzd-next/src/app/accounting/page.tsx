/* ==========================================================================
   /accounting — ported from accounting.html.

   Server Component for the static hero and "problem" cards — nothing here
   is interactive. The checklist, package recommendation and lead form are
   one tightly-coupled client leaf (AccountingHealthCheck) because all three
   share the live checklist score: the ported inline <script> at the bottom
   of accounting.html read every checkbox, recomputed the tick count on every
   change, decided which package to recommend from that count, and fed the
   result into the lead form's hidden fields and package dropdown.
   ========================================================================== */

import type { Metadata } from "next";
import Image from "next/image";
import AccountingHealthCheck from "./AccountingHealthCheck";
import Reveal from "@/components/Reveal/Reveal";
import styles from "./accounting.module.css";
import Icon from "@/components/Icon/Icon";

const DESCRIPTION =
  "KZD Solutions provides expert accounting services in Durban. Contact us for all your accounting needs.";

export const metadata: Metadata = {
  title: "Accounting",
  description: DESCRIPTION,
  alternates: { canonical: "/accounting" },
  openGraph: {
    type: "website",
    url: "/accounting",
    title: "Accounting | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

const PROBLEM_CARDS = [
  {
    badge: "Financial Chaos",
    badgeClass: styles.badgeDanger,
    items: [
      "No management accounts",
      "No annual financial statements",
      "Unsure if you're profitable",
      "Poor bookkeeping",
    ],
    foot: "You're running your business blind.",
  },
  {
    badge: "Tax & Compliance Stress",
    badgeClass: styles.badgeWarn,
    items: ["Late submissions", "EMP201 / PAYE confusion", "SARS penalties", "Unsure about VAT"],
    foot: "You're reacting instead of preventing.",
  },
  {
    badge: "Weak Internal Controls",
    badgeClass: styles.badgeNeutral,
    items: [
      "No supplier vetting",
      "No segregation of duties",
      "No documented processes",
      "No risk register",
    ],
    foot: "Fraud and errors become expensive.",
  },
  {
    badge: "Growth Without Systems",
    badgeClass: styles.badgeInfo,
    items: [
      "No performance tracking",
      "No asset register",
      "No governance structure",
      "No financial planning",
    ],
    foot: "Growth without structure creates risk.",
  },
];

function XIcon() {
  return (
    <Icon name="x-lg" />
  );
}

export default function AccountingPage() {
  return (
    <main className={styles.acc}>
      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image
            src="/images/finance-consulting-discussing-executive-people-plan.jpg"
            alt=""
            fill
            sizes="100vw"
            priority
            fetchPriority="high"
            className={styles.heroImg}
          />
          <div className={styles.heroWash} aria-hidden="true" />
        </div>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Grow your business with us</span>
          <h1 className={styles.h1}>Accounting</h1>
          <div className={styles.heroCtas}>
            <a className={styles.btnHeroPrimary} href="#checklist">
              Start My 2-Minute Business Health Check
            </a>
            <a
              className={styles.btnHeroOutline}
              href="https://kzdsolutions.setmore.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Strategy Call
            </a>
          </div>
        </div>
      </section>

      <section className={styles.trusted}>
        <Reveal className={styles.inner}>
          <h2 className={styles.h2 + " " + styles.trustedTitle}>
            Trusted by Many Businesses Across Durban.
          </h2>
          <p className={styles.trustedSub}>
            Digital-first advisory. Video &amp; voice consultations available.
          </p>
        </Reveal>
      </section>

      <section className={styles.problems} aria-labelledby="acc-problems">
        <div className={styles.inner}>
          <h2 className={styles.h2 + " " + styles.problemsTitle} id="acc-problems">
            Most Businesses Don&apos;t Have a Revenue Problem.
            <br /> They Have a Structure Problem.
          </h2>
          <div className={styles.problemGrid}>
            {PROBLEM_CARDS.map((card) => (
              <Reveal className={styles.problemCard} key={card.badge}>
                <span className={styles.problemBadge + " " + card.badgeClass}>{card.badge}</span>
                <ul className={styles.problemList}>
                  {card.items.map((item) => (
                    <li className={styles.problemItem} key={item}>
                      <XIcon />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className={styles.problemFoot}>{card.foot}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <AccountingHealthCheck />
    </main>
  );
}

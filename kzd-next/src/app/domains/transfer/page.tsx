/* ==========================================================================
   /domains/transfer — ported from domain-transfer.html.

   A Server Component. TransferForm is the only client leaf; the benefits
   column and "what happens next" list are plain server-rendered HTML.
   ========================================================================== */

import type { Metadata } from "next";
import Link from "next/link";
import { getTlds } from "@/lib/content";
import TransferForm from "./TransferForm";
import Reveal from "@/components/Reveal/Reveal";
import styles from "./transfer.module.css";

const DESCRIPTION =
  "Transfer your domain to KZD Solutions. Easy, secure domain transfer process with expert support.";

export const metadata: Metadata = {
  title: "Transfer a Domain",
  description: DESCRIPTION,
  alternates: { canonical: "/domains/transfer" },
  openGraph: {
    type: "website",
    url: "/domains/transfer",
    title: "Transfer a Domain | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

const CHECK_ICON = "M20 6L9 17l-5-5";

const BENEFITS = [
  {
    title: "Affordable Transfer Pricing",
    body: (
      <>
        Some South African extensions transfer for as little as R49.{" "}
        <Link href="/domains/pricing">See full transfer pricing</Link>.
      </>
    ),
  },
  {
    title: "Free Privacy Protection",
    body: "Keep your personal information private with free WHOIS protection.",
  },
  {
    title: "24/7 Support",
    body: "Get help anytime with domain transfers and management.",
  },
  {
    title: "Easy Management",
    body: "Simple control panel for DNS, email, and domain settings.",
  },
];

export default function DomainTransferPage() {
  const tlds = getTlds();

  return (
    <main className={styles.trf}>
      <section className={styles.hero}>
        <div className={styles.wash} aria-hidden="true" />
        <div className={styles.inner}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Domain Transfer
          </span>
          <h1 className={styles.h1}>Transfer Your Domain</h1>
          <p className={styles.intro}>
            Transfer your domain to KZD Solutions for better management, security, and support.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.grid}>
            <TransferForm tlds={tlds} />

            <Reveal className={styles.benefits}>
              <h2 className={styles.benefitsTitle}>Why Transfer to KZD Solutions?</h2>
              <ul className={styles.benefitList}>
                {BENEFITS.map((benefit) => (
                  <li className={styles.benefitItem} key={benefit.title}>
                    <svg className={styles.benefitIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <circle cx="12" cy="12" r="10" fill="none" />
                      <path d={CHECK_ICON} />
                    </svg>
                    <div>
                      <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                      <p className={styles.benefitBody}>{benefit.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.notes}>
                <p className={styles.notesTitle}>Important Notes:</p>
                <ul className={styles.notesList}>
                  <li>Domain must be at least 60 days old</li>
                  <li>Domain cannot be within 60 days of expiration</li>
                  <li>Unlock your domain at current registrar</li>
                  <li>Disable privacy protection temporarily</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}

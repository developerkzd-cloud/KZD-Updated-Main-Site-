/* ==========================================================================
   /domains/pricing — ported from domain-pricing.html.

   A Server Component. The full TLD catalog is read once (getTlds) and
   handed to PricingSearch, the one client leaf, which filters it live with
   filterTlds() and renders it through the shared TldTable.
   ========================================================================== */

import type { Metadata } from "next";
import { getTlds } from "@/lib/content";
import PricingSearch from "./PricingSearch";
import Reveal from "@/components/Reveal/Reveal";
import styles from "./pricing.module.css";

const DESCRIPTION =
  "View domain pricing for all extensions at KZD Solutions. Affordable domain registration and renewal prices.";

export const metadata: Metadata = {
  title: "Domain Pricing",
  description: DESCRIPTION,
  alternates: { canonical: "/domains/pricing" },
  openGraph: {
    type: "website",
    url: "/domains/pricing",
    title: "Domain Pricing | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

export default function DomainPricingPage() {
  const tlds = getTlds();

  return (
    <main className={styles.prc}>
      <section className={styles.hero}>
        <div className={styles.wash} aria-hidden="true" />
        <div className={styles.inner}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Domain Pricing
          </span>
          <h1 className={styles.h1}>No Hidden Fees</h1>
          <p className={styles.intro}>
            See exactly what you&apos;ll pay to register, renew, or transfer — every extension we
            sell, one table.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="prc-table">
        <Reveal className={styles.inner}>
          <h2 className="kzd-sr" id="prc-table">All domain extensions</h2>
          <PricingSearch tlds={tlds} />
        </Reveal>
      </section>
    </main>
  );
}

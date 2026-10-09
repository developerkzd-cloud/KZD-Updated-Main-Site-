/* ==========================================================================
   /domains/tld-extensions — ported from tld-extensions.html.

   A Server Component. The catalog is read once (getTlds) and split into the
   same two groups the legacy inline script built (south-african + african,
   then global + business), rendered through the shared TldTable. The FAQ
   answers are ported verbatim from the static page, with its two internal
   links to domain-pricing.html / domain-transfer.html updated to
   <Link href="/domains/pricing">/<Link href="/domains/transfer">.
   ========================================================================== */

import type { Metadata } from "next";
import Link from "next/link";
import { getTlds } from "@/lib/content";
import Accordion, { type AccordionItem } from "@/components/Accordion/Accordion";
import TldTable from "@/components/TldTable/TldTable";
import PopularTldGrid from "./PopularTldGrid";
import Reveal from "@/components/Reveal/Reveal";
import styles from "./tld-extensions.module.css";

const DESCRIPTION =
  "Browse all available TLD extensions at KZD Solutions. Find the perfect domain extension for your website.";

export const metadata: Metadata = {
  title: "TLD Extensions",
  description: DESCRIPTION,
  alternates: { canonical: "/domains/tld-extensions" },
  openGraph: {
    type: "website",
    url: "/domains/tld-extensions",
    title: "TLD Extensions | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

const FAQ_ITEMS: AccordionItem[] = [
  {
    id: "tld-what",
    question: "What is a TLD?",
    answer:
      "A TLD (Top-Level Domain) is the last part of a domain name, like .com, .org, or .co.za. It helps categorize websites by purpose, location, or organization type.",
  },
  {
    id: "tld-which",
    question: "Which TLD should I choose?",
    answer:
      "Choose .com for global recognition, country TLDs like .co.za for local presence, or extensions like .africa or .joburg for regional relevance.",
  },
  {
    id: "tld-newer",
    question: "Are newer TLDs as good as traditional ones?",
    answer:
      "Yes, newer TLDs work just like traditional ones. They can be more memorable and relevant to your business. SEO-wise, Google treats all TLDs equally.",
  },
  {
    id: "tld-transfer",
    question: "Can I transfer my existing domain to KZD Solutions?",
    answer: (
      <>
        Yes. <Link href="/domains/pricing">See full transfer pricing</Link> or start your transfer
        on our <Link href="/domains/transfer">domain transfer page</Link>.
      </>
    ),
  },
  {
    id: "tld-privacy",
    question: "Do domain prices include privacy protection?",
    answer:
      "Yes, we include free WHOIS privacy protection with all eligible domain registrations to keep your personal information private.",
  },
];

export default function TldExtensionsPage() {
  const tlds = getTlds();
  const popular = tlds.filter((t) => t.popular);
  const saAndAfrican = tlds.filter((t) => t.category === "south-african" || t.category === "african");
  const globalAndBusiness = tlds.filter((t) => t.category === "global" || t.category === "business");

  return (
    <main className={styles.tld}>
      <section className={styles.hero}>
        <div className={styles.wash} aria-hidden="true" />
        <div className={styles.inner}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            TLD Extensions
          </span>
          <h1 className={styles.h1}>Browse All Domain Extensions</h1>
          <p className={styles.intro}>
            Browse our complete list of supported domain extensions and find the perfect one for
            your website.
          </p>
        </div>
      </section>

      <section className={styles.popular} aria-labelledby="tld-popular">
        <div className={styles.inner}>
          <h2 className={`${styles.h2} ${styles.h2Center}`} id="tld-popular">Popular TLDs</h2>
          <PopularTldGrid popular={popular} allTlds={tlds} />
        </div>
      </section>

      <section className={styles.tables}>
        <div className={styles.inner}>
          <Reveal className={styles.tableBlock}>
            <h2 className={styles.h2}>South African &amp; African TLDs</h2>
            <div className={styles.tableBody}>
              <TldTable rows={saAndAfrican} allTlds={tlds} variant="simple" />
            </div>
          </Reveal>

          <Reveal className={styles.tableBlock}>
            <h2 className={styles.h2}>Global &amp; Business TLDs</h2>
            <div className={styles.tableBody}>
              <TldTable rows={globalAndBusiness} allTlds={tlds} variant="simple" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className={styles.faq} aria-labelledby="tld-faq">
        <div className={styles.inner}>
          <h2 className={`${styles.h2} ${styles.h2Center}`} id="tld-faq">Frequently Asked Questions</h2>
          <Reveal className={styles.faqInner}>
            <Accordion items={FAQ_ITEMS} />
          </Reveal>
        </div>
      </section>
    </main>
  );
}

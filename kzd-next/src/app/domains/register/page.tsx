/* ==========================================================================
   /domains/register — ported from domain-register.html.

   A Server Component: the TLD catalog is read once here (getTlds/
   getTldCategoryLabels, see src/lib/content.ts) and handed down as a prop.
   The only client leaf is DomainSearchForm — the search box, popular-TLD
   chips and live suggestions. The features, cross-sell CTA and FAQ are
   plain server-rendered HTML, same split as /careers and /services.
   ========================================================================== */

import type { Metadata } from "next";
import Link from "next/link";
import { getTldCategoryLabels, getTlds } from "@/lib/content";
import Reveal from "@/components/Reveal/Reveal";
import Accordion, { type AccordionItem } from "@/components/Accordion/Accordion";
import DomainSearchForm from "./DomainSearchForm";
import styles from "./register.module.css";

const DESCRIPTION =
  "Register your perfect domain name with KZD Solutions. Find available domains and secure your online identity today.";

export const metadata: Metadata = {
  title: "Register a Domain",
  description: DESCRIPTION,
  alternates: { canonical: "/domains/register" },
  openGraph: {
    type: "website",
    url: "/domains/register",
    title: "Register a Domain | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

const FEATURES = [
  {
    title: "Free SSL Certificate",
    body: "Get a free SSL certificate with every domain to secure your website and build trust with visitors.",
  },
  {
    title: "Free Email Forwarding",
    body: "Set up email forwarding to direct emails from your domain to any existing email address.",
  },
  {
    title: "24/7 Support",
    body: "Our support team is available around the clock to help with domain management and troubleshooting.",
  },
  {
    title: "Fast Registration",
    body: "Most domains are registered and active within minutes of a successful order.",
  },
  {
    title: "Free DNS Management",
    body: "Manage your DNS records, nameservers, and domain forwarding from your client dashboard.",
  },
  {
    title: "Domain Lock",
    body: "Protect your domain from unauthorized transfers with one-click registrar locking.",
  },
];

const FAQ_ITEMS: AccordionItem[] = [
  {
    id: "reg-time",
    question: "How long does domain registration take?",
    answer:
      "Most domains are registered and active within minutes of a successful payment. Some country-code extensions may take slightly longer while WHOIS records propagate.",
  },
  {
    id: "reg-nameservers",
    question: "Can I use my own nameservers?",
    answer:
      "Yes. During checkout in your client portal you can choose to use your own nameservers instead of the KZD Solutions defaults.",
  },
  {
    id: "reg-manage",
    question: "How do I manage my domain after registering?",
    answer:
      "Every domain you register is manageable from your KZD Solutions client dashboard, where you can update nameservers, contact details, and renewal settings.",
  },
  {
    id: "reg-expiry",
    question: "What happens when my domain is about to expire?",
    answer:
      "You'll receive renewal reminders by email ahead of your expiry date, and can renew directly from your client dashboard.",
  },
];

export default function DomainRegisterPage() {
  const tlds = getTlds();
  const categoryLabels = getTldCategoryLabels();

  return (
    <main className={styles.reg}>
      <section className={styles.hero}>
        <div className={styles.wash} aria-hidden="true" />
        <div className={styles.inner}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Domains
          </span>
          <h1 className={styles.h1}>Find Your Perfect Domain</h1>
          <p className={styles.intro}>
            Secure your online identity with a memorable domain name. Search for a name and
            register it instantly through your KZD Solutions account.
          </p>
        </div>
      </section>

      <section className={styles.searchSection}>
        <div className={styles.inner}>
          <DomainSearchForm tlds={tlds} categoryLabels={categoryLabels} />
        </div>
      </section>

      <section className={styles.features} aria-labelledby="reg-why">
        <div className={styles.inner}>
          <h2 className={styles.h2} id="reg-why">Why register with KZD Solutions?</h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <Reveal className={styles.featureCard} key={feature.title}>
                <span className={styles.featureRule} aria-hidden="true" />
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureBody}>{feature.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.inner}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaText}>
              <h2 className={styles.ctaTitle}>Already have a domain to move?</h2>
              <p className={styles.ctaBody}>
                Transfer your existing domain to KZD Solutions and keep everything in one place.
              </p>
            </div>
            <div className={styles.ctaLinks}>
              <Link className={`${styles.ctaLink} ${styles.ctaLinkPrimary}`} href="/domains/transfer">
                Transfer a domain
              </Link>
              <Link className={`${styles.ctaLink} ${styles.ctaLinkGhost}`} href="/domains/pricing">
                View full pricing
              </Link>
              <Link className={`${styles.ctaLink} ${styles.ctaLinkGhost}`} href="/domains/tld-extensions">
                Browse all TLDs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faq} aria-labelledby="reg-faq">
        <div className={styles.inner}>
          <h2 className={styles.h2} id="reg-faq">Frequently Asked Questions</h2>
          <div className={styles.faqInner}>
            <Accordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>
    </main>
  );
}

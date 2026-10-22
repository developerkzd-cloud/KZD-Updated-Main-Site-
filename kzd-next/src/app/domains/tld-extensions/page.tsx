/* ==========================================================================
   /domains/tld-extensions — in the KZD homepage design (components/KzdHome):
   the popular extensions as the Domains tab's cards, then the full catalog
   in two groups (South African & African, Global & Business), then the
   FAQ. Copy and FAQ answers unchanged from the port of tld-extensions.html.
   ========================================================================== */

import type { Metadata } from "next";
import Link from "next/link";
import { getTlds } from "@/lib/content";
import TldPriceTable from "@/components/KzdHome/TldPriceTable";
import { FaqSection, KzdHome, PanelSection, TldCards, type FaqItem } from "@/components/KzdHome/sections";

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

const link = { textDecoration: "underline" } as const;

const FAQ_ITEMS: FaqItem[] = [
  { q: "What is a TLD?", a: "A TLD (Top-Level Domain) is the last part of a domain name, like .com, .org, or .co.za. It helps categorize websites by purpose, location, or organization type." },
  { q: "Which TLD should I choose?", a: "Choose .com for global recognition, country TLDs like .co.za for local presence, or extensions like .africa or .joburg for regional relevance." },
  { q: "Are newer TLDs as good as traditional ones?", a: "Yes, newer TLDs work just like traditional ones. They can be more memorable and relevant to your business. SEO-wise, Google treats all TLDs equally." },
  {
    q: "Can I transfer my existing domain to KZD Solutions?",
    a: (
      <>
        Yes. <Link href="/domains/pricing" style={link}>See full transfer pricing</Link> or start your transfer on our{" "}
        <Link href="/domains/transfer" style={link}>domain transfer page</Link>.
      </>
    ),
  },
  { q: "Do domain prices include privacy protection?", a: "Yes, we include free WHOIS privacy protection with all eligible domain registrations to keep your personal information private." },
];

export default function TldExtensionsPage() {
  const tlds = getTlds();
  const popular = tlds.filter((t) => t.popular);
  const saAndAfrican = tlds.filter((t) => t.category === "south-african" || t.category === "african");
  const globalAndBusiness = tlds.filter((t) => t.category === "global" || t.category === "business");

  return (
    <KzdHome after={<FaqSection items={FAQ_ITEMS} />}>
      <PanelSection
        as="h1"
        eyebrow="TLD Extensions"
        title="Browse All Domain Extensions"
        lede="Browse our complete list of supported domain extensions and find the perfect one for your website."
      >
        <TldCards tlds={popular} />
      </PanelSection>
      <PanelSection eyebrow="South Africa & Africa" title="South African & African TLDs">
        <TldPriceTable tlds={saAndAfrican} showTransfer={false} />
      </PanelSection>
      <PanelSection eyebrow="Global & Business" title="Global & Business TLDs">
        <TldPriceTable tlds={globalAndBusiness} showTransfer={false} />
      </PanelSection>
    </KzdHome>
  );
}

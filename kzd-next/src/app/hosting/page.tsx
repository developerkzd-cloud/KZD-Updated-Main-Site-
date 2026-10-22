/* ==========================================================================
   /hosting — the KZD homepage design from FOSSBilling's kzd theme, opened
   on its Shared Hosting tab: Plans & pricing (Domains / Business Email /
   Shared Hosting), the hosting tier cards, why KZD and the FAQ. Every
   "Get started" goes to the FOSSBilling order form for that product.
   See components/KzdHome/sections.tsx.
   ========================================================================== */

import type { Metadata } from "next";
import { getTlds } from "@/lib/content";
import { FaqSection, KzdHome, PricingTabs, TierPlans, WhySection } from "@/components/KzdHome/sections";
import { FAQ_ITEMS } from "./content";

const DESCRIPTION =
  "Reliable web hosting from KZD Solutions in Durban. Fast, secure shared hosting plans with SSL, backups, and local support built for growing businesses.";

export const metadata: Metadata = {
  title: "Web Hosting",
  description: DESCRIPTION,
  alternates: { canonical: "/hosting" },
  openGraph: {
    type: "website",
    url: "/hosting",
    title: "Web Hosting | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

export default function HostingPage() {
  const faq = FAQ_ITEMS.map((item) => ({ q: item.question, a: item.answer }));
  return (
    <KzdHome after={<FaqSection items={faq} />}>
      <PricingTabs tlds={getTlds()} initial="cat-hosting" />
      <TierPlans />
      <WhySection />
    </KzdHome>
  );
}

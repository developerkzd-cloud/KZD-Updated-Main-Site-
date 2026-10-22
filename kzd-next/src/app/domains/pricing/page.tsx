/* ==========================================================================
   /domains/pricing — in the KZD homepage design (components/KzdHome):
   every extension's register / transfer / renew price in one filterable
   list, each row handing off to FOSSBilling's domain order form.
   ========================================================================== */

import type { Metadata } from "next";
import { getTlds } from "@/lib/content";
import TldPriceTable from "@/components/KzdHome/TldPriceTable";
import { FaqSection, KzdHome, PanelSection } from "@/components/KzdHome/sections";

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
  return (
    <KzdHome after={<FaqSection />}>
      <PanelSection
        as="h1"
        eyebrow="Domain Pricing"
        title="No Hidden Fees"
        lede="See exactly what you'll pay to register, renew or transfer. Every extension we sell, in one table."
      >
        <TldPriceTable tlds={getTlds()} searchable />
      </PanelSection>
    </KzdHome>
  );
}

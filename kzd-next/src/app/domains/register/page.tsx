/* ==========================================================================
   /domains/register — the KZD homepage design from FOSSBilling's kzd
   theme, opened on its Domains tab: one-field domain search (split into
   FOSSBilling's register_sld / register_tld) and the extension cards, then
   the domain FAQ. See components/KzdHome/sections.tsx.
   ========================================================================== */

import type { Metadata } from "next";
import { getTlds } from "@/lib/content";
import { FaqSection, KzdHome, PricingTabs } from "@/components/KzdHome/sections";

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

export default function RegisterDomainPage() {
  return (
    <KzdHome after={<FaqSection />}>
      <PricingTabs tlds={getTlds()} initial="tlds" />
    </KzdHome>
  );
}

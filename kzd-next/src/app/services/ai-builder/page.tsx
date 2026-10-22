/* ==========================================================================
   /services/ai-builder — the KZD homepage design from FOSSBilling's kzd
   theme: the AI builder hero (its prompt posts straight into the real
   builder at /build), the generated-site strip, how it works, the hosting
   plans, why KZD and the FAQ. See components/KzdHome/sections.tsx.
   ========================================================================== */

import type { Metadata } from "next";
import { BuilderHero, FaqSection, KzdHome, StepsSection, TemplatesStrip, TierPlans, WhySection } from "@/components/KzdHome/sections";

const DESCRIPTION =
  "Describe your business and KZD Solutions' AI builds a complete website for you -- real copy, real photography, live in minutes. Free to try, you only pay if you host it with us.";

export const metadata: Metadata = {
  title: "AI Website Builder",
  description: DESCRIPTION,
  alternates: { canonical: "/services/ai-builder" },
  openGraph: {
    type: "website",
    url: "/services/ai-builder",
    title: "AI Website Builder | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

export default function AiBuilderPage() {
  return (
    <KzdHome after={<FaqSection />}>
      <BuilderHero />
      <TemplatesStrip />
      <StepsSection />
      <TierPlans />
      <WhySection />
    </KzdHome>
  );
}

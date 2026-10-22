/* ==========================================================================
   /services/[slug] — for now, only the three coming-soon services
   (AI Builder, Telecommunications, Accounting & Business Compliance).
   Any other slug 404s until its real service page is built.
   ========================================================================== */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceComingSoon from "@/components/ServiceComingSoon/ServiceComingSoon";
import { COMING_SOON, COMING_SOON_SERVICE_SLUGS } from "@/lib/comingSoon";

export const dynamicParams = false;

export function generateStaticParams() {
  return COMING_SOON_SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = COMING_SOON[slug];
  if (!page) return {};
  return {
    title: `${page.title} | Coming soon`,
    description: `${page.sub} Coming soon from KZD Solutions.`,
    alternates: { canonical: `/services/${slug}` },
  };
}

export default async function Page({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const page = COMING_SOON[slug];
  if (!page || !COMING_SOON_SERVICE_SLUGS.includes(slug)) notFound();
  return <ServiceComingSoon page={page} />;
}

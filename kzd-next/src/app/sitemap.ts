import type { MetadataRoute } from "next";
import { getJobs } from "@/lib/content";
import { COMING_SOON_SERVICE_SLUGS } from "@/lib/comingSoon";

/* /sitemap.xml: every public page. Built pages first, then the jobs, then
   the coming-soon placeholders (lower priority until they are rebuilt). */
const SITE = "https://kzdsolutions.co.za";

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: SITE + path,
    changeFrequency: "monthly",
    priority,
  });

  return [
    page("/", 1),
    page("/services", 0.9),
    page("/contact", 0.8),
    page("/careers", 0.7),
    page("/accounting", 0.6),
    ...getJobs().map((j) => page(`/careers/${j.id}`, 0.5)),
    ...COMING_SOON_SERVICE_SLUGS.map((slug) => page(`/services/${slug}`, 0.4)),
    ...["/hosting", "/domains/register", "/domains/transfer", "/domains/pricing", "/domains/tld-extensions", "/cloud", "/vps-hosting", "/wordpress", "/blog"].map(
      (p) => page(p, 0.3)
    ),
  ];
}

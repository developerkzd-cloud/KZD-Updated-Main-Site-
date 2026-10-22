import type { MetadataRoute } from "next";

/* /robots.txt: everything is crawlable except the signed-in profile, the
   API routes, the offline fallback and the internal token preview. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/profile", "/dev/", "/offline"] },
    sitemap: "https://kzdsolutions.co.za/sitemap.xml",
  };
}

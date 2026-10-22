/* ==========================================================================
   Coming-soon pages — the one list, shared by the pages themselves, the nav
   (dark bar + active underline) and the layout (which swaps the full footer
   for the page's own slim bottom bar). Penpot: "Coming soon — <name>".

   `index` is the faint giant number behind the headline: the service's place
   in the Services list (03 / 04 / 05 / 06), or the nav position for Hosting and
   Domains (03 / 04, matching the mobile menu's numbering). The blog follows
   the six services as 07.
   ========================================================================== */

export type ComingSoonPage = {
  key: string;
  index: string;
  title: string;
  sub: string;
};

export const COMING_SOON: Record<string, ComingSoonPage> = {
  "ai-builder": {
    key: "ai-builder",
    index: "03",
    title: "AI Builder",
    sub: "Build apps and automations with AI.",
  },
  "it-support": {
    key: "it-support",
    index: "04",
    title: "IT Support & Maintenance",
    sub: "Microsoft 365, smartphone and laptop repair, and support that keeps you running.",
  },
  telecommunications: {
    key: "telecommunications",
    index: "05",
    title: "Telecommunications",
    sub: "Voice, data and connectivity for your business.",
  },
  "accounting-compliance": {
    key: "accounting-compliance",
    index: "06",
    title: "Accounting & Business Compliance",
    sub: "Bookkeeping, tax and business compliance, handled for you.",
  },
  hosting: {
    key: "hosting",
    index: "03",
    title: "Hosting",
    sub: "Fast, secure hosting for South African businesses.",
  },
  domains: {
    key: "domains",
    index: "04",
    title: "Domains",
    sub: "Register, transfer and manage your domain names.",
  },
  blog: {
    key: "blog",
    index: "07",
    title: "Blog",
    sub: "Case studies, guides and news from the KZD team.",
  },
};

/** Service slugs whose /services/<slug> page is a coming-soon page. */
export const COMING_SOON_SERVICE_SLUGS = ["it-support", "telecommunications", "accounting-compliance"];

/** True for every route rendered with the coming-soon template.
    /hosting, /domains* and /services/ai-builder were un-parked (real pages
    restored from git history / built against the live AI builder) and must
    NOT be listed here any more -- doing so silently forces the dark
    coming-soon nav and hides the real footer on an otherwise-real page. */
export function isComingSoonPath(pathname: string): boolean {
  if (pathname === "/blog" || pathname.startsWith("/blog/")) return true;
  return COMING_SOON_SERVICE_SLUGS.some((slug) => pathname === `/services/${slug}`);
}

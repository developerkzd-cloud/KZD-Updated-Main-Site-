/* ==========================================================================
   Services — the one list of six, reused by the nav dropdown, the mobile
   drawer's Services accordion, the homepage Services row list, and (later)
   the /services page and each /services/[slug] page.

   Order and which three are "coming soon" are confirmed against Penpot's
   "Nav — Services dropdown (desktop)" board (its Item 01-06, with a "Soon"
   marker on 03/05/06; IT Support, 04, has since joined them). Descriptions match the dropdown's
   Penpot screenshot.
   ========================================================================== */

import type { IconName } from "@/components/Icon/glyphs";

export type Service = {
  slug: string;
  name: string;
  tag: string;
  /** Short line in the nav dropdown. */
  description: string;
  /** Slightly longer line in the homepage "What we do" list. */
  listLine: string;
  /** The homepage preview card copy and icon. */
  blurb: string;
  icon: IconName;
  comingSoon?: boolean;
  /** Overrides the default link from serviceHref(). */
  href?: string;
};

export const SERVICES: Service[] = [
  {
    slug: "website-development",
    name: "Website Development",
    tag: "Build",
    description: "Websites that look sharp and convert",
    listLine: "Websites that look sharp and convert",
    blurb: "Fast, modern websites designed to look sharp, load quickly and turn visitors into customers.",
    icon: "laptop",
  },
  {
    slug: "software",
    name: "Software: Mobile & Web Apps",
    tag: "Build",
    description: "Custom applications for your business",
    listLine: "Custom mobile and web applications for your business",
    blurb: "Mobile and web applications, custom-built to fit the way your business actually runs.",
    icon: "code-slash",
  },
  {
    slug: "ai-builder",
    name: "AI Builder",
    tag: "Launch",
    description: "Build your website with AI, free",
    listLine: "Describe your business and get a real website in minutes",
    blurb: "Describe your business and our AI writes the copy, picks real photography, and builds a full website — free to try, you only pay if you host it with us.",
    icon: "robot",
    href: "/services/ai-builder",
  },
  {
    slug: "it-support",
    name: "IT Support & Maintenance",
    tag: "Support",
    description: "Microsoft 365, smartphone & laptop repair",
    listLine: "Microsoft 365, smartphone and laptop repair",
    blurb: "Microsoft 365 set up properly, devices repaired and support that keeps your team running.",
    icon: "headset",
    comingSoon: true,
  },
  {
    slug: "telecommunications",
    name: "Telecommunications",
    tag: "Connect",
    description: "Voice, data and connectivity",
    listLine: "Voice, data and connectivity for your business",
    blurb: "Business voice, data and connectivity, set up and managed for you.",
    icon: "telephone",
    comingSoon: true,
  },
  {
    slug: "accounting-compliance",
    name: "Accounting & Business Compliance",
    tag: "Comply",
    description: "Bookkeeping, tax and compliance",
    listLine: "Bookkeeping, tax and business compliance",
    blurb: "Bookkeeping, tax and compliance handled, so you can focus on running the business.",
    icon: "calculator",
    comingSoon: true,
  },
];

export const SERVICE_BY_SLUG: Record<string, Service> = Object.fromEntries(
  SERVICES.map((s) => [s.slug, s])
);

/** Where a service links to. Coming-soon services have their own page;
    the two live ones open the Development tab on /services until their
    dedicated pages are built (a /services/<slug> link would 404). */
export function serviceHref(s: Service): string {
  if (s.href) return s.href;
  return s.comingSoon ? `/services/${s.slug}` : "/services#development";
}

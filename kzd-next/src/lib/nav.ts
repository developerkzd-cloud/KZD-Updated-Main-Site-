import type { IconName } from "@/components/Icon/Icon";
/* ==========================================================================
   Navigation data — one source for the desktop nav, the Services mega panel
   and the mobile drawer.

   The static site duplicated this markup 18 times, once per HTML file, which
   is why adding "Blog" to the footer earlier meant editing 18 files and why
   removing "About" meant editing 17. Here it is a single array.

   About is deliberately absent: about.html was removed in Phase 2 and its
   content now lives in the homepage About section at /#about.
   ========================================================================== */

export type NavLink = {
  label: string;
  href: string;
};

export type NavGroup = {
  heading: string;
  links: NavLink[];
};

export type NavItem = NavLink & {
  /** Present only on Services, which opens the mega panel. */
  groups?: NavGroup[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Services",
    href: "/services",
    groups: [
      {
        heading: "What we do",
        links: [
          { label: "Consulting", href: "/services#consulting" },
          { label: "Development", href: "/services#development" },
          { label: "Accounting", href: "/accounting" },
        ],
      },
      {
        heading: "Web hosting",
        links: [
          { label: "Web Hosting", href: "/hosting" },
          { label: "Cloud Hosting", href: "/cloud" },
          { label: "VPS Hosting", href: "/vps-hosting" },
          { label: "WordPress Hosting", href: "/wordpress" },
        ],
      },
      {
        heading: "Domains",
        links: [
          { label: "Register Domain", href: "/domains/register" },
          { label: "Transfer Domain", href: "/domains/transfer" },
          { label: "Domain Pricing", href: "/domains/pricing" },
          { label: "TLD Extensions", href: "/domains/tld-extensions" },
        ],
      },
    ],
  },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

/** Account actions. Separate from navigation: these are verbs, not places. */
export const AUTH_LINKS: NavLink[] = [
  { label: "Login", href: "https://my.kzdsolutions.co.za/login" },
  { label: "Register", href: "https://my.kzdsolutions.co.za/signup" },
];

/* --------------------------------------------------------------------------
   Footer
   -------------------------------------------------------------------------- */

export const FOOTER_COMPANY: (NavLink & { hot?: boolean })[] = [
  { label: "Our services", href: "/services", hot: true },
  { label: "Our products", href: "/services" },
  { label: "Careers", href: "/careers" },
  { label: "Blog", href: "/blog" },
  { label: "Contact us", href: "/contact" },
];

export const FOOTER_SERVICES: NavLink[] = [
  { label: "Consulting", href: "/services#consulting" },
  { label: "Development", href: "/services#development" },
  { label: "Automation", href: "/services" },
  { label: "Web Design", href: "/services" },
];

export const CONTACT = {
  email: "info@kzdsolutions.co.za",
  phoneHref: "tel:+27310053129",
  phoneLabel: "(031) 005 3129",
  location: "Durban, South Africa",
  tagline: "Gearing your company through an innovative strategy.",
};

export type Social = { name: string; href: string; icon: IconName; wide?: boolean };

/* Glyphs come from the shared Bootstrap Icons set (components/Icon), inlined,
   never hotlinked: an external logo URL can move or vanish, costs a
   third-party request on every page load, and can trip CORS. */
export const SOCIALS: Social[] = [
  {
    name: "Facebook",
    href: "https://web.facebook.com/profile.php?id=61572728398709",
    icon: "facebook",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/kzd-solutions/?viewAsMember=true",
    icon: "linkedin",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/27704563015",
    wide: true,
    icon: "whatsapp",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/kzdsolutions96",
    icon: "instagram",
  },
];

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

export type Social = { name: string; href: string; path: string; wide?: boolean };

/* Inline paths, never hotlinked marks. An external logo URL can move or vanish,
   costs a third-party request on every page load, and can trip CORS. */
export const SOCIALS: Social[] = [
  {
    name: "Facebook",
    href: "https://web.facebook.com/profile.php?id=61572728398709",
    path: "M15.12 5.32H17V2.14A26.11 26.11 0 0 0 14.26 2C11.54 2 9.68 3.66 9.68 6.7v2.62H6.61v3.56h3.07V22h3.68v-9.12h3.06l.46-3.56h-3.52V7.05c0-1.03.29-1.73 1.76-1.73Z",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/kzd-solutions/?viewAsMember=true",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/27704563015",
    wide: true,
    path: "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.03 1.02-1.03 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.43 9.89-9.88 9.89m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.42Z",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/kzdsolutions96",
    path: "M12 0C8.74 0 8.33.02 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.02 8.33 0 8.74 0 12s.02 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.67 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.02 4.95-.07c1.28-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.67-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.02-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.94 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 2.16c3.2 0 3.58.02 4.85.07 1.17.06 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.06 1.17-.26 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.07.36-2.24.41-1.27.06-1.65.07-4.86.07s-3.59-.01-4.86-.07c-1.17-.06-1.82-.26-2.24-.42-.57-.22-.96-.48-1.38-.9-.42-.42-.69-.82-.9-1.38-.16-.42-.36-1.07-.42-2.24-.04-1.26-.06-1.65-.06-4.84s.02-3.59.06-4.86c.06-1.17.26-1.81.42-2.23.21-.57.48-.96.9-1.38.42-.42.81-.69 1.38-.9.42-.17 1.05-.36 2.22-.42 1.27-.05 1.65-.06 4.86-.06L12 2.16zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z",
  },
];

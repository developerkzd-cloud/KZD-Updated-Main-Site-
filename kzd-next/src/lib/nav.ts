import type { SocialLink } from "@/components/SocialIcons/SocialIcons";
import { FOSSBILLING_ORIGIN } from "./kzd-integration";
export type { SocialLink };
/* ==========================================================================
   Navigation data — one source for the desktop nav and the mobile drawer.

   REDESIGN CHANGE (confirmed against Penpot's Homepage — Revamped Hero and
   the Coming Soon boards, whose Nav > NavLinks reads: Home, Services,
   Hosting, Domains, Contact): the primary nav is now five flat items, not
   four with Services carrying three nested groups. Hosting and Domains used
   to live inside the Services mega-panel's sub-groups; they are now their
   own top-level links, and Services is a single dropdown of six individual
   services (src/lib/services.ts), not three category groups.

   Careers is no longer in the primary nav in the new design — it isn't in
   either confirmed board's NavLinks. It's still a real page (its own
   Penpot board exists and is still being built), just not linked from here
   any more; it stays linked from the footer.
   ========================================================================== */

export type NavLink = {
  label: string;
  href: string;
};

/** The five flat items. "Services" is rendered specially (ServicesDropdown),
    everything else is a plain link. */
export const NAV_ITEMS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Hosting", href: "/hosting" },
  /* No single Penpot-confirmed landing page for "Domains" as one nav click
     target (register/transfer/pricing/tld-extensions are all separate
     pages) — pointed at Register as the most common entry point. */
  { label: "Domains", href: "/domains/register" },
  { label: "Contact", href: "/contact" },
];

/** Account actions. Separate from navigation: these are verbs, not places.
    They live in FOSSBilling, so they follow FOSSBILLING_ORIGIN like every
    other hand-off (local FOSSBilling in dev, see .env.local). */
export const AUTH_LINKS: NavLink[] = [
  { label: "Login", href: `${FOSSBILLING_ORIGIN}/login` },
  { label: "Register", href: `${FOSSBILLING_ORIGIN}/signup` },
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

export const CONTACT = {
  email: "info@kzdsolutions.co.za",
  phoneHref: "tel:+27310053129",
  phoneLabel: "(031) 005 3129",
  location: "Durban, South Africa",
  tagline: "From big problems to simple solutions.",
};

/* Glyphs come from the shared Bootstrap Icons set (components/Icon), inlined,
   never hotlinked: an external logo URL can move or vanish, costs a
   third-party request on every page load, and can trip CORS. */
export const SOCIALS: SocialLink[] = [
  { name: "Instagram", href: "https://www.instagram.com/kzdsolutions96", icon: "instagram" },
  { name: "Facebook", href: "https://web.facebook.com/profile.php?id=61572728398709", icon: "facebook" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/kzd-solutions/?viewAsMember=true", icon: "linkedin" },
  { name: "TikTok", href: "https://www.tiktok.com/@kzdsolutions", icon: "tiktok" },
];

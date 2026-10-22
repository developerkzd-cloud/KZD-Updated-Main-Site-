/* ==========================================================================
   SocialIcons — Instagram, Facebook, LinkedIn, TikTok.

   Reuses the site's one existing icon system (components/Icon, Bootstrap
   Icons inlined) rather than starting a second, parallel icon source —
   "tiktok" was added to its glyph set for this redesign. Real brand marks,
   never hotlinked.

   The actual destination URLs are not yet final (see src/lib/nav.ts's
   SOCIALS array, which already has Facebook/LinkedIn/Instagram placeholder
   hrefs from before this redesign, plus WhatsApp, which the new system
   doesn't call for). This component takes its own `links` so the page
   wiring it up controls exactly which four show and where they point —
   list the real profile URLs when the footer is wired up (Prompt 6).
   ========================================================================== */

import Icon, { type IconName } from "@/components/Icon/Icon";
import styles from "./SocialIcons.module.css";

export type SocialLink = {
  name: "Instagram" | "Facebook" | "LinkedIn" | "TikTok";
  href: string;
  icon: IconName;
};

export default function SocialIcons({
  links,
  className,
}: {
  links: SocialLink[];
  className?: string;
}) {
  return (
    <ul className={[styles.list, className].filter(Boolean).join(" ")}>
      {links.map((s) => (
        <li key={s.name}>
          <a
            className={styles.link}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`KZD Solutions on ${s.name}`}
          >
            <Icon name={s.icon} size="dense" />
          </a>
        </li>
      ))}
    </ul>
  );
}

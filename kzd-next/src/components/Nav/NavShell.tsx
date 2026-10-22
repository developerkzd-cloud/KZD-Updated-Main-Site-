"use client";

/* ==========================================================================
   NavShell — the <header> box, and the only part of the nav that needs the
   client.

   The static site ran an inline script on every page that swapped the logo
   and wordmark between white and black depending on scrollY (and forced
   black under the lg breakpoint). That exists because the homepage hero is a
   dark full-bleed photo the bar sits on top of: transparent with white text
   at the top of the page, solid once you scroll past the hero.

   Nav.module.css already carried every `.header.transparent` rule for this;
   nothing had ever driven the prop. This does, from two inputs:
     - the route, because only the homepage has a dark hero to sit on
     - scrollY, past which the bar goes solid

   The links stay server-rendered: Nav passes them through as `children`, the
   same technique JobTabs uses to keep a job description in the HTML while
   the tab strip is interactive.
   ========================================================================== */

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { isComingSoonPath } from "@/lib/comingSoon";
import styles from "./Nav.module.css";

/* Matches the static site's `window.scrollY > 50`. */
const SOLID_AFTER_PX = 50;

export default function NavShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  /* Pages that open on a full-bleed dark photo hero. */
  const overHero = pathname === "/" || pathname === "/services" || pathname === "/contact" || pathname === "/careers";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overHero) return;

    const onScroll = () => setScrolled(window.scrollY > SOLID_AFTER_PX);
    /* Catches a load that is already scrolled (a refresh mid-page, or a
       restored scroll position). Deferred a frame rather than called here,
       because setState straight from an effect body is what
       react-hooks/set-state-in-effect rejects. */
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [overHero]);

  /* The black coming-soon pages: white text at all times, over a dark bar
     with a hairline, never the white bar. */
  const dark = isComingSoonPath(pathname);
  const transparent = dark || (overHero && !scrolled);

  return (
    <header className={`${styles.header} ${transparent ? styles.transparent : ""} ${dark ? styles.dark : ""}`}>
      <div className={styles.inner}>{children}</div>
    </header>
  );
}

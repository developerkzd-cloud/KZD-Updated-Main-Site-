/* ==========================================================================
   ServiceComingSoon — the black coming-soon page (Penpot "Coming soon —
   AI Builder / Telecommunications / Accounting & Business Compliance", and
   reused for Hosting and Domains).

   #0F0F0F and white only. "COMING SOON" eyebrow between hairline rules, the
   headline and subline reveal on the 80ms stagger, the faint index number
   drifts slowly (desktop only, 20px), Notify me posts to /api/notify, and
   "Meanwhile, explore" links to the three live services. The page carries
   its own slim bottom bar; the layout drops the full footer on these routes.

   Headline size is derived from the text so every title fits one line on
   desktop and its longest word fits on a phone (--chars / --longest).
   ========================================================================== */

import Link from "next/link";
import type { CSSProperties } from "react";
import Reveal from "@/components/Reveal/Reveal";
import Icon from "@/components/Icon/Icon";
import { SERVICES } from "@/lib/services";
import type { ComingSoonPage } from "@/lib/comingSoon";
import NotifyForm from "./NotifyForm";
import styles from "./ServiceComingSoon.module.css";

const LIVE = SERVICES.filter((s) => !s.comingSoon);

export default function ServiceComingSoon({ page }: { page: ComingSoonPage }) {
  const year = new Date().getFullYear();
  const longest = Math.max(...page.title.split(/\s+/).map((w) => w.length));
  const titleVars = { "--chars": page.title.length, "--longest": longest } as CSSProperties;

  return (
    <main className={styles.page} data-hero-full>
      <div className={styles.grid} aria-hidden="true" />
      <span className={styles.index} aria-hidden="true">
        {page.index}
      </span>

      <section className={styles.hero} aria-labelledby="coming-soon-title">
        <Reveal style={{ "--d": 0 } as CSSProperties}>
          <p className={styles.eyebrow}>
            <span className={styles.rule} aria-hidden="true" />
            Coming soon
            <span className={styles.rule} aria-hidden="true" />
          </p>
        </Reveal>

        <Reveal style={{ "--d": 1 } as CSSProperties}>
          <h1 className={styles.title} id="coming-soon-title" style={titleVars}>
            {page.title}
          </h1>
        </Reveal>

        <Reveal style={{ "--d": 2 } as CSSProperties}>
          <p className={styles.sub}>{page.sub}</p>
        </Reveal>

        <Reveal style={{ "--d": 3 } as CSSProperties} className={styles.formWrap}>
          <NotifyForm topic={page.key} />
        </Reveal>

        <Reveal style={{ "--d": 4 } as CSSProperties} className={styles.explore}>
          <p className={styles.exploreLabel}>Meanwhile, explore</p>
          <ul className={styles.chips}>
            {LIVE.map((s) => (
              <li key={s.slug}>
                <Link className={styles.chip} href="/services">
                  {s.name}
                  <Icon name="arrow-up-right" size="dense" />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <footer className={styles.bar}>
        <p>&copy; {year} KZD Solutions. All rights reserved.</p>
        <p className={styles.legal}>
          <span>Privacy Policy</span>
          <span aria-hidden="true">·</span>
          <span>Terms of Service</span>
        </p>
      </footer>
    </main>
  );
}

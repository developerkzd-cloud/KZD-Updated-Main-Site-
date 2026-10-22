/* ==========================================================================
   /dev/tokens — internal preview of the new token layer and base
   components (Prompt 1 only). Not a real page: noindex'd, and flagged
   visibly on the page itself. Safe to leave in place (harmless, dev-only)
   or delete once the redesign is further along — it isn't linked from
   anywhere.
   ========================================================================== */

import type { Metadata } from "next";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import Button from "@/components/Button/Button";
import Eyebrow from "@/components/Eyebrow/Eyebrow";
import GoogleRatingCard from "@/components/GoogleRatingCard/GoogleRatingCard";
import Hero from "@/components/Hero/Hero";
import SectionContainer from "@/components/SectionContainer/SectionContainer";
import SocialIcons from "@/components/SocialIcons/SocialIcons";
import Stars from "@/components/Stars/Stars";
import styles from "./page.module.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const SWATCHES = [
  ["--color-white", "#FFFFFF"],
  ["--color-surface", "#F4F5F7"],
  ["--color-border", "#D9D9D9"],
  ["--color-muted", "#A7A7A7"],
  ["--color-secondary", "#6B6B6B"],
  ["--color-strong", "#3A3A3A"],
  ["--color-ink", "#1A1A1A"],
  ["--color-black", "#000000"],
  ["--color-gold", "#F5B301"],
  ["--color-accent", "#F0A81C"],
] as const;

export default function TokensPreviewPage() {
  return (
    <main className={styles.page}>
      <p className={styles.banner}>
        Internal — design-token &amp; base-component preview. Not a real page.
      </p>

      <SectionContainer>
        <h1>Prompt 1 — tokens &amp; base components</h1>

        <h2>Colour</h2>
        <div className={styles.swatchRow}>
          {SWATCHES.map(([name, hex]) => (
            <div key={name} className={styles.swatch}>
              <span className={styles.swatchFill} style={{ background: `var(${name})` }} />
              <code>{name}</code>
              <code>{hex}</code>
            </div>
          ))}
        </div>

        <h2>Eyebrow</h2>
        <Eyebrow>About us</Eyebrow>
        <div style={{ marginTop: 16, maxWidth: 420 }}>
          <Eyebrow withRules>Coming soon</Eyebrow>
        </div>

        <h2>Buttons</h2>
        <div className={styles.row}>
          <Button variant="primary" icon="right">
            Contact us
          </Button>
          <Button variant="secondary" icon="right">
            Learn more
          </Button>
          <Button variant="primary" href="https://example.com" external>
            External link
          </Button>
        </div>
        <div className={[styles.row, styles.onDark].join(" ")}>
          <Button variant="light" frosted icon="right">
            Contact us
          </Button>
          <Button variant="secondary">Build your website with AI</Button>
        </div>

        <h2>ArrowIcon rotations</h2>
        <div className={styles.row} style={{ fontSize: 28 }}>
          <ArrowIcon direction="right" />
          <ArrowIcon direction="up-right" />
          <ArrowIcon direction="down" />
          <ArrowIcon direction="back" />
        </div>

        <h2>Stars</h2>
        <div className={styles.row}>
          <Stars rating={5} />
          <Stars rating={4} />
          <Stars rating={3.6} />
        </div>

        <h2>GoogleRatingCard</h2>
        <GoogleRatingCard rating={4.9} />

        <h2>SocialIcons</h2>
        <div style={{ color: "var(--color-ink)" }}>
          <SocialIcons
            links={[
              { name: "Instagram", href: "#", icon: "instagram" },
              { name: "Facebook", href: "#", icon: "facebook" },
              { name: "LinkedIn", href: "#", icon: "linkedin" },
              { name: "TikTok", href: "#", icon: "tiktok" },
            ]}
          />
        </div>
      </SectionContainer>

      <h2 className={styles.heroLabel}>Hero (full-bleed image + overlay)</h2>
      <Hero src="/images/about.jpg" alt="" fullHeight={false} minHeight="420px">
        <SectionContainer>
          {/* The confirmed Hero eyebrow recipe (bold, 13px, white) differs
              from the base Eyebrow component's light-background default
              (--color-secondary, 12px) — styled inline here to preview it
              accurately; Prompt 3 decides how this is actually composed. */}
          <p className={styles.heroEyebrow}>Grow your business with us</p>
          <h2 className={styles.heroHeadline}>Welcome to KZD Solutions</h2>
          <p className={styles.heroLead}>Placeholder hero image — swapped for the real photo in Prompt 3.</p>
          <div className={styles.row} style={{ marginTop: 24 }}>
            <Button variant="light" frosted icon="right">
              Contact us
            </Button>
            <Button variant="secondary">Build your website with AI</Button>
          </div>
        </SectionContainer>
      </Hero>
    </main>
  );
}

/* ==========================================================================
   ComingSoonProduct — shared template for /cloud, /wordpress, /vps-hosting.

   The three legacy pages (cloud.html, wordpress.html, VpsHosting.html) were
   structurally identical: a hero, then one "coming soon" panel with three
   CTAs (shared hosting / domains / talk to sales). Only the title, hero
   image and copy differ, so those are the only inputs a page needs to give.

   Server Component — nothing here is interactive.
   ========================================================================== */

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal/Reveal";
import styles from "./ComingSoonProduct.module.css";

export default function ComingSoonProduct({
  eyebrow,
  title,
  heroImage,
  heroAlt,
  bodyTitle,
  body,
}: {
  eyebrow: string;
  title: string;
  heroImage: string;
  heroAlt: string;
  bodyTitle: string;
  body: string;
}) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image src={heroImage} alt={heroAlt} fill sizes="100vw" priority fetchPriority="high" className={styles.heroImg} />
          <div className={styles.heroWash} aria-hidden="true" />
        </div>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1 className={styles.h1}>{title}</h1>
        </div>
      </section>

      <section className={styles.soonSection}>
        <Reveal className={styles.soonCard}>
          <span className={styles.badge}>Coming soon</span>
          <h2 className={styles.soonTitle}>{bodyTitle}</h2>
          <p className={styles.soonBody}>{body}</p>
          <div className={styles.ctas}>
            <Link className={styles.ctaPrimary} href="/hosting">Explore Shared Hosting</Link>
            <Link className={styles.ctaSecondary} href="/domains/register">Browse Domains</Link>
            <Link className={styles.ctaSecondary} href="/contact">Talk to Sales</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

/* ==========================================================================
   / — the homepage, built to Penpot "Homepage — Revamped" and "Mobile — Home".

   Sections: Hero, About, What we do (WhatWeDo), Testimonials
   (TestimonialsCarousel), Our clients (ClientsCarousel). A Server Component;
   the interactive pieces are small client leaves (Reveal, CountUp and the
   three section components named above).
   ========================================================================== */

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal/Reveal";
import CountUp from "@/components/CountUp/CountUp";
import Eyebrow from "@/components/Eyebrow/Eyebrow";
import Stars from "@/components/Stars/Stars";
import WhatWeDo from "./WhatWeDo";
import ChipString from "./ChipString";
import TestimonialsSection from "@/components/HomeSections/TestimonialsSection";
import ClientsSection from "@/components/HomeSections/ClientsSection";
import { getReviews } from "@/lib/content";
import styles from "./page.module.css";
import Icon from "@/components/Icon/Icon";

/* About > Stats — 4 equal cells, 2 rows (confirmed). */
const ABOUT_STATS = [
  { label: "Project success rate", to: 100, suffix: "%", rule: "dark" },
  { label: "Years of experience", to: 5, suffix: "+", rule: "dark" },
  { label: "Happy clients", to: 50, suffix: "+", rule: "light" },
  { label: "Jobs created", to: 20, suffix: "+", rule: "light" },
] as const;


export default function Home() {
  const reviews = getReviews();

  return (
    <main className={styles.page}>
      {/* 1. Hero — Homepage — Revamped > Hero ------------------------------ */}
      {/* data-hero-full: tells globals.css to drop the usual below-nav
          padding, so the photo runs under the (transparent) bar. */}
      <section className={styles.hero} data-hero-full>
        <div className={styles.heroMedia}>
          <Image src="/images/about.jpg" alt="" fill priority fetchPriority="high" sizes="100vw" className={styles.heroImg} />
          <div className={styles.heroOverlay} aria-hidden="true" />
        </div>

        {/* Same centered container every section below uses, so the headline
            starts on the page's content edge rather than the viewport's. */}
        <div className={styles.heroWrap}>
          <div className={styles.heroInner}>
            <Reveal style={{ "--d": 0 } as CSSProperties}>
              <span className={styles.heroEyebrow}>
                <Icon name="megaphone" className={styles.heroEyebrowIcon} />
                Grow your business with us
              </span>
            </Reveal>

            <Reveal style={{ "--d": 1 } as CSSProperties}>
              <h1 className={styles.heroTitle}>Welcome to KZD Solutions</h1>
            </Reveal>

            <Reveal style={{ "--d": 2 } as CSSProperties}>
              <p className={styles.heroSub}>We help businesses grow through innovative and scalable solutions.</p>
            </Reveal>

            <Reveal style={{ "--d": 3 } as CSSProperties}>
              <div className={styles.heroCtas}>
                <Link className={styles.heroCtaPrimary} href="/contact">
                  <span>Contact us</span>
                  <Icon name="envelope" className={styles.heroCtaIcon} />
                </Link>
                <Link className={styles.heroCtaSecondary} href="/services/ai-builder">
                  <span className={styles.neonRing} aria-hidden="true" />
                  <Icon name="stars" className={styles.heroCtaIcon} />
                  <span>Build your website with AI</span>
                  <span className={styles.heroCtaFree}>FREE</span>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Static curved edge into the white About section (Hero > Curved
            Edge, confirmed) — no animation, unlike the legacy looping wave. */}
        <svg
          className={styles.heroCurve}
          viewBox="0 0 1440 26"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,20 C300,18,600,6,833,3 C1050,1,1250,6,1440,9 L1440,26 L0,26 Z" fill="var(--color-white)" />
        </svg>
        {/* Mobile — Home: a symmetric dome instead. */}
        <svg
          className={`${styles.heroCurve} ${styles.heroCurveMobile}`}
          viewBox="0 0 390 30"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,30 C80,4 310,4 390,30 Z" fill="var(--color-white)" />
        </svg>
      </section>

      {/* 2. About — Homepage — Revamped > About ---------------------------- */}
      <section id="about" className={styles.about} aria-labelledby="home-about-title">
        <div className={styles.aboutInner}>
          <div className={styles.aboutRow}>
            {/* Desktop only: the white stage with the floating chips and the
                "About us" stamp (Penpot's AboutImagePanel is a plain white
                panel — no photo). Mobile shows the same figures as cards. */}
            <Reveal className={styles.aboutImagePanel}>
              <ChipString />
              <div className={styles.chipGrowth}>
                <div className={styles.chipGrowthTop}>
                  <p className={styles.chipGrowthValue}>{reviews.rating.toFixed(1)}</p>
                  <Stars rating={reviews.rating} />
                </div>
                <p className={styles.chipLabel}>Google rating</p>
              </div>

              <div className={styles.chipCost} data-string-to="cost">
                <p className={styles.chipCostValue}>
                  R1M<span className={styles.plusMuted}>+</span>
                </p>
                <p className={`${styles.chipLabel} ${styles.chipLabelOnDark}`}>Saved for clients</p>
              </div>

              {/* About > AboutBadge: the orange "About us" stamp — the one
                  confirmed departure from black/white/grey (--color-accent). */}
              <div className={styles.aboutBadge} aria-hidden="true" data-string-from>
                <svg className={styles.aboutBadgeArt} viewBox="0 0 400 192" preserveAspectRatio="xMidYMid meet">
                  <rect x="50" y="62" width="350" height="100" rx="50" fill="var(--color-accent)" />
                  <ellipse cx="42" cy="112" rx="42" ry="42" fill="var(--color-ink)" />
                  <path d="M22,112 L48,103 L48,121 Z" fill="var(--color-accent)" />
                  <g stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round">
                    <path d="M344,58 L364,28" />
                    <path d="M366,60 L382,34" />
                    <path d="M370,12 L386,12" />
                    <path d="M378,4 L378,20" />
                  </g>
                </svg>
                <p className={styles.aboutBadgeLabel}>About us</p>
              </div>
            </Reveal>

            <div className={styles.aboutText}>
              <Reveal style={{ "--d": 0 } as CSSProperties}>
                <Eyebrow>About us</Eyebrow>
              </Reveal>

              <Reveal style={{ "--d": 1 } as CSSProperties}>
                <h2 className={styles.aboutHeadline} id="home-about-title">
                  Websites, apps and IT support{" "}
                  <span className={styles.aboutHeadlineMuted}>for South African businesses.</span>
                </h2>
              </Reveal>

              <Reveal style={{ "--d": 2 } as CSSProperties}>
                <p className={styles.aboutIntro}>
                  KZD Solutions helps businesses optimize and scale through innovative solutions, expertise
                  in process improvement, custom software, and digital platforms, driving success and
                  sustainable growth.
                </p>
              </Reveal>

              <Reveal style={{ "--d": 3 } as CSSProperties}>
                <div className={styles.aboutStatsGrid}>
                  {ABOUT_STATS.map((stat) => (
                    <div className={styles.aboutStat} data-rule={stat.rule} key={stat.label}>
                      <p className={styles.aboutStatLabel}>{stat.label}</p>
                      <p className={styles.aboutStatValue}>
                        <CountUp to={stat.to} />
                        <span>{stat.suffix}</span>
                      </p>
                    </div>
                  ))}

                  {/* Mobile — the two floating chips become the last row of cards. */}
                  <div className={`${styles.aboutStat} ${styles.mobileOnly}`}>
                    <p className={styles.aboutStatLabel}>Google rating</p>
                    <p className={`${styles.aboutStatValue} ${styles.ratingValue}`}>
                      {reviews.rating.toFixed(1)}
                      <Stars rating={reviews.rating} />
                    </p>
                  </div>
                  <div className={`${styles.aboutStat} ${styles.aboutStatDark} ${styles.mobileOnly}`}>
                    <p className={styles.aboutStatLabel}>Saved for clients</p>
                    <p className={styles.aboutStatValue}>R1M+</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <WhatWeDo />

      <TestimonialsSection />

      <ClientsSection />
    </main>
  );
}

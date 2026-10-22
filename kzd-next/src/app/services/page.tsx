/* ==========================================================================
   /services — Penpot "Services — Revamped" and "Mobile — Services".

   Hero (photo + black overlay), Our services (ServicesTabs, a client leaf),
   Our products, then the same Testimonials and Our clients sections as the
   homepage. The site footer comes from the layout.
   ========================================================================== */

import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import Reveal from "@/components/Reveal/Reveal";
import Icon from "@/components/Icon/Icon";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import TestimonialsSection from "@/components/HomeSections/TestimonialsSection";
import ClientsSection from "@/components/HomeSections/ClientsSection";
import { caseStudyHref } from "@/lib/caseStudies";
import ServicesTabs from "./ServicesTabs";
import { PRODUCTS, SERVICE_TABS } from "./content";
import styles from "./services.module.css";

const DESCRIPTION =
  "Explore KZD Solutions' services including business process optimisation, custom software development, scalable digital platforms, and consulting for business growth.";

export const metadata: Metadata = {
  title: "Services",
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: {
    type: "website",
    url: "/services",
    title: "Our Services | Digital Transformation & Software Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

export default function ServicesPage() {
  return (
    <main className={styles.svc}>
      {/* Hero ------------------------------------------------------------- */}
      <section className={styles.hero} data-hero-full>
        <div className={styles.heroMedia}>
          <Image
            src="/Assets/photos/services-hero-1600.jpg"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className={styles.heroImg}
          />
          <div className={styles.heroOverlay} aria-hidden="true" />
        </div>

        <div className={styles.heroInner}>
          <Reveal style={{ "--d": 0 } as CSSProperties}>
            <p className={styles.heroEyebrow}>
              <Icon name="megaphone" className={styles.heroEyebrowIcon} />
              World class business services
            </p>
          </Reveal>
          <Reveal style={{ "--d": 1 } as CSSProperties}>
            <h1 className={styles.heroTitle}>Services</h1>
          </Reveal>
        </div>

        <svg className={`${styles.curve} ${styles.curveDesktop}`} viewBox="0 0 1440 26" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,20 C300,18,600,6,833,3 C1050,1,1250,6,1440,9 L1440,26 L0,26 Z" fill="var(--color-white)" />
        </svg>
        <svg className={`${styles.curve} ${styles.curveMobile}`} viewBox="0 0 390 30" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,30 C80,4 310,4 390,30 Z" fill="var(--color-white)" />
        </svg>
      </section>

      {/* Our services ------------------------------------------------------ */}
      <section className={styles.services} aria-labelledby="svc-title">
        <div className={styles.servicesHead}>
          <Reveal style={{ "--d": 0 } as CSSProperties}>
            <p className={styles.eyebrow}>Our services</p>
          </Reveal>
          <Reveal style={{ "--d": 1 } as CSSProperties}>
            <h2 className={styles.title} id="svc-title">
              Everything you need to optimise and scale
            </h2>
          </Reveal>
          <Reveal style={{ "--d": 2 } as CSSProperties}>
            <p className={styles.sub}>Consulting and technology, all under one roof.</p>
          </Reveal>
        </div>
        <ServicesTabs tabs={SERVICE_TABS} />
      </section>

      {/* Our products ------------------------------------------------------ */}
      <section className={styles.products} aria-labelledby="svc-prod-title">
        <div className={styles.productsHead}>
          <Reveal style={{ "--d": 0 } as CSSProperties}>
            <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>Our products</p>
          </Reveal>
          <Reveal style={{ "--d": 1 } as CSSProperties}>
            <h2 className={`${styles.title} ${styles.titleOnDark}`} id="svc-prod-title">
              Our Products
            </h2>
          </Reveal>
          <Reveal style={{ "--d": 2 } as CSSProperties}>
            <p className={`${styles.sub} ${styles.subOnDark}`}>Products we&rsquo;ve designed, built and shipped.</p>
          </Reveal>
        </div>

        <ul className={styles.productGrid}>
          {PRODUCTS.map((p, i) => (
            <Reveal
              as="li"
              key={p.slug}
              style={{ "--d": i, "--reveal-stagger": "120ms", "--reveal-distance": "32px" } as CSSProperties}
            >
              <a className={styles.product} href={caseStudyHref("apps", p.slug)}>
                <span className={styles.productTile}>
                  <Image className={styles.productImg} src={p.image} alt="" fill sizes="(max-width: 900px) 90vw, 360px" />
                </span>
                <span className={styles.productBody}>
                  <span className={styles.productCat}>
                    {String(i + 1).padStart(2, "0")} · {p.category}
                  </span>
                  <span className={styles.productName}>{p.name}</span>
                  <span className={styles.productCopy}>{p.copy}</span>
                  <span className={styles.productLink}>
                    Case study <ArrowIcon />
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
      </section>

      <TestimonialsSection />
      <ClientsSection />
    </main>
  );
}

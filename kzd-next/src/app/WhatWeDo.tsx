"use client";

/* ==========================================================================
   WhatWeDo — the homepage services list (Penpot: "What we do").

   Desktop: intro + "All services" + a preview card on the left; the six
   services as large rows on the right. Hovering or focusing a row turns it
   dark with a white arrow disc, and the preview card cross-fades to that
   service. Rows reveal with an 80ms stagger.
   Mobile: centred heading, the rows become stacked cards, and "All
   services" is a full-width pill at the bottom; no preview card.
   ========================================================================== */

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import Reveal from "@/components/Reveal/Reveal";
import Icon from "@/components/Icon/Icon";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import { SERVICES, serviceHref } from "@/lib/services";
import styles from "./WhatWeDo.module.css";

export default function WhatWeDo() {
  const [active, setActive] = useState(1);
  const service = SERVICES[active];

  return (
    <section className={styles.section} aria-labelledby="home-wwd-title">
      <div className={styles.inner}>
        <div className={styles.intro}>
          <Reveal style={{ "--d": 0 } as CSSProperties}>
            <p className={styles.eyebrow}>What we do</p>
          </Reveal>
          <Reveal style={{ "--d": 1 } as CSSProperties}>
            <h2 className={styles.title} id="home-wwd-title">
              Everything you need to build, launch and scale.
            </h2>
          </Reveal>
          <Reveal style={{ "--d": 2 } as CSSProperties}>
            <p className={styles.sub}>We design, build and support, all under one roof.</p>
          </Reveal>
          <Reveal style={{ "--d": 3 } as CSSProperties} className={styles.ctaDesktop}>
            <Link className={styles.allBtn} href="/services">
              All services <ArrowIcon />
            </Link>
          </Reveal>

          <Reveal style={{ "--d": 4 } as CSSProperties} className={styles.previewWrap}>
            <Link className={styles.preview} href={serviceHref(service)} aria-label={`View ${service.name}`}>
              <span key={service.slug} className={styles.previewBody}>
                <span className={styles.previewIcon}>
                  <Icon name={service.icon} size="dense" />
                </span>
                <span className={styles.previewText}>{service.blurb}</span>
                <span className={styles.previewLink}>
                  View service <ArrowIcon />
                </span>
              </span>
            </Link>
          </Reveal>
        </div>

        <ul className={styles.list}>
          {SERVICES.map((s, i) => (
            <Reveal as="li" key={s.slug} style={{ "--d": i } as CSSProperties}>
              <Link
                href={serviceHref(s)}
                className={styles.row}
                data-active={i === active || undefined}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.rowText}>
                  <span className={styles.name}>{s.name}</span>
                  <span className={styles.line}>{s.listLine}</span>
                  <span className={styles.tagMobile}>{s.comingSoon ? "Coming soon" : s.tag}</span>
                </span>
                <span className={styles.tag}>{s.comingSoon ? "Coming soon" : s.tag}</span>
                <span className={styles.disc} aria-hidden="true">
                  <Icon name="arrow-up-right" size="dense" />
                </span>
                <span className={styles.mobileArrow} aria-hidden="true">
                  <ArrowIcon />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Link className={`${styles.allBtn} ${styles.ctaMobile}`} href="/services">
          All services <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}

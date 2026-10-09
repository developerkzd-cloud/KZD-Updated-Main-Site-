"use client";

/* ==========================================================================
   PlanCarousel — the Monthly/Yearly/2-Year price toggle plus the swiper
   carousel of the four shared-hosting plans (Starter/Basic/Standard/
   Business). Ported from hosting.html:

   - The .chp-toggle-group buttons and the inline <script> at the bottom of
     the page that reads data-monthly/data-yearly/data-twoyear off each
     .chp-price-value and data-yearly/data-twoyear off each
     .chp-price-effective. That DOM-querying version becomes React state here
     (`period`) instead — every card just re-renders off the same value, plan
     data comes from ./content.ts rather than data-* attributes.
   - The `.swiper.chp-swiper` markup and its data-slider-options JSON
     (slidesPerView/spaceBetween/loop/breakpoints), reproduced with the
     official swiper/react components rather than the vendored jQuery-era
     Swiper build.

   One client component rather than splitting the toggle from the carousel,
   because both need to re-render off the same `period` state on every
   keystroke of the toggle.
   ========================================================================== */

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import GetStartedButton from "./GetStartedButton";
import { BILLING_LABELS, HOSTING_PLANS, type BillingPeriod, type HostingPlan } from "./content";
import styles from "./hosting.module.css";
import Icon from "@/components/Icon/Icon";

const PERIODS: { id: BillingPeriod; label: string; save?: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly", save: "Save 2 months" },
  { id: "twoyear", label: "2 Years", save: "Save 5 months" },
];

function PlanCard({ plan, period }: { plan: HostingPlan; period: BillingPeriod }) {
  const value = plan[period];
  const effective = period === "yearly" ? plan.effectiveYearly : period === "twoyear" ? plan.effectiveTwoyear : null;

  return (
    <div className={`${styles.card} ${plan.active ? styles.cardActive : ""}`}>
      <h3 className={styles.cardTitle}>{plan.name}</h3>
      <p className={styles.cardDesc}>{plan.description}</p>
      <div className={styles.price}>
        R<span className={styles.priceValue}>{value.toLocaleString("en-US")}</span>
        <span className={styles.priceCycle}>{BILLING_LABELS[period]}</span>
      </div>
      <p className={styles.priceEffective} style={{ visibility: effective === null ? "hidden" : "visible" }}>
        {effective === null ? " " : `Effective R${effective}/mo`}
      </p>
      <ul className={styles.features}>
        {plan.features.map((f) => (
          <li key={f.text}>
            {f.text}
            {f.tooltip && (
              <span className={styles.tooltipWrapper}>
                <span className={styles.tooltipIcon} aria-hidden="true">?</span>
                <span className={styles.tooltipBox} role="tooltip">{f.tooltip}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      <GetStartedButton productKey={plan.key} />
    </div>
  );
}

export default function PlanCarousel() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <div className={styles.toggleGroup} role="tablist" aria-label="Billing cycle">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            className={`${styles.toggleBtn} ${period === p.id ? styles.toggleBtnActive : ""}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
            {p.save && <span className={styles.toggleSave}>{p.save}</span>}
          </button>
        ))}
      </div>

      <div className={styles.swiperOuter}>
        <Swiper
          modules={[Navigation]}
          loop
          slidesPerView={1}
          spaceBetween={24}
          breakpoints={{
            576: { slidesPerView: 2, spaceBetween: 20 },
            992: { slidesPerView: 3, spaceBetween: 26 },
          }}
          navigation
          onBeforeInit={(swiper) => {
            const nav = swiper.params.navigation;
            if (nav && typeof nav !== "boolean") {
              nav.prevEl = prevRef.current;
              nav.nextEl = nextRef.current;
            }
          }}
          className={styles.swiper}
        >
          {HOSTING_PLANS.map((plan) => (
            <SwiperSlide key={plan.key}>
              <PlanCard plan={plan} period={period} />
            </SwiperSlide>
          ))}
        </Swiper>

        <button ref={prevRef} type="button" className={styles.swiperPrev} aria-label="Previous plan">
          <Icon name="chevron-left" />
        </button>
        <button ref={nextRef} type="button" className={styles.swiperNext} aria-label="Next plan">
          <Icon name="chevron-right" />
        </button>
      </div>

      <p className={styles.domainNote}>Free .co.za domain included with annual hosting plans only.</p>
    </div>
  );
}

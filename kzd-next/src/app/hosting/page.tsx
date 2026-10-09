/* ==========================================================================
   /hosting — shared web hosting plans.

   Server Component. Ported from hosting.html: hero, the four-plan pricing
   carousel (billing-cycle toggle + Swiper — see ./PlanCarousel.tsx), the two
   email-only plans, an FAQ (the shared Accordion component), and the "Why
   Choose to Partner With Us" grid. The legacy AOS/jQuery/Bootstrap chrome,
   GTM/GA/Clarity snippets and nav/footer markup are dropped — the root
   layout already renders <Nav/>/<Footer/>, and Reveal replaces AOS.
   ========================================================================== */

import type { Metadata } from "next";
import Image from "next/image";
import Accordion from "@/components/Accordion/Accordion";
import Reveal from "@/components/Reveal/Reveal";
import PlanCarousel from "./PlanCarousel";
import GetStartedButton from "./GetStartedButton";
import { EMAIL_PLANS, FAQ_ITEMS, WHY_CARDS } from "./content";
import styles from "./hosting.module.css";
import Icon from "@/components/Icon/Icon";

const DESCRIPTION =
  "Reliable web hosting from KZD Solutions in Durban. Fast, secure shared hosting plans with SSL, backups, and local support built for growing businesses.";

export const metadata: Metadata = {
  title: "Web Hosting",
  description: DESCRIPTION,
  alternates: { canonical: "/hosting" },
  openGraph: {
    type: "website",
    url: "/hosting",
    title: "Web Hosting | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

const WHY_ICONS = ["check-circle", "shield-lock", "headset", "lightning-charge"] as const;

export default function HostingPage() {
  return (
    <main className={styles.hosting}>
      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image src="/images.jpeg" alt="" fill sizes="100vw" priority className={styles.heroImg} />
          <div className={styles.heroWash} aria-hidden="true" />
        </div>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>
            <Icon name="send" size="dense" />
            Grow your business with us
          </span>
          <h1 className={styles.h1}>Web Hosting</h1>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`kzd-wrap ${styles.header}`}>
          <h2 className={styles.h2}>Hosting Plans</h2>
          <p className={styles.subtitle}>Transparent pricing, no surprises. Pick a plan and scale later.</p>
        </div>

        <Reveal className={`kzd-wrap ${styles.service}`}>
          <h3 className={styles.serviceTitle}>KZD Solutions Web Hosting Services</h3>
          <p className={styles.serviceText}>
            KZD Solutions delivers fast, secure shared hosting built for personal sites, small
            businesses, and growing online stores.
          </p>
          <p className={styles.serviceText}>
            Every plan includes free SSL, daily backups, and the DirectAdmin control panel, so you
            can manage your hosting without the guesswork.
          </p>
        </Reveal>

        <div className="kzd-wrap">
          <PlanCarousel />
        </div>
      </section>

      <section className={styles.section}>
        <div className={`kzd-wrap ${styles.header}`}>
          <h2 className={styles.h2}>Just Need Email?</h2>
          <p className={styles.subtitle}>
            Already have a website or developer? Get professional email on your own domain without
            a hosting plan.
          </p>
        </div>

        <div className={`kzd-wrap ${styles.emailCards}`}>
          {EMAIL_PLANS.map((plan) => (
            <Reveal className={styles.card} key={plan.key}>
              <h3 className={styles.cardTitle}>{plan.name}</h3>
              <p className={styles.cardDesc}>{plan.description}</p>
              <div className={styles.price}>
                R{plan.monthlyPrice}
                <span className={styles.priceCycleSmall}>/month</span>
              </div>
              <ul className={styles.features}>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <GetStartedButton productKey={plan.key} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={`kzd-wrap ${styles.faq}`}>
          <h2 className={styles.h2}>Frequently Asked Questions</h2>
          <Accordion
            items={FAQ_ITEMS.map((item) => ({ id: item.id, question: item.question, answer: item.answer }))}
            defaultOpenId=""
          />
        </div>
      </section>

      <section className={`${styles.section} ${styles.why}`}>
        <div className="kzd-wrap">
          <div className={styles.whyHeader}>
            <h2 className={styles.h2}>Why Choose to Partner With Us</h2>
            <p className={styles.subtitle}>
              We provide top-tier hosting solutions designed for reliability, security, and
              performance. Partnering with us ensures your business runs smoothly and grows
              efficiently.
            </p>
          </div>
          <div className={styles.whyGrid}>
            {WHY_CARDS.map((card, i) => (
              <Reveal className={styles.whyCard} key={card.title}>
                <Icon className={styles.whyIcon} name={WHY_ICONS[i]} size="feature" />
                <h3 className={styles.whyTitle}>{card.title}</h3>
                <p className={styles.whyBody}>{card.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ==========================================================================
   /contact — Penpot "Contact — Revamped" and "Mobile — Contact".

   Hero (the site's contact photo under the black overlay), our office at
   Smart Xchange with a real map, then "Let's work together": the contact
   channels and the enquiry form (ContactForm, the only client component),
   on white. The map is Google's keyless embed in satellite view, mounted
   only once it nears the viewport (MapEmbed).
   ========================================================================== */

import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import { CONTACT } from "@/lib/nav";
import Reveal from "@/components/Reveal/Reveal";
import Icon from "@/components/Icon/Icon";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import { LOCATIONS } from "./content";
import ContactForm from "./ContactForm";
import MapEmbed from "./MapEmbed";
import styles from "./contact.module.css";

const DESCRIPTION =
  "Contact KZD Solutions today to discuss how we can help your business grow through innovative IT and digital solutions. Located in Durban, KwaZulu-Natal.";

export const metadata: Metadata = {
  title: "Contact",
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: "/contact",
    title: "Contact Us | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

const CHANNELS = [
  { label: "Call us directly?", value: CONTACT.phoneLabel, href: CONTACT.phoneHref },
  { label: "Need live support?", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: "Join our growing team?", value: "recruitment@kzdsolutions.co.za", href: "mailto:recruitment@kzdsolutions.co.za" },
];

const d = (n: number) => ({ "--d": n }) as CSSProperties;

export default function ContactPage() {
  return (
    <main className={styles.con}>
      {/* Hero ------------------------------------------------------------- */}
      <section className={styles.hero} data-hero-full>
        <div className={styles.heroMedia}>
          <Image
            src="/images/overhead-view-cellphone-headphone-keyboard-with-coffee-cup.jpg"
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
          <Reveal style={d(0)}>
            <p className={styles.heroEyebrow}>
              <Icon name="megaphone" className={styles.heroEyebrowIcon} />
              Grow your business with us
            </p>
          </Reveal>
          <Reveal style={d(1)}>
            <h1 className={styles.heroTitle}>Contact us</h1>
          </Reveal>
        </div>
        <svg className={`${styles.curve} ${styles.curveDesktop}`} viewBox="0 0 1440 26" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,26 L0,22 C360,2 1080,2 1440,22 L1440,26 Z" fill="var(--color-white)" />
        </svg>
        <svg className={`${styles.curve} ${styles.curveMobile}`} viewBox="0 0 390 30" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,30 C80,4 310,4 390,30 Z" fill="var(--color-white)" />
        </svg>
      </section>

      {/* Locations --------------------------------------------------------- */}
      <section className={styles.visit} aria-labelledby="con-visit">
        <div className={styles.visitIntro}>
          <Reveal style={d(0)}>
            <p className={styles.eyebrow}>
              <Icon name="chat-left-text" size="dense" className={styles.eyebrowIcon} />
              Let&rsquo;s work together
            </p>
          </Reveal>
          <Reveal style={d(1)}>
            <h2 className={styles.title} id="con-visit">
              Call or visit us at our Durban office.
            </h2>
          </Reveal>
          <Reveal style={d(2)}>
            <p className={styles.sub}>We will always be happy to hear from you.</p>
          </Reveal>
          <Reveal style={d(3)} className={styles.callWrap}>
            <a className={styles.darkBtn} href={CONTACT.phoneHref}>
              <Icon name="telephone" size="dense" />
              Call us
            </a>
          </Reveal>
        </div>

        <ul className={styles.locations}>
          {LOCATIONS.map((loc, i) => (
            <Reveal as="li" key={loc.name} from="right" style={d(i + 1)}>
              <article className={styles.locCard}>
                <div className={styles.mapFrame}>
                  <MapEmbed
                    className={styles.map}
                    title={`Map: ${loc.name}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(loc.address)}&t=k&z=17&output=embed`}
                  />
                </div>
                <div className={styles.locBody}>
                  <h3 className={styles.locName}>{loc.name}</h3>
                  <p className={styles.locAddr}>{loc.address}</p>
                  <a
                    className={styles.locMap}
                    href={`https://www.google.com/maps?q=${encodeURIComponent(loc.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on map <Icon name="arrow-up-right" size="dense" />
                  </a>
                  <a className={styles.locPhone} href={loc.phoneHref}>
                    <span className={styles.locPhoneLabel}>Call us</span>
                    <span className={styles.locPhoneValue}>
                      <Icon name="telephone" size="dense" className={styles.locPhoneIcon} />
                      {loc.phoneLabel}
                    </span>
                    <span className={styles.locPhoneDisc} aria-hidden="true">
                      <Icon name="telephone" size="dense" />
                    </span>
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Let's work together ---------------------------------------------- */}
      <section className={styles.help} aria-labelledby="con-help">
        <Reveal from="left" className={styles.helpCard}>
          <p className={styles.eyebrow}>
            <Icon name="chat-left-text" size="dense" className={styles.eyebrowIcon} />
            Let&rsquo;s work together
          </p>
          <h2 className={styles.helpTitle}>Ready to help you!</h2>
          <p className={styles.sub}>We&rsquo;re here to help and answer any question you might have.</p>
          <ul className={styles.channels}>
            {CHANNELS.map((c) => (
              <li key={c.label}>
                <a className={styles.channel} href={c.href}>
                  <span className={styles.channelLabel}>{c.label}</span>
                  <span className={styles.channelValue}>{c.value}</span>
                  <ArrowIcon className={styles.channelArrow} />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal from="right" className={styles.formCard}>
          <h2 className={styles.formTitle} id="con-help">
            Looking for any help?
          </h2>
          <ContactForm />
        </Reveal>
      </section>
    </main>
  );
}

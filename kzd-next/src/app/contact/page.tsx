/* ==========================================================================
   /contact — ported from contact.html.

   Two locations (from the Organization JSON-LD), a "get in touch" section
   with the contact channels plus form, and a map. The legacy Bootstrap
   markup (services-box-style-02 rows, contact-form-style-03) is not reused —
   this is the same content redesigned into the app's existing card language,
   matching /careers.

   Only the form (ContactForm.tsx) and the map (Map.tsx) are client
   components; everything else here is static server-rendered markup.
   ========================================================================== */

import type { Metadata } from "next";
import { CONTACT } from "@/lib/nav";
import { LOCATIONS } from "./content";
import ContactForm from "./ContactForm";
import Map from "./Map";
import Reveal from "@/components/Reveal/Reveal";
import styles from "./contact.module.css";
import Icon from "@/components/Icon/Icon";

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

function phoneIcon() {
  return <Icon name="telephone" />;
}

export default function ContactPage() {
  return (
    <main className={styles.con}>
      <section className={styles.hero}>
        <div className={styles.wash} aria-hidden="true" />
        <div className={styles.inner}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Contact
          </span>
          <h1 className={styles.h1}>Contact us</h1>
          <p className={styles.intro}>
            Call or visit us at one of our locations — we will always be happy to hear from you.
          </p>
        </div>
      </section>

      <section className={styles.locations} aria-labelledby="con-locations">
        <div className={styles.inner}>
          <h2 className={styles.h2} id="con-locations">Our locations</h2>

          <div className={styles.locGrid}>
            {LOCATIONS.map((loc) => (
              <Reveal className={styles.locCard} key={loc.name}>
                <span className={styles.locRule} aria-hidden="true" />
                <h3 className={styles.locTitle}>{loc.name}</h3>
                <p className={styles.locAddr}>{loc.address}</p>
                <div className={styles.locFoot}>
                  <a
                    className={styles.locMapLink}
                    href={`https://www.google.com/maps?q=${encodeURIComponent(loc.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on map
                  </a>
                  <a className={styles.locPhone} href={loc.phoneHref}>
                    {phoneIcon()}
                    {loc.phoneLabel}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.touch} aria-labelledby="con-touch">
        <div className={styles.inner}>
          <h2 className={styles.h2} id="con-touch">Looking for any help?</h2>

          <div className={styles.touchGrid}>
            <Reveal className={styles.channels}>
              <span className={styles.channelsEyebrow}>Let&apos;s work together</span>
              <h3 className={styles.channelsTitle}>Ready to help you!</h3>
              <p className={styles.channelsBody}>
                We&apos;re here to help and answer any question you might have.
              </p>

              <ul className={styles.channelList}>
                <li>
                  <p className={styles.channelLabel}>Call us directly?</p>
                  <a className={styles.channelValue} href={CONTACT.phoneHref}>
                    {CONTACT.phoneLabel}
                  </a>
                </li>
                <li>
                  <p className={styles.channelLabel}>Need live support?</p>
                  <a className={styles.channelValue} href={`mailto:${CONTACT.email}`}>
                    {CONTACT.email}
                  </a>
                </li>
                <li>
                  <p className={styles.channelLabel}>Join our growing team?</p>
                  <a className={styles.channelValue} href="mailto:recruitment@kzdsolutions.co.za">
                    recruitment@kzdsolutions.co.za
                  </a>
                </li>
              </ul>
            </Reveal>

            <Reveal className={styles.formCard}>
              <h3 className={styles.formTitle}>Send us a message</h3>
              <p className={styles.formNote}>
                Fill in the form below and we&apos;ll get back to you shortly.
              </p>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>

      <section className={styles.mapSection} aria-labelledby="con-map">
        <div className={styles.inner}>
          <h2 className={styles.h2} id="con-map">Find us</h2>
          <Reveal className={styles.mapCard}>
            <Map locations={LOCATIONS} />
          </Reveal>
        </div>
      </section>
    </main>
  );
}

/* ==========================================================================
   /services — ported from services.html.

   A Server Component. The two interactive bits — the accordion (which also
   has to react to the /services#consulting and /services#development links
   in the nav mega-menu and footer, see src/lib/nav.ts) and the scroll-reveal
   on the product/client cards — are pushed out to client leaves
   (ServicesAccordion, Reveal); everything else, including the client list and
   product copy, is plain server-rendered HTML.
   ========================================================================== */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal/Reveal";
import type { AccordionItem } from "@/components/Accordion/Accordion";
import ClientShowcase from "@/components/ClientShowcase/ClientShowcase";
import ServicesAccordion from "./ServicesAccordion";
import { CONSULTING_LIST, DEVELOPMENT_LIST, PRODUCTS, CLIENTS } from "./content";
import styles from "./services.module.css";

const DESCRIPTION =
  "Explore KZD Solutions' services including business process optimization, custom software development, scalable digital platforms, and consulting for business growth.";

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

const ACCORDION_ITEMS: AccordionItem[] = [
  {
    id: "consulting",
    question: "Consulting",
    answer: (
      <>
        <p className={styles.accDesc}>
          We help businesses find waste, fix process and scale what already works.
        </p>
        <ul className={styles.accList}>
          {CONSULTING_LIST.map((row) => (
            <li className={styles.accRow} key={row}>{row}</li>
          ))}
        </ul>
        <Link className={styles.accCta} href="/contact">Book a free consultation</Link>
      </>
    ),
  },
  {
    id: "development",
    question: "Development",
    answer: (
      <>
        <p className={styles.accDesc}>
          We build and maintain the software, sites and infrastructure your business runs on.
        </p>
        <ul className={styles.accList}>
          {DEVELOPMENT_LIST.map((row) => (
            <li className={styles.accRow} key={row}>{row}</li>
          ))}
        </ul>
        <Link className={styles.accCta} href="/contact">Book a free consultation</Link>
      </>
    ),
  },
];

export default function ServicesPage() {
  return (
    <main className={styles.svc}>
      {/* 1. Hero ------------------------------------------------------- */}
      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image
            src="/Assets/photos/services-hero-1600.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.heroImg}
          />
          <div className={styles.heroWash} aria-hidden="true" />
        </div>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            World class business services
          </span>
          <h1 className={styles.h1}>Services</h1>
        </div>
      </section>

      {/* 2. Story -------------------------------------------------------- */}
      <section className={styles.story}>
        <div className={styles.storyInner}>
          <div className={styles.storyText}>
            <h2 className={styles.storyTitle}>The Story Behind KZD Solutions.</h2>
            <p className={styles.storyBody}>
              We offer a range of services designed to help businesses improve efficiency,
              scalability, and productivity.
            </p>
          </div>
          <figure className={styles.storyFigure}>
            <div className={styles.storyImageWrap}>
              <Image
                src="/images/walking-up-stairs.jpeg"
                alt=""
                fill
                sizes="(max-width: 900px) 100vw, 520px"
                className={styles.storyImage}
              />
            </div>
            <figcaption className={styles.storyStat}>
              <span className={styles.storyStatNum}>
                6<sub className={styles.storyStatPlus}>+</sub>
              </span>
              <span className={styles.storyStatLabel}>Years working experience</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 3. Services accordion --------------------------------------------- */}
      <section className={styles.acc} aria-labelledby="svc-acc-title">
        <div className={styles.accInner}>
          <div className={styles.accHead}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              Our services
            </span>
            <h2 className={styles.accTitle} id="svc-acc-title">
              Everything you need to optimise and scale
            </h2>
            <p className={styles.accSub}>Consulting and technology — all under one roof.</p>
          </div>

          <div className={styles.accWrap}>
            <ServicesAccordion items={ACCORDION_ITEMS} defaultOpenId="consulting" />
          </div>
        </div>
      </section>

      {/* 4. Our Products ----------------------------------------------------- */}
      <section className={styles.prod} aria-labelledby="svc-prod-title">
        <div className={styles.prodInner}>
          <div className={styles.prodHead}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              What we&rsquo;ve built
            </span>
            <h2 className={styles.prodTitle} id="svc-prod-title">Our Products</h2>
            <p className={styles.prodSub}>Products we&rsquo;ve designed, built and shipped.</p>
          </div>

          <div className={styles.prodGrid}>
            {PRODUCTS.map((product) => (
              <Reveal key={product.slug} className={styles.revealCard}>
                <a
                  className={styles.prodCard}
                  href={product.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={product.alt}
                >
                  <span className={styles.prodTile}>
                    <Image
                      className={styles.prodShot}
                      src={product.image}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 80vw, 360px"
                    />
                    <span className={styles.prodGo} aria-hidden="true">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <path d="M8 16L16 8M9 8h7v7" />
                      </svg>
                    </span>
                  </span>
                  <h3 className={styles.prodName}>{product.name}</h3>
                  <p className={styles.prodCopy}>{product.copy}</p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Client showcase -------------------------------------------------- */}
      <section className={styles.clients} aria-labelledby="svc-clients-title">
        <div className={styles.clientsInner}>
          <div className={styles.clientsHead}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              Our clients
            </span>
            <h2 className={styles.clientsTitle} id="svc-clients-title">Live sites, real businesses.</h2>
            <p className={styles.clientsSub}>
              From salons to schools to online stores — businesses across South Africa taking
              bookings, selling products and enrolling learners on sites we built.
            </p>
          </div>

          <div className={styles.clientsRail}>
            <ClientShowcase clients={CLIENTS} />
          </div>
        </div>
      </section>
    </main>
  );
}

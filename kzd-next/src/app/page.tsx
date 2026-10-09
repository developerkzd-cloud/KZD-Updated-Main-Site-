/* ==========================================================================
   / — the homepage.

   Ported from index.html's already-redesigned content sections (kzd-about,
   kzd-services, kzd-problems, kzd-tst, kzd-clients — see the CSS files of the
   same names under /css at the repo root). Unlike the other ported pages,
   this markup is NOT a redesign: structure and copy are carried over closely,
   the way Nav and Footer were.

   Server Component throughout. Reveal (already a client leaf, see
   src/components/Reveal) supplies the scroll-in animation. CountUp and
   AboutStatBar (small client leaves) reproduce the legacy odometer/stat-bar
   count-up. The testimonials/services legacy carousels are still simplified
   to a static row/grid — three service cards and a handful of reviews don't
   need a carousel to be readable.
   ========================================================================== */

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal/Reveal";
import CountUp from "@/components/CountUp/CountUp";
import AboutStatBar from "./AboutStatBar";
import ClientShowcase from "@/components/ClientShowcase/ClientShowcase";
import WaveDivider from "@/components/WaveDivider/WaveDivider";
import TestimonialsCarousel from "./TestimonialsCarousel";
import ServicesRow from "./ServicesRow";
import BrandReveal from "./BrandReveal";
import { getReviews } from "@/lib/content";
import { CLIENTS } from "@/app/services/content";
import styles from "./page.module.css";
import Icon from "@/components/Icon/Icon";


const VALUE_CARDS = [
  {
    index: "01",
    title: "Tangible Results",
    text: "Over R1 million in client savings through operational and digital transformation.",
  },
  {
    index: "02",
    title: "Custom-built Technology",
    text: "From apps to websites, we design solutions tailored to your business.",
  },
  {
    index: "03",
    title: "Cross-Industry Expertise",
    text: "Automotive, textiles, healthcare, and tech — we adapt to any challenge.",
  },
  {
    index: "04",
    title: "Highly Recommended",
    text: null,
  },
] as const;

const METRICS = [
  { to: 1400, prefix: "", suffix: "+", label: "Days of experience.", desc: "Each day we provide valuable insights." },
  { to: 50, prefix: "", suffix: "+", label: "Valuable happy clients.", desc: "We have crafted beautiful and engaging web solutions." },
  { to: 1, prefix: "R", suffix: "M+", label: "Cost saved", desc: "We have saved our customers a lot of money." },
  { to: 20, prefix: "", suffix: "+", label: "Jobs created.", desc: "We have created multiple job opportunities." },
] as const;

const SERVICES = [
  {
    index: "01",
    name: "UX/UI Design",
    copy: "We design interfaces that feel effortless to use and hard to walk away from.",
    icon: (
      <>
        <circle cx="19" cy="53" r="5.5" pathLength={100} />
        <path d="M23.5 48.5 L50 22" pathLength={100} />
        <path d="M38.5 21 H51 V33.5" pathLength={100} />
      </>
    ),
  },
  {
    index: "02",
    name: "Software Development",
    copy: "We build custom systems that fit the way your business actually runs.",
    icon: (
      <>
        <path d="M26 25 L15 36 L26 47" pathLength={100} />
        <path d="M46 25 L57 36 L46 47" pathLength={100} />
        <path d="M40 22 L32 50" pathLength={100} />
      </>
    ),
  },
  {
    index: "03",
    name: "Web Design",
    copy: "Fast, responsive sites built for search visibility, speed and conversion.",
    icon: (
      <>
        <rect x="12" y="17" width="48" height="38" rx="4.5" pathLength={100} />
        <path d="M12 27 H60" pathLength={100} />
        <path d="M17.5 22 h.01" pathLength={100} />
        <path d="M22.5 22 h.01" pathLength={100} />
        <path d="M27.5 22 h.01" pathLength={100} />
        <rect x="17" y="32" width="13" height="18" rx="2" pathLength={100} />
        <path d="M35 34.5 H55" pathLength={100} />
        <path d="M35 41 H55" pathLength={100} />
        <path d="M35 47.5 H47" pathLength={100} />
      </>
    ),
  },
];

const PROBLEMS = [
  {
    slug: "gaps",
    cell: styles.cellGaps,
    label: "Gaps",
    text: "The blind spots between your systems, teams and tools — where work quietly falls through and nobody owns the fix.",
    sizes: "(max-width: 991px) 100vw, 610px",
  },
  {
    slug: "analytics",
    cell: styles.cellAnalytics,
    label: "Analytics",
    text: "Numbers you collect but can’t act on, because they never reach the people making the decisions.",
    sizes: "(max-width: 991px) 100vw, 606px",
  },
  {
    slug: "inefficiencies",
    cell: styles.cellIneff,
    label: "Inefficiencies",
    text: "Manual steps that quietly cost hours every week.",
    sizes: "(max-width: 991px) 100vw, 291px",
  },
  {
    slug: "digital",
    cell: styles.cellDigital,
    label: "Digital",
    text: "Platforms that no longer match how customers buy.",
    sizes: "(max-width: 991px) 100vw, 291px",
  },
];

export default function Home() {
  const reviews = getReviews();
  // "NEEDS_NAME" entries are real reviews whose author Google's API didn't
  // return — reviews.json itself flags them as not ready for a client
  // testimonials carousel until filled in. The rating/count summary above
  // still reflects all 20 Google reviews, unfiltered.
  const namedReviews = reviews.reviews.filter((r) => r.author !== "NEEDS_NAME");

  return (
    <main className={styles.page}>
      {/* 1. Hero ---------------------------------------------------------- */}
      {/* data-hero-full: tells globals.css to drop the usual below-nav
          padding, so the photo runs under the (transparent) bar. */}
      <section className={styles.hero} data-hero-full>
        <div className={styles.heroMedia}>
          <Image src="/images/about.jpg" alt="" fill priority sizes="100vw" className={styles.heroImg} />
          <div className={styles.heroWash} aria-hidden="true" />
        </div>

        {/* Same centered container every section below uses, so the headline
            starts on the page's content edge rather than the viewport's. */}
        <div className={styles.heroWrap}>
          <div className={styles.heroInner}>
            <span className={styles.heroEyebrow}>
              <span className={styles.heroEyebrowDot} aria-hidden="true" />
              Grow your business with us
            </span>
            <h1 className={styles.heroTitle}>Welcome to KZD Solutions</h1>
            <p className={styles.heroSub}>We help businesses grow through innovative and scalable solutions.</p>
            <Link className={styles.heroCta} href="/contact">
              Contact us
            </Link>
          </div>
        </div>

        <WaveDivider />
      </section>

      {/* 2. About ----------------------------------------------------------- */}
      <section id="about" className={styles.about} aria-labelledby="home-about-title">
        <div className={styles.aboutWash} aria-hidden="true" />
        <div className={styles.aboutInner}>
          <div className={styles.aboutLede}>
            <Reveal className={styles.aboutPanel}>
              <div className={styles.aboutPanelFrame}>
                <Image
                  src="/Assets/photos/about-us.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  className={styles.aboutPanelImg}
                />
              </div>
            </Reveal>

            <div className={styles.aboutCopy}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} aria-hidden="true" />
                About us
              </span>

              <h2 className={styles.aboutTitle} id="home-about-title">
                <span className={styles.aboutHl}>Progressive solutions</span>
                <span className={styles.aboutHl}>for progressive</span>
                <span className={styles.aboutHl}>businesses.</span>
              </h2>

              <p className={styles.aboutBody}>
                KZD Solutions helps businesses optimize and scale through innovative solutions, expertise
                in process improvement, custom software, and digital platforms, driving success and
                sustainable growth.
              </p>

              <div className={styles.aboutStats}>
                <div className={styles.aboutStat}>
                  <p className={styles.aboutStatValue}>
                    <span className={styles.aboutStatNum}><CountUp to={98} /></span>
                    <span className={styles.aboutStatPct}>%</span>
                  </p>
                  <p className={styles.aboutStatLabel}>Business Growth</p>
                  <AboutStatBar pct={98} />
                </div>

                <div className={styles.aboutStat}>
                  <p className={styles.aboutStatValue}>
                    <span className={styles.aboutStatNum}><CountUp to={85} /></span>
                    <span className={styles.aboutStatPct}>%</span>
                  </p>
                  <p className={styles.aboutStatLabel}>New Technology</p>
                  <AboutStatBar pct={85} />
                </div>
              </div>
            </div>
          </div>

          <hr className={styles.aboutRule} />

          <div className={styles.aboutMetrics}>
            {METRICS.map((metric) => (
              <div className={styles.aboutMetric} key={metric.label}>
                <p className={styles.aboutMetricValue}>
                  <CountUp to={metric.to} prefix={metric.prefix} suffix={metric.suffix} />
                </p>
                <p className={styles.aboutMetricLabel}>{metric.label}</p>
                <p className={styles.aboutMetricDesc}>{metric.desc}</p>
              </div>
            ))}
          </div>

          <div className={styles.aboutValues}>
            {VALUE_CARDS.map((card) => (
              <Reveal key={card.index} className={styles.aboutCard}>
                <div className={styles.aboutCardHead}>
                  <span className={styles.aboutIndex} aria-hidden="true">
                    {card.index}
                  </span>
                  <h3 className={styles.aboutCardTitle}>{card.title}</h3>
                </div>
                <p className={styles.aboutCardText}>
                  {card.text ?? (
                    <>
                      Listed among the Top Software Development Companies in South Africa, according to{" "}
                      <a
                        href="https://www.designrush.com/agency/software-development/za"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        DesignRush
                      </a>
                      .
                    </>
                  )}
                </p>
              </Reveal>
            ))}
          </div>

          <BrandReveal>
            <div className={styles.aboutPlate}>
              <Image
                className={styles.aboutPlateMark}
                src="/Assets/logos/kzd-mark.png"
                alt=""
                width={96}
                height={95}
              />
              <span className={styles.aboutPlateWord}>KZD Solutions</span>
            </div>

            <blockquote className={styles.aboutQuote}>
              <p className={styles.aboutQuoteBody}>
                At KZD Solutions, we combine engineering, design and technology into one system — helping
                businesses cut waste, move faster and scale with confidence.
              </p>
              <cite className={styles.aboutAttrib}>Founder, KZD Solutions</cite>
            </blockquote>
          </BrandReveal>
        </div>
      </section>

      {/* 3. Services teaser --------------------------------------------------- */}
      <section className={styles.services}>
        <div className={styles.servicesWash} aria-hidden="true" />
        <div className={styles.servicesInner}>
          <div className={styles.servicesHead}>
            <h3 className={styles.servicesTitle}>
              Everything you need to
              <br />
              build, launch and scale
            </h3>
            <p className={styles.servicesSub}>We design, build and support — all under one roof.</p>
          </div>

          <ServicesRow>
            {SERVICES.map((service) => (
              <Reveal key={service.index} className={styles.servicesCard}>
                <span className={styles.servicesDot} aria-hidden="true" />
                <p className={styles.servicesIndex} aria-hidden="true">
                  {service.index}
                </p>
                <h4 className={styles.servicesName}>{service.name}</h4>
                <span className={styles.servicesRing} aria-hidden="true">
                  <svg className={styles.servicesIcon} viewBox="0 0 72 72" focusable="false" aria-hidden="true">
                    {service.icon}
                  </svg>
                </span>
                <p className={styles.servicesCopy}>{service.copy}</p>
              </Reveal>
            ))}
          </ServicesRow>
        </div>
      </section>

      {/* 4. Problems We Solve ---------------------------------------------- */}
      <section className={styles.problems}>
        <div className={styles.problemsInner}>
          <div className={styles.problemsHead}>
            <div className={styles.problemsHeadline}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} aria-hidden="true" />
                What we fix
              </span>
              <h3 className={styles.problemsTitle}>Problems We Solve.</h3>
            </div>
            <p className={styles.problemsIntro}>
              We strive to develop real-world web solutions that are ideal for small to large projects with
              your custom project requirements.
            </p>
          </div>

          <div className={styles.problemsGrid}>
            {PROBLEMS.map((problem) => (
              <Reveal key={problem.slug} className={`${styles.problemsCell} ${problem.cell}`}>
                <Image
                  src={`/images/${problem.slug}.jpg`}
                  alt=""
                  fill
                  sizes={problem.sizes}
                  className={styles.problemsImg}
                />
                <div className={styles.problemsCap}>
                  <p className={styles.problemsLabel}>{problem.label}</p>
                  <p className={styles.problemsText}>{problem.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Testimonials ------------------------------------------------------ */}
      <section className={styles.tst} aria-labelledby="home-tst-title">
        <div className={styles.tstWash} aria-hidden="true" />
        <div className={styles.tstInner}>
          <div className={styles.tstHead}>
            <h2 className={styles.tstTitle} id="home-tst-title">
              Testimonials
            </h2>
            <p className={styles.tstSub}>What our clients say, straight from Google.</p>
          </div>

          <div className={styles.tstSummary}>
            <div className={styles.tstSummaryMain}>
              <div className={styles.tstBrand}>
                <svg className={styles.tstGlogo} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                  <path style={{ fill: "var(--kzd-mark-google-blue)" }} d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" />
                  <path style={{ fill: "var(--kzd-mark-google-green)" }} d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
                  <path style={{ fill: "var(--kzd-mark-google-yellow)" }} d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 000 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z" />
                  <path style={{ fill: "var(--kzd-mark-google-red)" }} d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4636.8918 11.4264 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" />
                </svg>
                <span className={styles.tstBrandName}>Google Reviews</span>
              </div>
              <div className={styles.tstRating}>
                <span className={styles.tstScore}>{reviews.rating}</span>
                <span
                  className={styles.tstStars}
                  role="img"
                  aria-label={`Rated ${reviews.rating} out of 5`}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon key={i} name="star-fill" />
                  ))}
                </span>
                <span className={styles.tstCount}>{reviews.totalReviews} reviews</span>
              </div>
            </div>
            <a className={styles.tstCta} href={reviews.reviewUrl} target="_blank" rel="noopener noreferrer">
              Share your feedback
            </a>
          </div>

          <TestimonialsCarousel reviews={namedReviews} />
        </div>
      </section>

      {/* 6. Client showcase ---------------------------------------------------- */}
      <section className={styles.clients} aria-labelledby="home-clients-title">
        <div className={styles.clientsWash} aria-hidden="true" />
        <div className={styles.clientsInner}>
          <div className={styles.clientsHead}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              Our clients
            </span>
            <h2 className={styles.clientsTitle} id="home-clients-title">
              Live sites, real businesses.
            </h2>
            <p className={styles.clientsSub}>
              From salons to schools to online stores — businesses across South Africa taking bookings,
              selling products and enrolling learners on sites we built.
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

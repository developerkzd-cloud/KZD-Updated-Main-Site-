/* ==========================================================================
   /careers — the listing.

   A Server Component, and entirely static. The static site built every job row
   in the browser from js/kzd-store.js, so the openings were invisible to any
   crawler that does not run JavaScript — the roles themselves were unindexable.
   They are in the HTML here.

   No client boundary at all: nothing on this page is interactive beyond links.
   ========================================================================== */

import type { Metadata } from "next";
import Link from "next/link";
import { getJobs, getReviews } from "@/lib/content";
import { WHY_CARDS, HIRING_STEPS } from "./content";
import styles from "./careers.module.css";

const DESCRIPTION =
  "Work at KZD Solutions — a small Durban team building websites, software and systems for South African businesses.";

export const metadata: Metadata = {
  title: "Careers",
  description: DESCRIPTION,
  alternates: { canonical: "/careers" },
  openGraph: {
    type: "website",
    url: "/careers",
    title: "Careers | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

const STAR = "M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z";

export default function CareersPage() {
  const jobs = getJobs();
  const reviews = getReviews();
  const openCount = jobs.filter((j) => j.status === "open").length;

  return (
    <main className={styles.car}>
      <section className={styles.hero}>
        <div className={styles.wash} aria-hidden="true" />
        <div className={styles.inner}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Careers
          </span>
          <h1 className={styles.h1}>
            Work at<br className={styles.br} /> KZD Solutions
          </h1>
          <p className={styles.intro}>
            We are a small Durban team building websites, software and systems for South African
            businesses. If you want to do real work early and learn from people who will actually
            explain things, we would like to meet you.
          </p>
        </div>
      </section>

      <section className={styles.jobs} aria-labelledby="car-openings">
        <div className={styles.inner}>
          <h2 className={styles.h2} id="car-openings">Current openings</h2>
          <p className={styles.count}>
            {openCount === 0
              ? "No open positions right now"
              : openCount + " open " + (openCount === 1 ? "position" : "positions")}
          </p>

          <ul className={styles.list}>
            {jobs.map((job) => {
              const open = job.status === "open";
              return (
                <li key={job.id} className={styles.row + " " + (open ? styles.rowOpen : styles.rowClosed)}>
                  <div>
                    <div className={styles.chips}>
                      <span className={styles.chip + " " + (open ? styles.chipOpen : styles.chipClosed)}>
                        <span className={styles.chipDot} aria-hidden="true" />
                        {open ? "Open" : "Closed"}
                      </span>
                      {job.department && (
                        <span className={styles.chip + " " + styles.chipDept}>{job.department}</span>
                      )}
                    </div>

                    {/* The title opens the detail page. Without it the only route
                        out of the listing is "Apply now", which skips the
                        description entirely. */}
                    <h3 className={styles.title}>
                      <Link className={styles.titleLink} href={"/careers/" + job.id}>
                        {job.title}
                      </Link>
                    </h3>

                    <p className={styles.meta}>{[job.location, job.type].filter(Boolean).join(" · ")}</p>
                  </div>

                  <p className={styles.summary}>{job.summary}</p>

                  {open ? (
                    <Link
                      className={styles.apply}
                      href={"/careers/" + job.id + "#apply"}
                      aria-label={"Apply now for " + job.title}
                    >
                      Apply now
                    </Link>
                  ) : (
                    /* Genuinely disabled, so Tab skips it. */
                    <button type="button" className={styles.apply + " " + styles.applyClosed} disabled>
                      Position filled
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className={styles.why} aria-labelledby="car-why">
        <div className={styles.inner}>
          <h2 className={styles.h2} id="car-why">Why work here</h2>
          <div className={styles.whyGrid}>
            {WHY_CARDS.map((card) => (
              <div className={styles.whyCard} key={card.title}>
                <span className={styles.whyRule} aria-hidden="true" />
                <h3 className={styles.whyTitle}>{card.title}</h3>
                <p className={styles.whyBody}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.how} aria-labelledby="car-how">
        <div className={styles.inner}>
          <h2 className={styles.h2} id="car-how">How hiring works</h2>
          <div className={styles.steps}>
            {HIRING_STEPS.map((step, i) => (
              <div className={styles.step} key={step.title}>
                <p className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</p>
                <hr className={styles.stepRule} />
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.people} aria-labelledby="car-people">
        <div className={styles.inner}>
          <div className={styles.peopleCard}>
            <div className={styles.peopleL}>
              {/* Official four-colour Google G, not recoloured. */}
              <svg className={styles.glogo} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 000 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z" />
                <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4636.8918 11.4264 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" />
              </svg>
              <div className={styles.rating}>
                <span className={styles.score}>{reviews.rating}</span>
                <span className={styles.stars} role="img" aria-label={"Rated " + reviews.rating + " out of 5"}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg key={i} viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
                  ))}
                </span>
              </div>
            </div>
            <div>
              <h2 className={styles.peopleTitle} id="car-people">We focus on people</h2>
              <p className={styles.peopleBody}>
                {reviews.totalReviews} reviews, {reviews.rating} stars. The same care we put into
                client work goes into how we treat the people who do it.
              </p>
              <a
                className={styles.peopleLink}
                href={reviews.readAllUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read reviews on Google
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

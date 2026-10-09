/* ==========================================================================
   /careers/[id] — one role.

   The static site read the job id from a query string and built the whole page
   in the browser, so every role shared job.html's generic <head> and no role
   was independently indexable. Here each role is prerendered with its own
   metadata and JobPosting structured data.

   Next 16: params is a Promise and must be awaited.
   ========================================================================== */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob, getJobs, type Job } from "@/lib/content";
import JobTabs from "./JobTabs";
import ShareJob from "./ShareJob";
import styles from "./job.module.css";
import Icon from "@/components/Icon/Icon";

const SITE = "https://kzdsolutions.co.za";

const ICONS = { pin: "geo-alt", clock: "clock", people: "people" } as const;

export function generateStaticParams() {
  return getJobs().map((job) => ({ id: job.id }));
}

export async function generateMetadata(props: PageProps<"/careers/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const job = getJob(id);
  if (!job) return { title: "Role not found" };

  const description = job.summary;
  const title = `${job.title} — ${job.location} | KZD Solutions`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/careers/${job.id}` },
    openGraph: {
      type: "website",
      url: `${SITE}/careers/${job.id}`,
      title,
      description,
      siteName: "KZD Solutions",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/* Plain bullets, or bold-lead bullets where the data carries a title and a
   body ("Why KZD Solutions?" and "What we offer"). */
function Bullets({ items, ember = false }: { items: readonly string[]; ember?: boolean }) {
  return (
    <ul className={`${styles.list} ${ember ? styles.listEmber : ""}`}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function LeadBullets({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <ul className={`${styles.list} ${styles.listEmber}`}>
      {items.map((item) => (
        <li key={item.title}>
          <span className={styles.lead}>{item.title}</span>
          {item.body}
        </li>
      ))}
    </ul>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>{heading}</h2>
      {children}
    </section>
  );
}

function MetaList({ job, className }: { job: Job; className: string }) {
  const rows = [
    ["pin", job.location],
    ["clock", job.type],
    ["people", job.department],
  ] as const;

  return (
    <ul className={className}>
      {rows
        .filter(([, value]) => Boolean(value))
        .map(([icon, value]) => (
          <li key={icon}>
            <Icon name={ICONS[icon]} size="dense" />
            {value}
          </li>
        ))}
    </ul>
  );
}

export default async function JobPage(props: PageProps<"/careers/[id]">) {
  const { id } = await props.params;
  const job = getJob(id);
  if (!job) notFound();

  const d = job.detail;
  const open = job.status === "open";

  /* Server-rendered, never injected client-side. JobPosting is what Google
     Jobs reads; the static site emitted none of this. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: [job.summary, ...(d.description ?? [])].join(" "),
    employmentType: job.type,
    hiringOrganization: {
      "@type": "Organization",
      name: "KZD Solutions",
      sameAs: SITE,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "ZA",
      },
    },
    ...(open ? {} : { validThrough: new Date().toISOString().slice(0, 10) }),
  };

  const details = (
    <div className={styles.inner}>
      <div className={styles.grid}>
        <div>
          {d.description?.length > 0 && (
            <Section heading="Job description">
              {d.description.map((p, i) => (
                <p className={styles.p} key={i}>{p}</p>
              ))}
            </Section>
          )}
          {d.why?.length > 0 && (
            <Section heading="Why KZD Solutions?"><LeadBullets items={d.why} /></Section>
          )}
          {d.workOn?.length > 0 && (
            <Section heading="What you will work on"><Bullets items={d.workOn} /></Section>
          )}
          {d.lookingFor?.length > 0 && (
            <Section heading="What we are looking for"><Bullets items={d.lookingFor} /></Section>
          )}
          {d.niceToHave?.length > 0 && (
            <Section heading="Nice to have"><Bullets items={d.niceToHave} /></Section>
          )}
          {d.offer?.length > 0 && (
            <Section heading="What we offer"><LeadBullets items={d.offer} /></Section>
          )}

          {/* Second call to action, so someone who read to the bottom need not
              scroll back up. */}
          <div className={styles.tail}>
            {open ? (
              <a className={`${styles.btn} ${styles.btnPrimary}`} href="#apply">
                Apply for this role
              </a>
            ) : (
              <p className={styles.p} style={{ marginTop: 0 }}>
                This role has been filled and is no longer accepting applications.
              </p>
            )}
          </div>
        </div>

        <aside className={styles.side}>
          <div className={styles.sideActions}>
            {open && (
              <a className={`${styles.btn} ${styles.btnPrimary}`} href="#apply">
                Apply for this role
              </a>
            )}
            <ShareJob />
          </div>
          <MetaList job={job} className={styles.sideMeta} />
        </aside>
      </div>
    </div>
  );

  const apply = (
    <div className={styles.inner}>
      <div className={styles.notice}>
        <p className={styles.noticeTitle}>
          {open ? "The application form is not on this build yet" : "This role has been filled"}
        </p>
        <p className={styles.noticeBody}>
          {open ? (
            <>
              The careers form, account creation and CV upload are being ported in the next phase of
              the migration. In the meantime, apply by email at{" "}
              <a href={`mailto:info@kzdsolutions.co.za?subject=Application: ${job.title}`}>
                info@kzdsolutions.co.za
              </a>
              .
            </>
          ) : (
            <>
              We are no longer accepting applications for this role. Other openings are on the{" "}
              <Link href="/careers">careers page</Link>.
            </>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <main className={styles.job}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />

      <header className={styles.head}>
        <div className={styles.inner}>
          <Link className={styles.back} href="/careers">
            <Icon name="arrow-left" size="dense" />
            All openings
          </Link>
          <div className={styles.headIn}>
            <h1 className={styles.title}>{job.title}</h1>
            <MetaList job={job} className={styles.metaLine} />
          </div>
        </div>
      </header>

      <JobTabs details={details} apply={apply} />
    </main>
  );
}

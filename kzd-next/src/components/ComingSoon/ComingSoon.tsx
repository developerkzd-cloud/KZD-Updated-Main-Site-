/* ==========================================================================
   ComingSoon — the placeholder for pages parked while they are rebuilt
   (blog, hosting, WordPress hosting, the domain pages). The same page as
   css/kzd-coming-soon.css on the static site.
   ========================================================================== */

import Link from "next/link";
import styles from "./ComingSoon.module.css";

export default function ComingSoon({ section }: { section: string }) {
  return (
    <main className={styles.soon}>
      <section className={styles.inner} aria-labelledby="kzd-soon-title">
        <p className={styles.eyebrow}>{section}</p>
        <h1 className={styles.title} id="kzd-soon-title">
          Coming soon
        </h1>
        <p className={styles.body}>
          We are working on this page. In the meantime, get in touch and we will help you directly.
        </p>
        <div className={styles.actions}>
          <Link className="kzd-btn kzd-btn--primary" href="/">
            Back to home
          </Link>
          <Link className="kzd-btn kzd-btn--accent" href="/contact">
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}

"use client";

/* ==========================================================================
   PopularTldGrid — the "Popular TLDs" card row shared by domain-pricing.html
   and tld-extensions.html (four data-category="popular" tld-card elements).
   Only the Register button is interactive, so this stays a small leaf
   rather than pulling the whole page into "use client".
   ========================================================================== */

import type { Tld } from "@/lib/content";
import { formatPrice, goToDomainOrder } from "@/lib/kzd-integration";
import styles from "./tld-extensions.module.css";

export default function PopularTldGrid({ popular, allTlds }: { popular: Tld[]; allTlds: Tld[] }) {
  return (
    <div className={styles.popularGrid}>
      {popular.map((tld, i) => (
        <div className={styles.popularCard} key={tld.ext}>
          <div className={styles.popularHead}>
            <span className={styles.popularExt}>{tld.ext}</span>
            {i === 0 && <span className={styles.popularBadge}>Most Popular</span>}
          </div>
          <p className={styles.popularDesc}>{tld.description}</p>
          <p className={styles.popularPrice}>{formatPrice(tld.register)}/year</p>
          <button
            type="button"
            className={styles.popularBtn}
            onClick={() => goToDomainOrder(allTlds, tld.ext)}
          >
            Register
          </button>
        </div>
      ))}
    </div>
  );
}

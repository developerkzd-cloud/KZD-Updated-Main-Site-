"use client";

/* ==========================================================================
   PricingSearch — ported from domain-pricing.html's #pricingSearch +
   filterTLDs(). Filters the full TLD table live as the customer types,
   using the one shared filterTlds() implementation (src/lib/kzd-integration.ts)
   rather than re-matching rows by hand.
   ========================================================================== */

import { useMemo, useState } from "react";
import type { Tld } from "@/lib/content";
import { filterTlds } from "@/lib/kzd-integration";
import TldTable from "@/components/TldTable/TldTable";
import styles from "./pricing.module.css";

export default function PricingSearch({ tlds }: { tlds: Tld[] }) {
  const [term, setTerm] = useState("");
  const rows = useMemo(() => filterTlds(tlds, term), [tlds, term]);

  return (
    <>
      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search domain extensions…"
          aria-label="Search domain extensions"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <p className={styles.count}>
          {rows.length} of {tlds.length} extension{tlds.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className={styles.tableSection}>
        <TldTable rows={rows} allTlds={tlds} variant="full" />
      </div>
    </>
  );
}

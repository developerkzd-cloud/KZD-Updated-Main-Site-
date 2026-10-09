"use client";

/* ==========================================================================
   TldTable — the one table renderer shared by /domains/pricing and
   /domains/tld-extensions, replacing the duplicated renderRows()/table
   markup that used to live inline in domain-pricing.html and
   tld-extensions.html.

   `rows` is whatever subset of the catalog this table should show (already
   filtered/split by the caller); `allTlds` is always the full catalog,
   because goToDomainOrder()/splitDomain() need to see every known TLD to
   parse a domain correctly, not just the ones in this particular table.

   "simple" shows one price column (register/yr, as tld-extensions.html
   did). "full" adds transfer and renewal columns (as domain-pricing.html's
   "All Domain Extensions" table did).
   ========================================================================== */

import type { Tld } from "@/lib/content";
import { formatPrice, goToDomainOrder } from "@/lib/kzd-integration";
import styles from "./TldTable.module.css";

export default function TldTable({
  rows,
  allTlds,
  variant = "simple",
  emptyMessage = "No extensions match your search.",
}: {
  rows: Tld[];
  allTlds: Tld[];
  variant?: "simple" | "full";
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thDomain}>Domain</th>
            <th className={styles.thDesc}>Description</th>
            <th className={styles.thPrice}>Register</th>
            {variant === "full" && (
              <>
                <th className={styles.thPrice}>Transfer</th>
                <th className={styles.thPrice}>Renew</th>
              </>
            )}
            <th className={styles.thAction}>
              <span className="kzd-sr">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tld) => (
            <tr className={styles.row} key={tld.ext}>
              <td className={styles.ext}>
                {tld.ext}
                {tld.popular && <span className={styles.badge}>Popular</span>}
              </td>
              <td className={styles.desc}>{tld.description}</td>
              <td className={styles.price}>{formatPrice(tld.register)}/yr</td>
              {variant === "full" && (
                <>
                  <td className={styles.price}>{formatPrice(tld.transfer)}/yr</td>
                  <td className={styles.price}>{formatPrice(tld.renew)}/yr</td>
                </>
              )}
              <td className={styles.actionCell}>
                <button
                  type="button"
                  className={styles.registerBtn}
                  onClick={() => goToDomainOrder(allTlds, tld.ext)}
                >
                  Register
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

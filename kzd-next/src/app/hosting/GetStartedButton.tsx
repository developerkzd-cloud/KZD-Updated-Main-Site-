"use client";

/* ==========================================================================
   GET STARTED — hands off to the FOSSBilling order flow for one hosting or
   email product. Ported from hosting.html's inline
   onclick="KZD.goToHostingOrder('hostingStarter')" handlers; a plain <a href>
   can't carry the productKey -> FOSSBilling product id lookup, so this is a
   client-side click handler instead.
   ========================================================================== */

import { goToHostingOrder, type HostingProductKey } from "@/lib/kzd-integration";
import styles from "./hosting.module.css";

export default function GetStartedButton({
  productKey,
  className,
}: {
  productKey: HostingProductKey;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${className ?? ""}`}
      onClick={() => goToHostingOrder(productKey)}
    >
      GET STARTED
    </button>
  );
}

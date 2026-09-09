"use client";

/* Copy-link button for a job. Separate from the tab switch so the sidebar does
   not need to sit inside the tab component. */

import { useState } from "react";
import styles from "./job.module.css";

export default function ShareJob() {
  const [done, setDone] = useState(false);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* Clipboard can be blocked (no permission, insecure origin). The URL is
         in the address bar either way, so there is nothing useful to say. */
    }
  }

  return (
    <button
      type="button"
      className={`${styles.btn} ${styles.btnGhost} ${done ? styles.btnDone : ""}`}
      onClick={share}
    >
      {done ? "Link copied" : "Share this job"}
    </button>
  );
}

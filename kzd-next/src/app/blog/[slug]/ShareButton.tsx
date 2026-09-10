"use client";

/* Copy-link button. The only client code on an article route — everything
   else, including the JSON-LD, is server-rendered. */

import { useState } from "react";
import styles from "../blog.module.css";

export default function ShareButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);

  async function share() {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* Clipboard is blocked in some contexts (no permission, insecure origin).
         Nothing useful to say — the URL is in the address bar either way. */
    }
  }

  return (
    <button
      type="button"
      className={`${styles.share} ${done ? styles.shareDone : ""}`}
      onClick={share}
    >
      {done ? "Link copied" : "Share"}
    </button>
  );
}

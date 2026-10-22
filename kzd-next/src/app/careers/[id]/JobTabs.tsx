"use client";

/* ==========================================================================
   The Job details / Apply tab switch.

   Both panels arrive as already-rendered children, so the job description
   stays server-rendered HTML — a crawler sees the full role even though the
   tab strip is interactive. Only the selection lives on the client.

   The selection follows the URL hash, which is what makes the listing page's
   "Apply now" button land on the right panel: it links to
   /careers/<id>#apply. The hash is read through useSyncExternalStore rather
   than an effect, because the server has no hash — getServerSnapshot returns
   "" so the server and the first client render agree, and React 19 rightly
   rejects the setState-in-an-effect version of this.

   An explicit tab click overrides the hash until the hash next changes.
   ========================================================================== */

import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import styles from "./job.module.css";

type TabId = "details" | "apply";

const TABS = [
  ["details", "Job details"],
  ["apply", "Application"],
] as const;

export default function JobTabs({ details, apply }: { details: ReactNode; apply: ReactNode }) {
  const [override, setOverride] = useState<TabId | null>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    /* A new hash means a fresh intent — drop any earlier click. Setting state
       from an event handler is fine; setting it from an effect body is not. */
    const handler = () => {
      setOverride(null);
      onStoreChange();
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => ""
  );

  const tab: TabId = override ?? (hash === "#apply" ? "apply" : "details");

  return (
    <>
      <div className={styles.tabsWrap}>
        <div className={styles.tabs} role="tablist" aria-label="Job detail sections">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              className={styles.tab}
              aria-controls={`panel-${id}`}
              aria-selected={tab === id}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setOverride(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section
        className={styles.panel}
        id="panel-details"
        role="tabpanel"
        aria-labelledby="tab-details"
        tabIndex={0}
        hidden={tab !== "details"}
      >
        {details}
      </section>

      <section
        className={styles.panel}
        id="panel-apply"
        role="tabpanel"
        aria-labelledby="tab-apply"
        tabIndex={0}
        hidden={tab !== "apply"}
      >
        {apply}
      </section>
    </>
  );
}

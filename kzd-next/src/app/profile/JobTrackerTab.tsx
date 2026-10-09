"use client";

/* ==========================================================================
   Tab 3: "Job tracker" — a Kanban-style board of the signed-in applicant's
   own applications, grouped into Applied / Interviewing / Offer. No action
   button anywhere here: an applicant cannot move their own application, only
   an admin can. Ported from buildTrackerTab() in js/kzd-profile.js.
   ========================================================================== */

import Image from "next/image";
import type { KzdApplication } from "@/lib/kzdStore";
import { fmtDate, nonEmpty } from "./helpers";
import styles from "./profile.module.css";

const STAGES = ["applied", "interviewing", "offer"] as const;
type Stage = (typeof STAGES)[number];

const LABELS: Record<Stage, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
};

export function stageOf(app: KzdApplication): Stage {
  const s = (app.stage || "").toLowerCase();
  return (STAGES as readonly string[]).includes(s) ? (s as Stage) : "applied";
}

export default function JobTrackerTab({ apps }: { apps: KzdApplication[] }) {
  return (
    <div className={styles.tabBody}>
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.cardH}>Job tracker</h2>
            <p className={styles.cardSub}>Roles you have applied for at KZD Solutions</p>
          </div>
        </div>

        <div className={styles.board}>
          {STAGES.map((stage) => {
            const mine = apps.filter((a) => stageOf(a) === stage);
            return (
              <div className={`${styles.col} ${styles[`col_${stage}`]}`} key={stage}>
                <p className={styles.colLabel}>
                  {LABELS[stage]} ({mine.length})
                </p>
                <div className={styles.colBody}>
                  {mine.length === 0 ? (
                    <p className={styles.colEmpty}>Nothing here yet</p>
                  ) : (
                    mine.map((a, i) => (
                      <article className={styles.appCard} key={a.id ?? `${a.jobId}-${i}`}>
                        <div className={styles.appTop}>
                          <span className={styles.appMark}>
                            <Image src="/Assets/logos/kzd-mark.png" alt="" width={32} height={32} />
                          </span>
                          <div>
                            <p className={styles.appTitle}>{a.jobTitle || a.jobId || "Application"}</p>
                            {[a.department, a.jobLocation || a.location].filter(nonEmpty).join(" · ") && (
                              <p className={styles.appMeta}>
                                {[a.department, a.jobLocation || a.location].filter(nonEmpty).join(" · ")}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* TODO(backend): when the admin dashboard can schedule
                            interviews, fill this line with the date, time and
                            format (in person / online). Left in place and empty
                            so adding that needs no restructuring of the card. */}
                        {stage === "interviewing" && nonEmpty(a.interviewAt) && (
                          <p className={styles.appSchedule}>
                            {[fmtDate(a.interviewAt), a.interviewTime, a.interviewFormat]
                              .filter(nonEmpty)
                              .join(" · ")}
                          </p>
                        )}

                        <p className={styles.appDate}>Applied {fmtDate(a.submittedAt)}</p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import styles from "./page.module.css";

/* Scaffold placeholder for Phase 3a. Its only job is to prove the tokens, the
   three self-hosted faces and CSS Modules are wired before anything real is
   ported. Replaced by the real homepage in 3c. */
export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.eyebrow}>Phase 3a — scaffold</span>
        <h1 className={styles.title}>Next.js scaffold is live</h1>
        <p className={styles.lede}>
          Tokens, fonts and CSS Modules are wired. Nothing is ported yet.
        </p>

        <div className={styles.checks}>
          <div className={styles.check}>
            <span className={styles.dot} />
            <span className={styles.display}>Inter Tight renders here (display)</span>
          </div>
          <div className={styles.check}>
            <span className={styles.dot} />
            <span className={styles.sans}>Inter renders here (body)</span>
          </div>
          <div className={styles.check}>
            <span className={styles.dot} />
            <span className={styles.mono}>JetBrains Mono renders here (mono)</span>
          </div>
          <div className={styles.check}>
            <span className={styles.dot} />
            <span>Design tokens resolved from globals.css</span>
          </div>
        </div>

        <div className={styles.row}>
          <button className={`${styles.btn} ${styles.primary}`} type="button">
            Primary 42px
          </button>
          <button className={`${styles.btn} ${styles.ghost}`} type="button">
            Ghost 42px
          </button>
        </div>
      </div>
    </main>
  );
}

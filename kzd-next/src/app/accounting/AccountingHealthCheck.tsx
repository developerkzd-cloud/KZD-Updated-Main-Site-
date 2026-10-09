"use client";

/* ==========================================================================
   AccountingHealthCheck — the interactive checklist, package recommendation
   and lead form from accounting.html, ported 1:1 from the page's inline
   <script>.

   Kept as one client component (rather than three) because the sections
   share state that the legacy script also treated as one unit:
     - every checkbox change recomputes the tick count, progress bar width
       and the live "recommended package" (updateScoreAndProgress)
     - the "View My Recommended Package" button highlights a package card
       AND pre-fills the lead form's package dropdown AND scrolls to the
       package section (viewBtn click handler)
     - each package's own "select" button pre-fills the same dropdown AND
       scrolls to the lead form (package-select-btn click handler)
     - the lead form reads the dropdown plus the live score/answers on submit

   Splitting these into separate leaves would mean lifting all of this state
   into a parent anyway, so one component is the more honest shape.
   ========================================================================== */

import { useMemo, useRef, useState } from "react";
import styles from "./accounting.module.css";

/* -------------------------------------------------------------------------- */
/* Checklist copy — verbatim from accounting.html #checklist                  */
/* -------------------------------------------------------------------------- */

type ChecklistItem = { id: string; label: string };
type ChecklistGroup = { title: string; items: ChecklistItem[] };

const CHECKLIST_GROUPS: ChecklistGroup[] = [
  {
    title: "Financial Records",
    items: [
      { id: "fin1", label: "My income and expenses are recorded monthly" },
      { id: "fin2", label: "I have up-to-date management accounts" },
      { id: "fin3", label: "I have annual financial statements" },
      { id: "fin4", label: "My records are updated within the last 30 days" },
    ],
  },
  {
    title: "Tax & Compliance",
    items: [
      { id: "tax1", label: "All tax returns are submitted on time" },
      { id: "tax2", label: "EMP201 / PAYE is filed monthly" },
      { id: "tax3", label: "My company is correctly registered (CIPC, VAT if applicable)" },
      { id: "tax4", label: "I understand my tax obligations" },
    ],
  },
  {
    title: "Controls & Risk",
    items: [
      { id: "ctrl1", label: "Duties are properly segregated" },
      { id: "ctrl2", label: "Suppliers are vetted before approval" },
      { id: "ctrl3", label: "We have documented internal processes" },
      { id: "ctrl4", label: "A risk register is maintained" },
    ],
  },
  {
    title: "Assets & People",
    items: [
      { id: "asset1", label: "We maintain a fixed asset register" },
      { id: "asset2", label: "Payroll is reviewed and reconciled" },
      { id: "asset3", label: "Staff performance is tracked" },
      { id: "asset4", label: "There is a structured incentive or bonus system" },
    ],
  },
];

const ALL_IDS: string[] = CHECKLIST_GROUPS.flatMap((g) => g.items.map((i) => i.id));
const TOTAL = ALL_IDS.length; // 16

/* -------------------------------------------------------------------------- */
/* Package copy — verbatim from accounting.html #packageSection               */
/* -------------------------------------------------------------------------- */

type PackageKey = "pkgHigh" | "pkgMid" | "pkgLow" | "pkgCustom";

type PackageDef = {
  key: PackageKey;
  name: string;
  desc: string;
  desc2: string;
  cta: string;
};

const PACKAGES: PackageDef[] = [
  {
    key: "pkgHigh",
    name: "Governance & Growth Package",
    desc: "Your foundation is strong — but governance and strategic refinement may still be needed.",
    desc2: "We help you optimise, protect and scale safely.",
    cta: "Strengthen Governance",
  },
  {
    key: "pkgMid",
    name: "Compliance + Control Package",
    desc: "You likely have compliance or internal control gaps.",
    desc2: "We make your business audit‑ready and structured.",
    cta: "Make Audit‑Ready",
  },
  {
    key: "pkgLow",
    name: "Compliance Starter",
    desc: "Your business may be exposed to financial, tax or audit risk.",
    desc2: "We stabilise records and bring you back into compliance.",
    cta: "Stabilise Now",
  },
  {
    key: "pkgCustom",
    name: "Custom Projects",
    desc: "Funded projects, internal clean‑ups, or specialised needs.",
    desc2: "Tailored assessment for unique requirements.",
    cta: "Request Custom Assessment →",
  },
];

/**
 * getRecommendedPackageByScore — ported 1:1 from accounting.html's inline
 * script:
 *
 *   if (checked >= 12) return pkgHigh;       // Governance & Growth Package
 *   else if (checked >= 6) return pkgMid;    // Compliance + Control Package
 *   else return pkgLow;                      // Compliance Starter
 *
 * "Custom Projects" is never chosen by score — it is only ever picked by
 * clicking its own select button, exactly as in the legacy markup.
 */
function getRecommendedPackageByScore(checked: number): PackageKey {
  if (checked >= 12) return "pkgHigh";
  if (checked >= 6) return "pkgMid";
  return "pkgLow";
}

const BUSINESS_TYPES = ["Individual / Sole Trader", "Startup", "Registered Company", "Non-Profit"];
const BUSINESS_SIZES = ["Just me (1 person)", "2–5 employees", "6–20 employees", "20+ employees"];
const MONTHLY_REVENUES = ["Pre-revenue", "Under R50k", "R50k – R250k", "R250k – R1M", "R1M+"];
const CHECKLIST_RESULTS = ["0–5 ticks", "6–10 ticks", "11–16 ticks"];

type FormStatus = { kind: "idle" | "sending" | "success" | "error"; message: string };

export default function AccountingHealthCheck() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [highlighted, setHighlighted] = useState<PackageKey | null>(null);
  const [selectedPackage, setSelectedPackage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [businessSize, setBusinessSize] = useState(BUSINESS_SIZES[0]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(MONTHLY_REVENUES[0]);
  const [checklistResultDisplay, setChecklistResultDisplay] = useState(CHECKLIST_RESULTS[0]);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle", message: "" });

  const packageSectionRef = useRef<HTMLDivElement>(null);
  const leadFormRef = useRef<HTMLDivElement>(null);

  const checkedCount = useMemo(() => ALL_IDS.filter((id) => checked[id]).length, [checked]);
  const checklistAnswers = useMemo(() => ALL_IDS.filter((id) => checked[id]).join(", "), [checked]);
  const recommendedKey = useMemo(() => getRecommendedPackageByScore(checkedCount), [checkedCount]);
  const recommendedPackage = useMemo(
    () => PACKAGES.find((p) => p.key === recommendedKey)!.name,
    [recommendedKey]
  );
  const progressPct = (checkedCount / TOTAL) * 100;

  function toggleItem(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleViewRecommendation() {
    setHighlighted(recommendedKey);
    setSelectedPackage(recommendedPackage);
    packageSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handlePackageSelect(pkg: PackageDef) {
    setSelectedPackage(pkg.name);
    leadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedPackage) {
      setStatus({ kind: "error", message: "Please select a package before submitting." });
      return;
    }

    setStatus({ kind: "sending", message: "Sending your health review..." });

    try {
      const res = await fetch("/api/accounting-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          business_type: businessType,
          business_size: businessSize,
          monthly_revenue: monthlyRevenue,
          checklist_result_display: checklistResultDisplay,
          selected_package: selectedPackage,
          recommended_package: recommendedPackage,
          checklist_score: checkedCount,
          checklist_answers: checklistAnswers,
        }),
      });
      const data = (await res.json()) as { success: boolean; message: string };

      if (data.success) {
        setStatus({ kind: "success", message: data.message });
        setName("");
        setEmail("");
        setPhone("");
        setBusinessType(BUSINESS_TYPES[0]);
        setBusinessSize(BUSINESS_SIZES[0]);
        setMonthlyRevenue(MONTHLY_REVENUES[0]);
        setChecklistResultDisplay(CHECKLIST_RESULTS[0]);
        setSelectedPackage("");
        setChecked({});
        setHighlighted(null);
      } else {
        setStatus({ kind: "error", message: data.message });
      }
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <>
      {/* Checklist ------------------------------------------------------- */}
      <section id="checklist" className={styles.checklist}>
        <div className={styles.inner}>
          <div className={styles.checklistHead}>
            <span className={styles.pill}>SME Financial Check-Up</span>
            <h2 className={styles.h2} style={{ marginTop: 16 }}>
              Is Your Business Financially Healthy?
            </h2>
            <p className={styles.lead}>
              Tick the statements that apply. If you cannot confidently tick most, you may be at risk.
            </p>

            <div className={styles.progressWrap}>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-valuenow={checkedCount}
                aria-valuemin={0}
                aria-valuemax={TOTAL}
                aria-label="Business health checklist progress"
              >
                <div className={styles.progressFill} style={{ width: progressPct + "%" }} />
              </div>
              <div className={styles.progressLabels}>
                <span>0 ticks</span>
                <span className={styles.tickCounter}>
                  {checkedCount}/{TOTAL}
                </span>
                <span>{TOTAL} ticks</span>
              </div>
            </div>
          </div>

          <div className={styles.checklistGrid}>
            {CHECKLIST_GROUPS.map((group) => (
              <div className={styles.checklistCard} key={group.title}>
                <h3 className={styles.checklistCardTitle}>{group.title}</h3>
                {group.items.map((item) => (
                  <div className={styles.checkRow} key={item.id}>
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={!!checked[item.id]}
                      onChange={() => toggleItem(item.id)}
                    />
                    <label htmlFor={item.id}>{item.label}</label>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className={styles.checklistActions}>
            <button type="button" className={styles.btnRecommend} onClick={handleViewRecommendation}>
              View My Recommended Package
            </button>
            <div className={styles.ctaRow}>
              <a className={styles.btnDark} href="#leadForm">
                Get My Business Health Review
              </a>
              <a
                className={styles.btnOutlineDark}
                href="https://kzdsolutions.setmore.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Strategy Call
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Package recommendation ------------------------------------------- */}
      <section id="packageSection" className={styles.pkgSection} ref={packageSectionRef}>
        <div className={styles.inner}>
          <h3 className={styles.h2 + " " + styles.pkgTitle}>What Your Results Mean</h3>
          <div className={styles.pkgGrid}>
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.key}
                className={
                  styles.pkgCard + " " + (highlighted === pkg.key ? styles.pkgCardRecommended : "")
                }
              >
                <h4 className={styles.pkgName}>{pkg.name}</h4>
                <p className={styles.pkgDesc}>{pkg.desc}</p>
                <p className={styles.pkgDesc2}>{pkg.desc2}</p>
                <div className={styles.pkgBtnWrap}>
                  <button type="button" className={styles.pkgBtn} onClick={() => handlePackageSelect(pkg)}>
                    {pkg.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner --------------------------------------------------------- */}
      <section className={styles.banner}>
        <div className={styles.inner}>
          <h2 className={styles.h2 + " " + styles.bannerTitle}>
            We Don&apos;t Just Do Accounting. We Structure Businesses.
          </h2>
          <hr className={styles.divider} />
          <p className={styles.bannerSub}>Don&apos;t Wait For SARS Or An Auditor To Tell You Something Is Wrong.</p>
          <div className={styles.bannerCtas}>
            <a className={styles.btnDark} href="#checklist">
              Start My Business Health Check
            </a>
            <a
              className={styles.btnOutlineDark}
              href="https://kzdsolutions.setmore.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Strategy Call
            </a>
          </div>
        </div>
      </section>

      {/* Lead form ------------------------------------------------------------ */}
      <section id="leadForm" className={styles.leadSection} ref={leadFormRef}>
        <div className={styles.inner}>
          <div className={styles.leadWrap}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Get Your Business Health Review</h3>
              <p className={styles.cardSub}>
                Tell us a little about your business and we&apos;ll recommend the right solution.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="packageSelect">
                    Select Package <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="packageSelect"
                    name="selected_package"
                    className={styles.select}
                    required
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                  >
                    <option value="">-- Please select a package --</option>
                    {PACKAGES.map((pkg) => (
                      <option key={pkg.key} value={pkg.name}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                  <small className={styles.hint}>Click on any package above to auto-select it here</small>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="name">
                    Full Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={styles.input}
                    placeholder="Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="email">
                    Email Address <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={styles.input}
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="phone">
                    Phone Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={styles.input}
                    placeholder="+27 ..."
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="businessType">
                    Business Type
                  </label>
                  <select
                    id="businessType"
                    name="business_type"
                    className={styles.select}
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  >
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="businessSize">
                    Business Size
                  </label>
                  <select
                    id="businessSize"
                    name="business_size"
                    className={styles.select}
                    value={businessSize}
                    onChange={(e) => setBusinessSize(e.target.value)}
                  >
                    {BUSINESS_SIZES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="monthlyRevenue">
                    Monthly Revenue (optional)
                  </label>
                  <select
                    id="monthlyRevenue"
                    name="monthly_revenue"
                    className={styles.select}
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(e.target.value)}
                  >
                    {MONTHLY_REVENUES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="checklistResultDisplay">
                    Checklist Result (from earlier)
                  </label>
                  <select
                    id="checklistResultDisplay"
                    name="checklist_result_display"
                    className={styles.select}
                    value={checklistResultDisplay}
                    onChange={(e) => setChecklistResultDisplay(e.target.value)}
                  >
                    {CHECKLIST_RESULTS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={status.kind === "sending"}>
                  {status.kind === "sending" ? "Sending..." : "Get My Business Health Recommendation"}
                </button>
              </form>

              {status.kind !== "idle" && (
                <p
                  className={
                    styles.status +
                    " " +
                    (status.kind === "success"
                      ? styles.statusOk
                      : status.kind === "error"
                        ? styles.statusErr
                        : styles.statusMuted)
                  }
                  role="status"
                  aria-live="polite"
                >
                  {status.kind === "success" ? "✓ " : status.kind === "error" ? "✗ " : ""}
                  {status.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

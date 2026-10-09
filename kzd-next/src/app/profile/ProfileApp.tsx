"use client";

/* ==========================================================================
   The applicant profile / job-application dashboard. Ported as-is from
   profile.html + js/kzd-profile.js as a client-only prototype: everything
   here reads and writes localStorage on this one device, through
   @/lib/kzdStore, and nothing is shared between browsers or protected by a
   real server. See the header comment in src/lib/kzdStore.ts.

   This is the single "use client" boundary for the whole route. page.tsx is
   a thin Server Component that only carries the metadata; everything
   state-driven — auth, tabs, hydration, editing — lives here and below.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  blankProfile,
  getApplications,
  getProfile,
  getSession,
  getUsers,
  saveProfile,
  type KzdApplication,
  type KzdProfile,
  type KzdSession,
} from "@/lib/kzdStore";
import ProfileTab from "./ProfileTab";
import PersonalInfoTab from "./PersonalInfoTab";
import JobTrackerTab, { stageOf } from "./JobTrackerTab";
import styles from "./profile.module.css";

type TabId = "profile" | "personal" | "tracker";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "personal", label: "Personal info" },
  { id: "tracker", label: "Job tracker" },
];

const STAGE_ORDER = ["applied", "interviewing", "offer"] as const;

interface Weight {
  id: "personal" | "cv" | "experience" | "education" | "skills" | "links" | "languages" | "projects";
  weight: number;
  label: string;
  done: (profile: KzdProfile, hasCV: boolean) => boolean;
}

/* Weights sum to exactly 100. Every one is evaluated against live data on
   every render — nothing here is a stored or hardcoded percentage. */
const WEIGHTS: Weight[] = [
  {
    id: "personal",
    weight: 20,
    label: "Personal details",
    done: (p) =>
      !!(p.personal.firstName.trim() && p.personal.lastName.trim() && p.personal.email.trim() &&
        p.personal.phone.trim() && p.personal.location.trim()),
  },
  { id: "cv", weight: 20, label: "CV", done: (_p, hasCV) => hasCV },
  { id: "experience", weight: 15, label: "Work experience", done: (p) => p.experience.length > 0 },
  { id: "education", weight: 15, label: "Education", done: (p) => p.education.length > 0 },
  { id: "skills", weight: 10, label: "Skills", done: (p) => p.skills.length >= 3 },
  {
    id: "links",
    weight: 10,
    label: "Portfolio and links",
    done: (p) => Object.values(p.links).some((v) => v.trim() !== ""),
  },
  { id: "languages", weight: 5, label: "Languages", done: (p) => p.languages.length > 0 },
  { id: "projects", weight: 5, label: "Projects", done: (p) => p.projects.length > 0 },
];

function nonEmpty(v: string | undefined): v is string {
  return typeof v === "string" && v.trim() !== "";
}

/** Seeds the profile from the signed-in account and the latest application.
    Only name, email, phone and location carry over — the application form
    also collects a skills checklist and a portfolio URL, deliberately NOT
    seeded here, so a brand-new applicant lands on 40% rather than 70% and
    the "third skill moves you forward" behaviour stays visible. Mirrors
    hydrate() in the static js/kzd-profile.js. */
function hydrate(session: KzdSession): { profile: KzdProfile; apps: KzdApplication[]; isFresh: boolean } {
  const stored = getProfile();
  const isFresh = !stored;
  const profile = stored ?? blankProfile();

  const apps = getApplications().filter(
    (a) => !a.email || a.email.toLowerCase() === session.email.toLowerCase()
  );
  const user = getUsers().find((u) => u.email.toLowerCase() === session.email.toLowerCase()) ?? null;
  const latest = apps.length ? apps[apps.length - 1] : null;

  const p = { ...profile.personal };
  if (!nonEmpty(p.firstName)) {
    if (user && nonEmpty(user.firstName)) p.firstName = user.firstName;
    else if (latest && nonEmpty(latest.fullName)) p.firstName = latest.fullName.trim().split(/\s+/)[0];
    else if (nonEmpty(session.firstName)) p.firstName = session.firstName;
  }
  if (!nonEmpty(p.lastName)) {
    if (user && nonEmpty(user.lastName)) p.lastName = user.lastName;
    else if (latest && nonEmpty(latest.fullName)) {
      const parts = latest.fullName.trim().split(/\s+/);
      if (parts.length > 1) p.lastName = parts.slice(1).join(" ");
    }
  }
  if (!nonEmpty(p.email)) p.email = user?.email || latest?.email || session.email || "";
  if (!nonEmpty(p.phone)) p.phone = latest?.phone || "";
  if (!nonEmpty(p.location)) p.location = latest?.location || "";

  return { profile: { ...profile, personal: p }, apps, isFresh };
}

function LoadingShell() {
  // Signed-out visitors are bounced to /careers before this ever paints, so
  // this only shows for the moment it takes to read localStorage and — for
  // the very first client render — the one extra frame React spends
  // reconciling against the server-rendered markup (see useHasMounted below).
  return (
    <main className={styles.pro} aria-busy="true">
      <div className={styles.wrap}>
        <p className={styles.loading}>Loading your profile…</p>
      </div>
    </main>
  );
}

function subscribeNever() {
  return () => {};
}

/** True only once the component has hydrated on the client. localStorage
    does not exist during a server render, so anything read from it has to
    wait for this — otherwise the server's "nothing here yet" markup would
    not match what the client immediately knows, and React would have to
    discard and redo the render. useSyncExternalStore (rather than the more
    obvious useState+useEffect) is what keeps that first mismatched frame
    from ever painting: its getServerSnapshot is used for the render that
    hydrates the server HTML, and only the render after that switches to the
    real value — the same reasoning as the hash read in
    careers/[id]/JobTabs.tsx. */
function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

export default function ProfileApp() {
  const mounted = useHasMounted();
  if (!mounted) return <LoadingShell />;
  return <ProfileAppInner />;
}

/** Only ever mounted on the client (see ProfileApp above), so every read
    below that touches localStorage is safe to do directly during render via
    a lazy useState initializer — there is no server-rendered output for it
    to disagree with. */
function ProfileAppInner() {
  const router = useRouter();
  const [session] = useState<KzdSession | null>(() => getSession());
  const [hydrated] = useState(() => (session ? hydrate(session) : null));
  const [profile, setProfile] = useState<KzdProfile>(() => hydrated?.profile ?? blankProfile());
  const [apps] = useState<KzdApplication[]>(() => hydrated?.apps ?? []);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  useEffect(() => {
    // TODO(backend): this is a client-side guard only — it hides the UI, it
    // does not protect data. The real protection is the server refusing to
    // return another applicant's record. See src/lib/kzdStore.ts.
    if (!session) {
      router.replace("/careers?signin=1&next=/profile");
      return;
    }
    // A first-time visitor gets a profile record started (seeded from their
    // account/application, per hydrate() above) so it exists next time they
    // open this page, rather than being silently recomputed every visit.
    if (hydrated?.isFresh) saveProfile(hydrated.profile);
  }, [session, hydrated, router]);

  const hasCV = useMemo(() => apps.some((a) => (a.cv ?? []).length > 0), [apps]);
  const percent = useMemo(
    () => WEIGHTS.reduce((sum, w) => sum + (w.done(profile, hasCV) ? w.weight : 0), 0),
    [profile, hasCV]
  );
  const firstIncomplete = useMemo(() => WEIGHTS.find((w) => !w.done(profile, hasCV)) ?? null, [profile, hasCV]);
  const furthestStage = useMemo(() => {
    let best = -1;
    apps.forEach((a) => {
      best = Math.max(best, STAGE_ORDER.indexOf(stageOf(a)));
    });
    return best === -1 ? null : STAGE_ORDER[best];
  }, [apps]);

  const updateProfile = useCallback((next: KzdProfile) => {
    setProfile(next);
    // TODO(backend): PATCH /api/profile with the changed fields and
    // reconcile the response, instead of trusting this device's copy.
    saveProfile(next);
  }, []);

  function goToTab(id: TabId) {
    setActiveTab(id);
    tabRefs.current[id]?.focus();
  }

  function handleTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    goToTab(TABS[next].id);
  }

  function handleCompleteNow() {
    if (!firstIncomplete) return;
    const targetTab: TabId = firstIncomplete.id === "personal" ? "personal" : "profile";
    setActiveTab(targetTab);
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`[data-section="${firstIncomplete.id}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    }, 60);
  }

  if (!session) {
    // The effect above is already redirecting; render nothing dashboard-like
    // in the meantime.
    return <LoadingShell />;
  }

  const initials =
    ((profile.personal.firstName.trim().charAt(0) + profile.personal.lastName.trim().charAt(0)) || "").toUpperCase() ||
    (profile.personal.email || "?").charAt(0).toUpperCase();
  const fullName =
    `${profile.personal.firstName} ${profile.personal.lastName}`.trim() || profile.personal.email || "Your profile";

  const statusLabel =
    furthestStage === "interviewing"
      ? "Interview scheduled"
      : furthestStage === "offer"
        ? "Offer received"
        : "Application in review";

  return (
    <main className={styles.pro}>
      <div className={styles.wrap}>
        {/* Header card --------------------------------------------------- */}
        <div className={styles.header}>
          <div className={styles.id}>
            <div className={styles.avatar} aria-hidden="true">
              {initials}
            </div>
            <div>
              <h1 className={styles.name}>{fullName}</h1>
              <p className={styles.email}>{profile.personal.email}</p>
            </div>
          </div>

          {furthestStage && (
            <p
              className={`${styles.statusPill} ${
                furthestStage === "interviewing"
                  ? styles.statusInterviewing
                  : furthestStage === "offer"
                    ? styles.statusOffer
                    : ""
              }`}
            >
              <span className={styles.statusDot} aria-hidden="true" />
              <span>{statusLabel}</span>
            </p>
          )}

          <div className={styles.tabs} role="tablist" aria-label="Profile sections">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`kzd-pro-tab-${tab.id}`}
                aria-controls={`kzd-pro-panel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                tabIndex={activeTab === tab.id ? 0 : -1}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
                ref={(node) => {
                  tabRefs.current[tab.id] = node;
                }}
                onClick={() => goToTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, i)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Completion banner ---------------------------------------------- */}
        {percent < 100 && (
          <div className={styles.banner}>
            <div>
              <p className={styles.bannerTitle}>
                Your profile is <span>{percent}</span>% complete
              </p>
              <p className={styles.bannerSub}>
                {firstIncomplete
                  ? `Add your ${firstIncomplete.label.toLowerCase()} so we can match you to future roles.`
                  : "Your profile is complete."}
              </p>
              <div className={styles.meter} aria-hidden="true">
                <span className={styles.meterFill} style={{ width: `${percent}%` }} />
              </div>
            </div>
            <button type="button" className={styles.bannerBtn} onClick={handleCompleteNow}>
              Complete now
            </button>
          </div>
        )}
        <p className="kzd-sr" aria-live="polite">
          Profile {percent}% complete.
        </p>

        {/* Panels ----------------------------------------------------------- */}
        <div
          className={styles.panel}
          data-panel="profile"
          role="tabpanel"
          id="kzd-pro-panel-profile"
          aria-labelledby="kzd-pro-tab-profile"
          tabIndex={0}
          hidden={activeTab !== "profile"}
        >
          {activeTab === "profile" && <ProfileTab profile={profile} apps={apps} onChange={updateProfile} />}
        </div>

        <div
          className={styles.panel}
          data-panel="personal"
          role="tabpanel"
          id="kzd-pro-panel-personal"
          aria-labelledby="kzd-pro-tab-personal"
          tabIndex={0}
          hidden={activeTab !== "personal"}
        >
          {activeTab === "personal" && <PersonalInfoTab profile={profile} onChange={updateProfile} />}
        </div>

        <div
          className={styles.panel}
          data-panel="tracker"
          role="tabpanel"
          id="kzd-pro-panel-tracker"
          aria-labelledby="kzd-pro-tab-tracker"
          tabIndex={0}
          hidden={activeTab !== "tracker"}
        >
          {activeTab === "tracker" && <JobTrackerTab apps={apps} />}
        </div>
      </div>
    </main>
  );
}

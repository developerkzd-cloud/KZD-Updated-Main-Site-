/* ==========================================================================
   KZD Solutions — DATA STORE (Next.js port of js/kzd-store.js)

   ⚠⚠  PROTOTYPE PERSISTENCE — NOT REAL, NOT SECURE  ⚠⚠

   Everything here lives in localStorage, on one device, in one browser.
   Nothing is shared between browsers or sessions, there is no server, and
   clearing site data destroys every application and profile on file. This
   file exists only so /profile is fully clickable while the real backend
   (auth, applications, file storage) does not exist yet.

   This is the ONLY module under kzd-next/src that is allowed to touch
   localStorage directly. Every screen goes through the functions below —
   that is what makes swapping in real API calls later a change to this one
   file instead of a rewrite of every component that reads applicant data.

   Ported from the static site's js/kzd-store.js, scoped down to what
   /profile actually needs (sessions, accounts, applications, the profile
   record). The job/employee/notification/admin surface of the original
   store belongs to pages that have not been ported to Next yet.

   SSR SAFETY
   Client Components can still render once on the server for the initial
   HTML, and `localStorage` does not exist there. Every function below
   checks `typeof window !== "undefined"` before touching storage and
   returns a safe fallback otherwise, so importing this module never throws
   during a server render or a production build.

   STORAGE KEYS
   Kept identical to the static prototype (kzd_session, kzd_users,
   kzd_applications, kzd_profile) so a browser that already has data from the
   old site is not silently orphaned. There is no real backend either way,
   so the exact names matter less than being consistent about them — which
   is why they are declared once, below, and never inlined elsewhere.

   DATA SHAPE
     kzd_session       KzdSession | null   — { email, firstName } — written
                                              by whatever ports js/kzd-auth.js
     kzd_users         KzdUser[]            — one row per registered account
     kzd_applications  KzdApplication[]     — submitted job applications,
                                              written by whatever ports the
                                              public application form
     kzd_profile       KzdProfile | null    — this page's own editable record
   ========================================================================== */

const KEYS = {
  session: "kzd_session",
  users: "kzd_users",
  applications: "kzd_applications",
  profile: "kzd_profile",
} as const;

/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */

export interface KzdSession {
  email: string;
  firstName?: string;
}

export interface KzdUser {
  firstName: string;
  lastName: string;
  email: string;
  /** Plain text in the prototype — see the banner above. Never rendered. */
  password: string;
  role?: string;
  createdAt: string;
}

export interface KzdDocumentRef {
  name: string;
  size: number;
}

/** A submitted job application. Written by the (not yet ported) public
    application form; read here only. */
export interface KzdApplication {
  id?: string;
  jobId?: string;
  jobTitle?: string;
  department?: string;
  jobLocation?: string;
  location?: string;
  stage?: string;
  submittedAt?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  cv?: KzdDocumentRef[];
  docs?: KzdDocumentRef[];
  interviewAt?: string;
  interviewTime?: string;
  interviewFormat?: string;
}

/* These five carry an explicit string index signature, on top of their named
   fields, purely so they structurally satisfy Record<string, string> — that
   is what lets EntryModal/EntryCard/EditableCard in the profile UI be
   generic over "whichever of these" instead of three near-identical copies
   of the same form. Every field is a plain string either way. */

export interface ProfilePersonal {
  [key: string]: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  dob: string;
  street: string;
  postal: string;
}

/** South African Employment Equity categories. Every field carries
    "Prefer not to say". Special personal information under POPIA — see the
    note beside EQUITY_FIELDS in PersonalInfoTab.tsx for the consent wording. */
export interface ProfileEquity {
  [key: string]: string;
  rightToWork: string;
  populationGroup: string;
  gender: string;
  disability: string;
}

export interface ExperienceEntry {
  [key: string]: string;
  role: string;
  company: string;
  start: string;
  end: string;
}

export interface EducationEntry {
  [key: string]: string;
  qualification: string;
  institution: string;
  year: string;
}

export interface ProjectEntry {
  [key: string]: string;
  name: string;
  url: string;
  note: string;
}

export interface ProfileLinks {
  [key: string]: string;
  linkedin: string;
  github: string;
  portfolio: string;
  other: string;
}

export interface KzdProfile {
  personal: ProfilePersonal;
  equity: ProfileEquity;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  links: ProfileLinks;
  skills: string[];
  languages: string[];
}

/* --------------------------------------------------------------------------
   Raw access — the only functions that call localStorage directly.
   -------------------------------------------------------------------------- */

function rawGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function rawSet<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------------
   Profile defaults
   -------------------------------------------------------------------------- */

export function blankProfile(): KzdProfile {
  return {
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      dob: "",
      street: "",
      postal: "",
    },
    equity: { rightToWork: "", populationGroup: "", gender: "", disability: "" },
    experience: [],
    education: [],
    projects: [],
    links: { linkedin: "", github: "", portfolio: "", other: "" },
    skills: [],
    languages: [],
  };
}

/** Merges a stored profile forward onto the current shape, so a profile saved
    by an older build still gets any field added since. Mirrors hydrate()'s
    merge step in the static js/kzd-profile.js. */
function mergeWithDefaults(stored: Partial<KzdProfile> | null): KzdProfile {
  const base = blankProfile();
  if (!stored) return base;
  return {
    personal: { ...base.personal, ...stored.personal },
    equity: { ...base.equity, ...stored.equity },
    experience: stored.experience ?? base.experience,
    education: stored.education ?? base.education,
    projects: stored.projects ?? base.projects,
    links: { ...base.links, ...stored.links },
    skills: stored.skills ?? base.skills,
    languages: stored.languages ?? base.languages,
  };
}

/* --------------------------------------------------------------------------
   Public surface
   -------------------------------------------------------------------------- */

export function getSession(): KzdSession | null {
  return rawGet<KzdSession | null>(KEYS.session, null);
}

export function getUsers(): KzdUser[] {
  return rawGet<KzdUser[]>(KEYS.users, []);
}

function setUsers(list: KzdUser[]): boolean {
  return rawSet(KEYS.users, list);
}

function setSession(session: KzdSession): boolean {
  return rawSet(KEYS.session, session);
}

export function clearSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.removeItem(KEYS.session);
    return true;
  } catch {
    return false;
  }
}

export type AuthResult =
  | { ok: true; user: KzdUser }
  | { ok: false; field?: "email"; message: string };

/** TODO(backend): replace with POST /api/auth/register — the server should
    hash the password and set an httpOnly session cookie; never store or
    compare plain-text passwords in the browser. Ported from js/kzd-auth.js's
    register(). */
export function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): AuthResult {
  const list = getUsers();
  const email = data.email.trim().toLowerCase();

  if (list.some((u) => u.email === email)) {
    return { ok: false, field: "email", message: "An account with this email already exists." };
  }

  const user: KzdUser = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email,
    password: data.password,
    createdAt: new Date().toISOString(),
  };

  if (!setUsers([...list, user])) {
    return { ok: false, message: "Could not save your account in this browser." };
  }
  setSession({ email: user.email, firstName: user.firstName });
  return { ok: true, user };
}

/** TODO(backend): replace with POST /api/auth/login — never compare
    passwords in the browser. Ported from js/kzd-auth.js's signIn(). */
export function signIn(email: string, password: string): AuthResult {
  const e = email.trim().toLowerCase();
  const user = getUsers().find((u) => u.email === e);

  if (!user || user.password !== password) {
    return { ok: false, message: "That email and password do not match an account." };
  }
  setSession({ email: user.email, firstName: user.firstName });
  return { ok: true, user };
}

/** Every stored application, unfiltered — callers narrow to "mine" against
    the session email, the same way js/kzd-profile.js's hydrate() does. */
export function getApplications(): KzdApplication[] {
  return rawGet<KzdApplication[]>(KEYS.applications, []);
}

export function getProfile(): KzdProfile | null {
  const stored = rawGet<Partial<KzdProfile> | null>(KEYS.profile, null);
  return stored ? mergeWithDefaults(stored) : null;
}

/** Persists the profile record. The caller decides when this is called — see
    the TODO(backend) markers in ProfileApp.tsx, which is where a PATCH
    /api/profile call belongs once there is a server to send it to. */
export function saveProfile(profile: KzdProfile): boolean {
  return rawSet(KEYS.profile, profile);
}

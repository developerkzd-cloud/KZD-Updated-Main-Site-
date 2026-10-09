/* ==========================================================================
   KZD Solutions — DATA STORE

   ⚠⚠  PROTOTYPE PERSISTENCE AND PROTOTYPE AUTH — NOT REAL, NOT SECURE  ⚠⚠

   THIS MUST BE REPLACED WITH A REAL SERVER AND REAL AUTHENTICATION BEFORE ANY
   REAL APPLICANT OR ADMIN USES IT.

     - Everything lives in localStorage on ONE device. Nothing is shared between
       browsers, and clearing site data destroys every application on file.
     - PASSWORDS ARE STORED IN PLAIN TEXT (see js/kzd-auth.js). Anyone who can
       open devtools can read every account.
     - The "admin" role is a string in localStorage. Editing that key makes any
       visitor an administrator. There is NO access control here — the redirect
       in admin pages hides the UI, it does not protect the data.
     - No file contents are ever stored, only filenames and sizes.

   --------------------------------------------------------------------------
   THE ONLY MODULE THAT MAY TOUCH localStorage.

   Every screen goes through this file. Nothing else in the project calls
   localStorage directly — that is what makes swapping in a real backend a
   change to this one file instead of a rewrite.

   Every function is async and returns a Promise even though localStorage is
   synchronous, and every function can reject. That is deliberate: when these
   become network calls, no caller above them changes.

   --------------------------------------------------------------------------
   BECOMING API CALLS — the intended endpoints and response shapes:

     getJobs()                 GET    /api/jobs
                               -> { jobs: Job[] }
     getJob(id)                GET    /api/jobs/:id
                               -> { job: Job } | 404
     saveJob(job)              POST   /api/jobs          (no job.id)
                               PATCH  /api/jobs/:id      (existing)
                               -> { job: Job }  409 on duplicate slug
     deleteJob(id)             DELETE /api/jobs/:id
                               -> 204                    409 if applications exist
     getApplications(filter)   GET    /api/applications?status=&jobId=&query=
                               -> { applications: Application[], total: number }
     getApplication(id)        GET    /api/applications/:id
                               -> { application: Application } | 404
     setApplicationStage(...)  PATCH  /api/applications/:id/stage
                               body { stage, meta } -> { application: Application }
                               Server also sends the applicant's email here.
     getPageContent(pageKey)   GET    /api/content/:pageKey
                               -> { content: object }
     savePageContent(k, c)     PUT    /api/content/:pageKey
                               -> { content: object }
     getNotifications()        GET    /api/notifications
                               -> { notifications: Notification[] }
     markNotificationRead(id)  PATCH  /api/notifications/:id  { read: true }
                               -> { notification: Notification }
     getEmployees(filter)      GET    /api/employees?department=&status=&query=
                               -> { employees: Employee[] }
     getEmployee(id)           GET    /api/employees/:id      -> { employee } | 404
     saveEmployee(employee)    POST   /api/employees | PATCH /api/employees/:id
     setEmployeeStatus(...)    PATCH  /api/employees/:id/status
     convertApplicantToEmployee(applicationId, fields)
                               POST   /api/employees/from-application/:applicationId
                               -> { employee }  409 if already converted
     getLeave(employeeId)      GET    /api/employees/:id/leave -> { leave: Leave[] }
     saveLeave(employeeId, e)  POST   /api/employees/:id/leave -> { leave: Leave }
     search(query)             GET    /api/search?q=
                               -> { applicants: [], jobs: [] }

   Auth, which stays in js/kzd-auth.js but reads through here:
     getSession()              GET    /api/auth/session   -> { user } | 401
     Real sessions are an httpOnly cookie, never a readable key.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Keys. kzd_users / kzd_session / kzd_applications / kzd_profile predate this
   module and are kept so existing data survives.
   -------------------------------------------------------------------------- */

const K = {
  users: "kzd_users",
  session: "kzd_session",
  apps: "kzd_applications",
  profile: "kzd_profile",
  jobs: "kzd_jobs",
  notes: "kzd_notifications",
  content: "kzd_content",
  employees: "kzd_employees",
  leave: "kzd_leave",
  settings: "kzd_settings",
  draft: "kzd_application_draft",
  seeded: "kzd_seeded"
};

/* --------------------------------------------------------------------------
   Raw access. These four are the ONLY localStorage calls in the project.
   -------------------------------------------------------------------------- */

function rawGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function rawSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    throw new Error("Could not save. This browser's storage is full or blocked.");
  }
}

function rawRemove(key) {
  try { localStorage.removeItem(key); } catch (e) { /* nothing to do */ }
}

function rawHas(key) {
  try { return localStorage.getItem(key) !== null; } catch (e) { return false; }
}

/* --------------------------------------------------------------------------
   Simulated latency, so loading states are real and get built properly rather
   than never appearing.
   -------------------------------------------------------------------------- */

const MIN_MS = 120;
const MAX_MS = 250;

function latency() {
  const ms = MIN_MS + Math.random() * (MAX_MS - MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function op(fn) {
  await latency();
  return fn();
}

function uid(prefix) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/* ==========================================================================
   SEED — runs once, only when the store is empty.
   ========================================================================== */

const STAGES = ["applied", "reviewing", "interviewing", "offer", "rejected"];

const SEED_JOBS = [
  {
    id: "junior-web-developer",
    title: "Junior Web Developer",
    slug: "junior-web-developer",
    department: "Development",
    type: "Full-time",
    location: "Durban",
    status: "open",
    summary: "Build and maintain client websites in HTML, CSS and JavaScript, with support from the senior team.",
    createdAt: "2026-01-08T08:00:00.000Z",
    detail: {
      description: [
        "KZD Solutions is a Durban digital innovation company. We build websites, custom software and internal systems for South African businesses, and we look after them once they are live.",
        "We are looking for a Junior Web Developer to help build and maintain client websites. You will work on live projects from your first week, with a senior developer reviewing your work and explaining the reasoning behind it."
      ],
      why: [
        { title: "You will do real work", body: "Junior does not mean sidelined. You will be building and shipping client sites, not watching someone else do it." },
        { title: "Someone will teach you", body: "Every piece of work you do gets reviewed by a senior developer who explains why, not just what to change." },
        { title: "You will see the whole picture", body: "Design, build, deploy, support. A small team means you follow a project from brief to live site." },
        { title: "We are local", body: "We are based in Durban, we hire in Durban, and the work stays here." }
      ],
      workOn: [
        "Building client websites in HTML, CSS and JavaScript",
        "Turning designs from Penpot into working, responsive pages",
        "WordPress theme and plugin work for client sites",
        "Fixing bugs and making improvements on sites already live",
        "Testing your work across browsers and on real phones"
      ],
      lookingFor: [
        "A qualification in IT, computer science or web development, or equivalent self-taught experience",
        "Solid HTML and CSS. You can build a responsive layout without a framework",
        "Working JavaScript. You understand the DOM and can debug your own code",
        "Familiarity with Git and version control",
        "Clear written and spoken communication in English",
        "Based in Durban or willing to relocate. This role is on site"
      ],
      niceToHave: [
        "WordPress or WooCommerce experience",
        "Some PHP",
        "A portfolio, GitHub profile or personal projects we can look at",
        "Basic understanding of hosting, domains and DNS"
      ],
      offer: [
        { title: "Mentorship", body: "A senior developer reviewing your work and available for questions." },
        { title: "Range of work", body: "Client websites, internal tools and our own products." },
        { title: "Room to grow", body: "We would rather promote from inside than hire above you." },
        { title: "A clear answer", body: "You hear back from us within 30 days, either way." }
      ]
    }
  },
  {
    id: "business-analyst-intern",
    title: "Business Analyst Intern",
    slug: "business-analyst-intern",
    department: "Consulting",
    type: "Internship",
    location: "Durban",
    status: "open",
    summary: "Learn to map business processes and turn what you find into requirements a development team can build from.",
    createdAt: "2026-01-15T08:00:00.000Z",
    detail: {
      description: [
        "A twelve-month internship for someone who wants to work out why a business process is slow and then do something about it.",
        "You will sit with real clients, document how they work today, and help shape what we build for them."
      ],
      why: [
        { title: "Real clients from month one", body: "You will be in the room for client sessions, not reading about them afterwards." },
        { title: "A path to permanent", body: "This internship exists to find people we want to keep." }
      ],
      workOn: [
        "Mapping current business processes and writing them up",
        "Sitting in on client requirement sessions and taking the notes that matter",
        "Helping write user stories and acceptance criteria",
        "Basic reporting and data cleanup"
      ],
      lookingFor: [
        "Studying towards or holding a degree in Information Systems, Industrial Engineering, Business or similar",
        "Comfortable in Excel and able to explain what a spreadsheet is telling you",
        "Clear written English. Much of this job is writing things down accurately",
        "Curious about how businesses actually work"
      ],
      niceToHave: [
        "Any exposure to process mapping or BPMN",
        "Experience with Power BI or a similar reporting tool"
      ],
      offer: [
        { title: "A stipend", body: "This is a paid internship, not unpaid work experience." },
        { title: "Structured mentoring", body: "A named mentor and a review every month." }
      ]
    }
  },
  {
    id: "it-support-technician",
    title: "IT Support Technician",
    slug: "it-support-technician",
    department: "Support",
    type: "Full-time",
    location: "Durban",
    status: "open",
    summary: "Keep client systems running: hardware, networks, hosting and the day-to-day support that keeps businesses working.",
    createdAt: "2026-01-22T08:00:00.000Z",
    detail: {
      description: [
        "Our support desk is the first thing clients reach when something stops working. This role keeps that promise."
      ],
      why: [
        { title: "Variety", body: "No two days are the same. Networks, hosting, hardware, email, all of it." },
        { title: "You own the fix", body: "You see a problem through to resolved, rather than passing a ticket along." }
      ],
      workOn: [
        "First and second line support for client businesses",
        "Workstation and network setup and maintenance",
        "Hosting, domain and email administration",
        "Keeping the asset register and documentation current"
      ],
      lookingFor: [
        "A+ / N+ or equivalent practical experience",
        "Confident with Windows, basic networking and DNS",
        "A driver's licence and your own transport",
        "Patience. You will explain the same thing more than once"
      ],
      niceToHave: [
        "Microsoft 365 administration",
        "Experience with cPanel or similar hosting panels"
      ],
      offer: [
        { title: "Training budget", body: "We pay for the certifications this role needs." },
        { title: "Standby allowance", body: "After-hours standby is paid, and it rotates fairly." }
      ]
    }
  },
  {
    id: "digital-marketing-coordinator",
    title: "Digital Marketing Coordinator",
    slug: "digital-marketing-coordinator",
    department: "Marketing",
    type: "Full-time",
    location: "Durban",
    status: "draft",
    summary: "Run campaigns, content and reporting across our own channels and our clients'.",
    createdAt: "2026-02-02T08:00:00.000Z",
    detail: {
      description: ["A draft posting. Not yet published to the careers page."],
      why: [],
      workOn: ["Campaign setup and reporting", "Social content scheduling"],
      lookingFor: ["A marketing qualification or equivalent experience"],
      niceToHave: [],
      offer: []
    }
  }
];

/* Declared here, with the other seed data, because ensureSeed() runs at module
   load and a const declared further down the file is still in its temporal dead
   zone at that point — referencing it threw, and the throw was swallowed by the
   try/catch around ensureSeed(), silently skipping the employee AND admin-user
   seeds. */
const SEED_EMPLOYEES = [
  { id: "emp-1", number: "KZD-0001", firstName: "Steven",   lastName: "Kazadi", role: "Managing Director",
    department: "Leadership",  status: "active",    startDate: "2021-01-01",
    employmentType: "Permanent, full-time", reportsTo: "", location: "Durban office",
    workEmail: "steven@kzdsolutions.co.za", mobile: "082 000 1111", fromApplicationId: null, documents: [] },
  { id: "emp-2", number: "KZD-0003", firstName: "Ayesha",   lastName: "Patel",  role: "Web Developer",
    department: "Development", status: "active",    startDate: "2024-06-01",
    employmentType: "Permanent, full-time", reportsTo: "Steven Kazadi", location: "Durban office",
    workEmail: "ayesha@kzdsolutions.co.za", mobile: "083 550 9911", fromApplicationId: null, documents: [] },
  { id: "emp-3", number: "KZD-0004", firstName: "Sipho",    lastName: "Dlamini", role: "Business Analyst",
    department: "Consulting",  status: "active",    startDate: "2025-01-15",
    employmentType: "Permanent, full-time", reportsTo: "Steven Kazadi", location: "Durban office",
    workEmail: "sipho@kzdsolutions.co.za", mobile: "072 118 4420", fromApplicationId: "app-seed-2",
    documents: [{ name: "Sipho_CV.pdf", size: 245760, kind: "CV" }] },
  { id: "emp-4", number: "KZD-0005", firstName: "Lwazi",    lastName: "Ngcobo", role: "IT Support Technician",
    department: "Support",     status: "active",    startDate: "2025-02-03",
    employmentType: "Permanent, full-time", reportsTo: "Steven Kazadi", location: "Durban office",
    workEmail: "lwazi@kzdsolutions.co.za", mobile: "074 902 3388", fromApplicationId: "app-seed-4",
    documents: [{ name: "Lwazi_CV.pdf", size: 245760, kind: "CV" }] },
  { id: "emp-5", number: "KZD-0002", firstName: "Nomsa",    lastName: "Zulu",   role: "Office Administrator",
    department: "Operations",  status: "leave",     startDate: "2023-08-10",
    employmentType: "Permanent, full-time", reportsTo: "Steven Kazadi", location: "Durban office",
    workEmail: "nomsa@kzdsolutions.co.za", mobile: "078 336 1120", fromApplicationId: null,
    leaveReturn: "2026-02-24", documents: [] },
  { id: "emp-6", number: "KZD-0007", firstName: "Thandeka", lastName: "Mkhize", role: "Junior Web Developer",
    department: "Development", status: "probation", startDate: "2026-03-01",
    employmentType: "Permanent, full-time", reportsTo: "Steven Kazadi", location: "Durban office",
    workEmail: "thandeka@kzdsolutions.co.za", mobile: "071 234 5678", fromApplicationId: "app-seed-1",
    probationEnds: "2026-06-01",
    documents: [{ name: "Thandeka_CV.pdf", size: 245760, kind: "CV" },
                { name: "Diploma_IT.pdf", size: 419840, kind: "Qualification" }] }
];

const SEED_PEOPLE = [
  ["Thandeka Mkhize", "thandeka@example.com", "071 234 5678", "junior-web-developer", "interviewing", 0],
  ["Sipho Dlamini", "sipho.d@example.com", "072 118 4420", "business-analyst-intern", "applied", 1],
  ["Ayesha Patel", "ayesha.patel@example.com", "083 550 9911", "junior-web-developer", "offer", 1],
  ["Lwazi Ngcobo", "lwazi.ngcobo@example.com", "074 902 3388", "it-support-technician", "applied", 2],
  ["Rethabile Mokoena", "rethabile.m@example.com", "060 771 2043", "junior-web-developer", "reviewing", 3],
  ["Josh van Wyk", "josh.vw@example.com", "082 445 7719", "it-support-technician", "applied", 4],
  ["Nomsa Zulu", "nomsa.zulu@example.com", "078 336 1120", "junior-web-developer", "applied", 8],
  ["Farai Chikore", "farai.c@example.com", "071 889 4402", "business-analyst-intern", "reviewing", 11],
  ["Kyle Naidoo", "kyle.naidoo@example.com", "076 220 5514", "junior-web-developer", "interviewing", 15],
  ["Zanele Khumalo", "zanele.k@example.com", "073 664 8890", "it-support-technician", "applied", 19],
  ["Dean Fourie", "dean.fourie@example.com", "084 110 7726", "junior-web-developer", "applied", 24],
  ["Palesa Mothibi", "palesa.m@example.com", "079 553 0064", "business-analyst-intern", "rejected", 30]
];

function daysAgo(n) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seedApplications() {
  return SEED_PEOPLE.map(([name, email, phone, jobId, stage, ago], i) => {
    const job = SEED_JOBS.find((j) => j.id === jobId);
    const first = name.split(" ")[0];
    const app = {
      id: "app-seed-" + (i + 1),
      jobId,
      jobTitle: job ? job.title : jobId,
      department: job ? job.department : "",
      jobLocation: job ? job.location : "",
      stage,
      submittedAt: daysAgo(ago),
      fullName: name,
      email,
      phone,
      location: "Durban",
      startDate: "01 Mar 2026",
      portfolio: i % 3 === 0 ? "github.com/" + first.toLowerCase() : "",
      source: ["LinkedIn", "A friend", "Our website", "Facebook"][i % 4],
      why: "I want to work somewhere that will actually teach me, and this role says that plainly.",
      built: "A booking site for a small salon, built with plain HTML, CSS and JavaScript. The hardest part was getting the date logic right.",
      skills: ["HTML", "CSS", "JavaScript"].slice(0, (i % 3) + 1),
      cv: [{ name: first + "_CV.pdf", size: 240 * 1024 }],
      docs: i % 2 === 0 ? [{ name: "Diploma_IT.pdf", size: 410 * 1024 }] : []
    };
    if (stage === "interviewing") {
      app.interviewAt = daysAgo(-3).slice(0, 10);
      app.interviewTime = "10:00";
      app.interviewFormat = "Online";
    }
    if (stage === "offer") app.offerStartDate = "2026-03-01";
    return app;
  });
}

function seedNotifications(apps) {
  const a = apps[0], b = apps[1], c = apps[2];
  return [
    { id: uid("n"), type: "application", title: "New application received",
      detail: `${b.fullName} applied for ${b.jobTitle}`,
      at: daysAgo(0), read: false, link: { kind: "applicant", id: b.id } },
    { id: uid("n"), type: "stage",       title: "Applicant moved to Interviewing",
      detail: `${a.fullName} — ${a.jobTitle}`,
      at: daysAgo(1), read: false, link: { kind: "applicant", id: a.id } },
    { id: uid("n"), type: "offer",       title: "Offer accepted",
      detail: `${c.fullName} accepted the ${c.jobTitle} offer`,
      at: daysAgo(2), read: false, link: { kind: "applicant", id: c.id } }
  ];
}

/* Default copy for every editable string on the careers pages. Page content
   edits overlay this; "Reset to default" restores from here. */
export const CONTENT_DEFAULTS = {
  careers: {
    eyebrow: "Careers",
    h1: "Work at KZD Solutions",
    intro: "We are a small Durban team building websites, software and systems for South African businesses. If you want to do real work early and learn from people who will actually explain things, we would like to meet you.",
    openingsHeading: "Current openings",
    openingsEmpty: "There are no open roles right now. Check back soon.",
    whyHeading: "Why work here",
    whyCards: [
      { title: "Real work, early", body: "You ship to live client projects in your first weeks, not after a year of shadowing." },
      { title: "Someone teaches you", body: "Every piece of work is reviewed by someone senior who explains the reasoning." },
      { title: "The whole picture", body: "Design, build, deploy, support — a small team means you see all of it." },
      { title: "Local and staying that way", body: "We are based in Durban, we hire in Durban, and the work stays here." }
    ],
    howHeading: "How hiring works",
    howSteps: [
      { index: "01", title: "You apply", body: "One form. It takes about fifteen minutes if your CV is ready." },
      { index: "02", title: "We read it", body: "A person reads every application. No keyword filter decides for us." },
      { index: "03", title: "We talk", body: "A conversation about how you think, not a quiz on syntax." },
      { index: "04", title: "You hear back", body: "Within 30 days, either way. Silence is not an answer we give." }
    ],
    peopleHeading: "We focus on people",
    peopleBody: "Our reviews are public because how we treat people should be too.",
    peopleLinkUrl: "https://www.google.com/search?q=KZD+Solutions+Durban+reviews"
  },
  job: {
    descriptionHeading: "Job description",
    whyHeading: "Why KZD Solutions?",
    workOnHeading: "What you will work on",
    lookingForHeading: "What we are looking for",
    niceToHaveHeading: "Nice to have",
    offerHeading: "What we offer",
    nextHeading: "What happens next",
    nextBody: "We read every application ourselves. Give us 30 days. If you have not heard from us by then, your application was not successful this time."
  },
  application: {
    infoHeading: "My information",
    infoSub: "Fill in your details below",
    docsHeading: "Documents",
    docsSub: "Upload your CV and any supporting documents",
    questionsHeading: "Questions",
    questionsSub: "Tell us a bit more about you",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Your full name",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Phone number",
    phonePlaceholder: "0XX XXX XXXX",
    locationLabel: "Where are you based?",
    locationPlaceholder: "City or suburb",
    cvLabel: "Your CV",
    cvHelper: "PDF or Word, max 5MB",
    docsLabel: "Qualifications and certificates",
    docsHelper: "PDF or images, max 10MB total",
    portfolioLabel: "Portfolio, GitHub or LinkedIn",
    sourceLabel: "How did you hear about this position?",
    whyLabel: "Why do you want this role?",
    builtLabel: "Tell us about something you have built.",
    privacyText: "I accept the",
    privacyLinkLabel: "Privacy Notice",
    privacyLinkUrl: "#"
  },
  auth: {
    signInTitle: "Sign in to apply",
    signInSub: "You need an account to submit and track your application.",
    signInButton: "Sign in",
    registerTitle: "Create your account",
    registerSub: "One account lets you apply and follow where your application is.",
    registerButton: "Create account",
    switchToRegister: "Create an account",
    switchToSignIn: "Sign in"
  }
};

/* ==========================================================================
   DEVELOPMENT-ONLY SEED — MUST NEVER RUN IN PRODUCTION.

   ensureSeed() fills the store with demo applications, employees, leave and
   notifications and, above all, creates an admin account whose password is
   plain text in this public file. localStorage is per-browser, so on a live
   site that would hand EVERY visitor's browser a working admin login that
   anyone can read here and use to open the admin UI. (The data behind it is
   only that visitor's own; the exposure is the credential and the admin
   screens, not anyone's real records.)

   So it runs only where a developer is: localhost, 127.0.0.1, or a *.local
   host. Everywhere else it does nothing — no demo data, no admin account.
   Do not widen this check, and do not "fix" a missing admin on a deployed
   host by seeding there. Real access control has to come from a server.

   Two jobs the public site genuinely depends on are deliberately NOT behind
   the gate, and neither writes anything into a visitor's browser:
     - readJobs() below serves the built-in postings when no jobs have been
       stored, so the public careers and apply pages still have roles.
     - migrateLegacyApplications() repairs records that already exist.
   ========================================================================== */

function isLocalDev() {
  if (typeof location === "undefined") return false;
  const host = String(location.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

/**
 * The jobs every read goes through. On a deployed host nothing seeds kzd_jobs
 * (see the gate above), so until one is written fall back to the built-in
 * postings: a fresh copy each call, never stored. That is the same convention
 * CONTENT_DEFAULTS and SETTINGS_DEFAULTS already follow. In development
 * ensureSeed() has already written the key, so this changes nothing there.
 */
function readJobs() {
  return rawHas(K.jobs) ? rawGet(K.jobs, []) : JSON.parse(JSON.stringify(SEED_JOBS));
}

/**
 * Applications written by the public careers form before this module existed
 * have no id or stage. This only repairs records that are already there and
 * never creates any, so unlike the seed it is safe, and needed, everywhere.
 */
function migrateLegacyApplications() {
  const apps = rawGet(K.apps, null);
  if (apps === null) return;
  let changed = false;
  apps.forEach((a, i) => {
    if (!a.id) { a.id = "app-legacy-" + i + "-" + (a.submittedAt || "").slice(0, 10); changed = true; }
    if (!a.stage) { a.stage = "applied"; changed = true; }
  });
  if (changed) rawSet(K.apps, apps);
}

/** Seeds only when the store is empty. Development only: see the banner above. */
function ensureSeed() {
  if (!isLocalDev()) return;

  if (!rawHas(K.jobs)) rawSet(K.jobs, SEED_JOBS);

  let apps = rawGet(K.apps, null);
  if (apps === null) {
    apps = seedApplications();
    rawSet(K.apps, apps);
  }

  if (!rawHas(K.employees)) rawSet(K.employees, SEED_EMPLOYEES);
  if (!rawHas(K.leave)) rawSet(K.leave, {
    "emp-2": [{ id: "lv-1", from: "2026-01-12", to: "2026-01-16", type: "Annual", status: "Approved", note: "" }],
    "emp-5": [{ id: "lv-2", from: "2026-02-16", to: "2026-02-23", type: "Annual", status: "Approved", note: "Family visit" }],
    "emp-4": [{ id: "lv-3", from: "2025-11-03", to: "2025-11-04", type: "Sick", status: "Approved", note: "" }]
  });
  if (!rawHas(K.notes)) rawSet(K.notes, seedNotifications(apps));
  if (!rawHas(K.content)) rawSet(K.content, {});

  // An admin account, so /admin/ is reachable in the prototype.
  const users = rawGet(K.users, []);
  if (!users.some((u) => u.email === "admin@kzdsolutions.co.za")) {
    users.push({
      firstName: "Steven",
      lastName: "Kazadi",
      email: "admin@kzdsolutions.co.za",
      // PLAIN TEXT. See the banner at the top of this file.
      password: "admin1234",
      role: "admin",
      createdAt: new Date().toISOString()
    });
    rawSet(K.users, users);
  }

  rawSet(K.seeded, true);
}

try { migrateLegacyApplications(); ensureSeed(); } catch (e) {
  if (typeof console !== "undefined") console.warn("[kzd-store] seed failed", e);
}

/* ==========================================================================
   JOBS
   ========================================================================== */

export async function getJobs() {
  return op(() => readJobs().slice());
}

export async function getJob(id) {
  return op(() => {
    const job = readJobs().find((j) => j.id === id || j.slug === id);
    if (!job) throw new Error(`No job with the id "${id}".`);
    return job;
  });
}

/** Create when there is no id, update when there is. Slug must be unique. */
export async function saveJob(job) {
  return op(() => {
    if (!job || !String(job.title || "").trim()) {
      throw new Error("A job needs a title.");
    }
    const jobs = readJobs();
    const slug = slugify(job.slug || job.title);

    const clash = jobs.find((j) => j.slug === slug && j.id !== job.id);
    if (clash) throw new Error(`The slug "${slug}" is already used by "${clash.title}".`);

    const idx = jobs.findIndex((j) => j.id === job.id);
    const next = Object.assign({}, job, {
      slug,
      id: job.id || slug || uid("job"),
      updatedAt: new Date().toISOString()
    });

    if (idx === -1) {
      next.createdAt = next.createdAt || new Date().toISOString();
      jobs.push(next);
    } else {
      const wasOpen = jobs[idx].status === "open";
      jobs[idx] = next;
      if (wasOpen && next.status === "closed") {
        pushNotification({
          type: "job", title: "Job posting closed",
          detail: `${next.title} is no longer accepting applications`,
          link: { kind: "job", id: next.id }
        });
      }
    }
    rawSet(K.jobs, jobs);
    return next;
  });
}

export async function deleteJob(id) {
  return op(() => {
    const jobs = readJobs();
    const idx = jobs.findIndex((j) => j.id === id);
    if (idx === -1) throw new Error(`No job with the id "${id}".`);
    jobs.splice(idx, 1);
    rawSet(K.jobs, jobs);
    return true;
  });
}

/** How many applications reference a job — the delete confirmation needs it. */
export async function countApplicationsForJob(id) {
  return op(() => rawGet(K.apps, []).filter((a) => a.jobId === id).length);
}

/* ==========================================================================
   APPLICATIONS
   ========================================================================== */

function matches(app, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return [app.fullName, app.email, app.jobTitle, app.phone]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export async function getApplications({ status, jobId, query } = {}) {
  return op(() => {
    let list = rawGet(K.apps, []).slice();
    if (status && status !== "all") list = list.filter((a) => (a.stage || "applied") === status);
    if (jobId) list = list.filter((a) => a.jobId === jobId);
    if (query) list = list.filter((a) => matches(a, query));
    list.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
    return list;
  });
}

export async function getApplication(id) {
  return op(() => {
    const app = rawGet(K.apps, []).find((a) => a.id === id);
    if (!app) throw new Error(`No application with the id "${id}".`);
    return app;
  });
}

/** Used by the public application form. Also raises a notification. */
export async function addApplication(record) {
  return op(() => {
    const apps = rawGet(K.apps, []);
    const next = Object.assign({
      id: uid("app"),
      stage: "applied",
      submittedAt: new Date().toISOString()
    }, record);
    apps.push(next);
    rawSet(K.apps, apps);
    pushNotification({
      type: "application", title: "New application received",
      detail: `${next.fullName || next.email} applied for ${next.jobTitle || next.jobId}`,
      link: { kind: "applicant", id: next.id }
    });
    return next;
  });
}

/**
 * meta carries the stage's extra fields:
 *   interviewing -> { interviewAt, interviewTime, interviewFormat, interviewNote }
 *   offer        -> { offerStartDate, offerNote }
 *   rejected     -> { rejectedReason }
 * TODO(backend): the server should also email the applicant from here.
 */
export async function setApplicationStage(id, stage, meta = {}) {
  return op(() => {
    if (STAGES.indexOf(stage) === -1) throw new Error(`"${stage}" is not a valid stage.`);
    const apps = rawGet(K.apps, []);
    const app = apps.find((a) => a.id === id);
    if (!app) throw new Error(`No application with the id "${id}".`);

    const from = app.stage || "applied";
    app.stage = stage;
    app.stageChangedAt = new Date().toISOString();
    Object.keys(meta || {}).forEach((k) => { app[k] = meta[k]; });

    rawSet(K.apps, apps);
    pushNotification({
      type: "stage",
      title: `Applicant moved to ${stage.charAt(0).toUpperCase() + stage.slice(1)}`,
      detail: `${app.fullName} — ${app.jobTitle} (was ${from})`,
      link: { kind: "applicant", id: app.id }
    });
    return app;
  });
}

export async function deleteApplication(id) {
  return op(() => {
    const apps = rawGet(K.apps, []);
    const idx = apps.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`No application with the id "${id}".`);
    const [removed] = apps.splice(idx, 1);
    rawSet(K.apps, apps);
    return removed;
  });
}

/** Restores a removed application — powers the toast's Undo. */
export async function restoreApplication(record) {
  return op(() => {
    const apps = rawGet(K.apps, []);
    apps.push(record);
    rawSet(K.apps, apps);
    return record;
  });
}

/* ==========================================================================
   PAGE CONTENT
   ========================================================================== */

export async function getPageContent(pageKey) {
  return op(() => {
    const all = rawGet(K.content, {});
    const base = CONTENT_DEFAULTS[pageKey];
    if (!base) throw new Error(`No content model for "${pageKey}".`);
    return Object.assign({}, base, all[pageKey] || {});
  });
}

export async function savePageContent(pageKey, content) {
  return op(() => {
    if (!CONTENT_DEFAULTS[pageKey]) throw new Error(`No content model for "${pageKey}".`);
    const all = rawGet(K.content, {});
    all[pageKey] = Object.assign({}, all[pageKey] || {}, content);
    rawSet(K.content, all);
    return Object.assign({}, CONTENT_DEFAULTS[pageKey], all[pageKey]);
  });
}

export async function resetPageContent(pageKey, fields) {
  return op(() => {
    const all = rawGet(K.content, {});
    if (!all[pageKey]) return Object.assign({}, CONTENT_DEFAULTS[pageKey]);
    if (Array.isArray(fields)) fields.forEach((f) => { delete all[pageKey][f]; });
    else delete all[pageKey];
    rawSet(K.content, all);
    return Object.assign({}, CONTENT_DEFAULTS[pageKey], all[pageKey] || {});
  });
}

/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */

/** Synchronous internal helper — the async surface is getNotifications(). */
function pushNotification({ type, title, detail, link }) {
  const list = rawGet(K.notes, []);
  list.unshift({ id: uid("n"), type, title, detail, at: new Date().toISOString(), read: false, link });
  rawSet(K.notes, list.slice(0, 50));
}

export async function getNotifications() {
  return op(() => rawGet(K.notes, []).slice());
}

export async function markNotificationRead(id) {
  return op(() => {
    const list = rawGet(K.notes, []);
    const n = list.find((x) => x.id === id);
    if (!n) throw new Error(`No notification with the id "${id}".`);
    n.read = true;
    rawSet(K.notes, list);
    return n;
  });
}

export async function markAllNotificationsRead() {
  return op(() => {
    const list = rawGet(K.notes, []);
    list.forEach((n) => { n.read = true; });
    rawSet(K.notes, list);
    return list;
  });
}

/** Wipes the demo store and re-seeds it. Accounts and sessions are left alone
 *  so the signed-in admin is not thrown out mid-reset. */
export async function resetDemoData() {
  return op(() => {
    rawRemove(K.jobs);
    rawRemove(K.apps);
    rawRemove(K.notes);
    rawRemove(K.content);
    rawRemove(K.employees);
    rawRemove(K.leave);
    ensureSeed();
    return true;
  });
}

/* ==========================================================================
   EMPLOYEES
   ========================================================================== */

export const EMPLOYEE_STATUSES = ["active", "leave", "probation", "exited"];


export const SETTINGS_DEFAULTS = {
  /* BCEA minimum is 15 working days a year. It lives here rather than in the
     page code because plenty of employers give more.
     TODO(hr): accrual rules must be confirmed against each employment contract
     before this is used for anything real — leave accrues monthly, carry-over
     and forfeiture rules vary, and public holidays are not modelled at all.
     This is a prototype, not payroll-grade. */
  annualLeaveDays: 15,
  probationMonths: 3,
  workingHoursPerWeek: 40
};

export async function getSettings() {
  return op(() => Object.assign({}, SETTINGS_DEFAULTS, rawGet(K.settings, {})));
}

export async function saveSettings(patch) {
  return op(() => {
    const next = Object.assign({}, rawGet(K.settings, {}), patch);
    rawSet(K.settings, next);
    return Object.assign({}, SETTINGS_DEFAULTS, next);
  });
}

export function getSettingsSync() {
  return Object.assign({}, SETTINGS_DEFAULTS, rawGet(K.settings, {}));
}

function employeeMatches(e, q) {
  const s = String(q || "").trim().toLowerCase();
  if (!s) return true;
  return [e.firstName, e.lastName, e.firstName + " " + e.lastName, e.workEmail, e.role, e.department]
    .filter(Boolean).some((v) => String(v).toLowerCase().includes(s));
}

export async function getEmployees({ department, status, query } = {}) {
  return op(() => {
    let list = rawGet(K.employees, []).slice();
    if (department && department !== "all") list = list.filter((e) => e.department === department);
    if (status && status !== "all") list = list.filter((e) => e.status === status);
    if (query) list = list.filter((e) => employeeMatches(e, query));
    list.sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
    return list;
  });
}

export async function getEmployee(id) {
  return op(() => {
    const e = rawGet(K.employees, []).find((x) => x.id === id);
    if (!e) throw new Error("No employee with the id \"" + id + "\".");
    return e;
  });
}

function nextEmployeeNumber(list) {
  const nums = list.map((e) => parseInt(String(e.number || "").replace(/\D/g, ""), 10))
                   .filter((n) => isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "KZD-" + String(next).padStart(4, "0");
}

export async function saveEmployee(employee) {
  return op(() => {
    if (!employee || !String(employee.firstName || "").trim()) {
      throw new Error("An employee needs a first name.");
    }
    const list = rawGet(K.employees, []);
    const idx = list.findIndex((e) => e.id === employee.id);
    const next = Object.assign({}, employee, { updatedAt: new Date().toISOString() });

    if (idx === -1) {
      next.id = next.id || uid("emp");
      next.number = next.number || nextEmployeeNumber(list);
      next.status = next.status || "probation";
      next.documents = next.documents || [];
      list.push(next);
    } else {
      list[idx] = next;
    }
    rawSet(K.employees, list);
    return next;
  });
}

export async function setEmployeeStatus(id, status, meta = {}) {
  return op(() => {
    if (EMPLOYEE_STATUSES.indexOf(status) === -1) {
      throw new Error("\"" + status + "\" is not a valid employee status.");
    }
    const list = rawGet(K.employees, []);
    const e = list.find((x) => x.id === id);
    if (!e) throw new Error("No employee with the id \"" + id + "\".");
    e.status = status;
    Object.keys(meta || {}).forEach((k) => { e[k] = meta[k]; });
    rawSet(K.employees, list);
    pushNotification({
      type: "employee",
      title: "Employee status changed",
      detail: e.firstName + " " + e.lastName + " — " + status,
      link: { kind: "employee", id: e.id }
    });
    return e;
  });
}

/**
 * The bridge from the careers pipeline. Carries the applicant name, contact,
 * role and documents onto a new employee record so an accepted applicant does
 * not vanish between the two systems.
 */
export async function convertApplicantToEmployee(applicationId, fields = {}) {
  return op(() => {
    const apps = rawGet(K.apps, []);
    const app = apps.find((a) => a.id === applicationId);
    if (!app) throw new Error("No application with the id \"" + applicationId + "\".");

    const list = rawGet(K.employees, []);
    const already = list.find((e) => e.fromApplicationId === applicationId);
    if (already) throw new Error(app.fullName + " has already been added as an employee.");

    const parts = String(app.fullName || "").trim().split(/\s+/);
    const cvNames = (app.cv || []).map((f) => f.name);

    const employee = Object.assign({
      id: uid("emp"),
      number: nextEmployeeNumber(list),
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" "),
      role: app.jobTitle || "",
      department: app.department || "",
      status: "probation",
      startDate: "",
      employmentType: "Permanent, full-time",
      reportsTo: "",
      location: "Durban office",
      workEmail: "",
      personalEmail: app.email || "",
      mobile: app.phone || "",
      idNumber: "",
      emergencyContact: "",
      fromApplicationId: applicationId,
      // Documents follow the applicant across — metadata only, as everywhere.
      documents: [].concat(app.cv || [], app.docs || []).map((f) => ({
        name: f.name, size: f.size,
        kind: cvNames.indexOf(f.name) !== -1 ? "CV" : "Qualification"
      })),
      createdAt: new Date().toISOString()
    }, fields);

    list.push(employee);
    rawSet(K.employees, list);
    pushNotification({
      type: "employee",
      title: "Applicant converted to employee",
      detail: employee.firstName + " " + employee.lastName + " — " + employee.role,
      link: { kind: "employee", id: employee.id }
    });
    return employee;
  });
}

export async function deleteEmployee(id) {
  return op(() => {
    const list = rawGet(K.employees, []);
    const i = list.findIndex((e) => e.id === id);
    if (i === -1) throw new Error("No employee with the id \"" + id + "\".");
    const removed = list.splice(i, 1)[0];
    rawSet(K.employees, list);
    return removed;
  });
}

/* --- leave ---------------------------------------------------------------- */

export async function getLeave(employeeId) {
  return op(() => (rawGet(K.leave, {})[employeeId] || []).slice());
}

export async function saveLeave(employeeId, entry) {
  return op(() => {
    if (!entry || !entry.from || !entry.to) throw new Error("Leave needs a start and an end date.");
    if (entry.to < entry.from) throw new Error("The end date cannot be before the start date.");

    const all = rawGet(K.leave, {});
    const list = all[employeeId] || [];
    const next = Object.assign({ id: uid("lv"), status: "Approved" }, entry);
    list.push(next);
    all[employeeId] = list;
    rawSet(K.leave, all);
    return next;
  });
}

export async function deleteLeave(employeeId, leaveId) {
  return op(() => {
    const all = rawGet(K.leave, {});
    const list = all[employeeId] || [];
    const i = list.findIndex((l) => l.id === leaveId);
    if (i === -1) throw new Error("No such leave entry.");
    list.splice(i, 1);
    all[employeeId] = list;
    rawSet(K.leave, all);
    return true;
  });
}

/** Working days between two ISO dates, weekends excluded. Public holidays are
 *  NOT modelled — see the TODO on SETTINGS_DEFAULTS. */
export function workingDays(from, to) {
  const a = new Date(from), b = new Date(to);
  if (isNaN(a) || isNaN(b) || b < a) return 0;
  let n = 0;
  const d = new Date(a);
  while (d <= b) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

/* ==========================================================================
   SEARCH
   ========================================================================== */

export async function search(query) {
  return op(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return { applicants: [], jobs: [] };

    const applicants = rawGet(K.apps, [])
      .filter((a) => [a.fullName, a.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)))
      .slice(0, 6);

    const jobs = readJobs()
      .filter((j) => [j.title, j.department, j.location].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)))
      .slice(0, 6);

    const employees = rawGet(K.employees, [])
      .filter((e) => employeeMatches(e, q))
      .slice(0, 6);

    return { applicants, jobs, employees };
  });
}

/* ==========================================================================
   AUTH — the session lives here so nothing else touches storage.
   js/kzd-auth.js owns the UI and calls through to these.
   ========================================================================== */

export function getUsersSync() { return rawGet(K.users, []); }
export function setUsersSync(list) { return rawSet(K.users, list); }
export function getSessionSync() { return rawGet(K.session, null); }
export function setSessionSync(s) { return rawSet(K.session, s); }
export function clearSessionSync() { rawRemove(K.session); }

/* The in-progress application form. Sync because the form saves on every
   keystroke and on the sign-in detour, where a Promise would race the modal. */
export function getDraftSync() { return rawGet(K.draft, null); }
export function setDraftSync(d) { try { return rawSet(K.draft, d); } catch (e) { return false; } }
export function clearDraftSync() { rawRemove(K.draft); }

/* Sync twin used by the public profile page, which renders synchronously.
   Reads only — every write still goes through the async surface. */
export function getApplicationsSync() { return rawGet(K.apps, []); }

export function getProfileSync() { return rawGet(K.profile, null); }
export function setProfileSync(p) { return rawSet(K.profile, p); }

export async function getSession() {
  return op(() => rawGet(K.session, null));
}

/** True only for a signed-in user whose account carries role "admin". */
export async function isAdmin() {
  return op(() => {
    const s = rawGet(K.session, null);
    if (!s) return false;
    const user = rawGet(K.users, []).find((u) => u.email === s.email);
    return !!(user && user.role === "admin");
  });
}

/* --------------------------------------------------------------------------
   Bridge for the public site's classic (non-module) scripts. Modules and
   deferred classic scripts do not have a guaranteed execution order relative to
   each other, so callers await KZDStoreReady rather than assuming the global is
   already there.
   -------------------------------------------------------------------------- */

const API = {
  slugify,
  getJobs, getJob, saveJob, deleteJob, countApplicationsForJob,
  getApplications, getApplication, addApplication, setApplicationStage,
  deleteApplication, restoreApplication,
  getPageContent, savePageContent, resetPageContent, CONTENT_DEFAULTS,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  search, resetDemoData,
  getEmployees, getEmployee, saveEmployee, setEmployeeStatus, deleteEmployee,
  convertApplicantToEmployee, getLeave, saveLeave, deleteLeave, workingDays,
  getSettings, saveSettings, getSettingsSync, SETTINGS_DEFAULTS, EMPLOYEE_STATUSES,
  getUsersSync, setUsersSync, getSessionSync, setSessionSync, clearSessionSync,
  getApplicationsSync, getProfileSync, setProfileSync,
  getDraftSync, setDraftSync, clearDraftSync, getSession, isAdmin,
  STAGES
};

if (typeof window !== "undefined") {
  window.KZDStore = API;
  // Classic (non-module) scripts on the public site cannot import this file, and
  // module vs deferred-classic execution order is not something to gamble on, so
  // they wait on this instead of assuming the global is already there.
  window.KZDStoreReady = Promise.resolve(API);
  window.dispatchEvent(new CustomEvent("kzd-store-ready"));
}

export default API;

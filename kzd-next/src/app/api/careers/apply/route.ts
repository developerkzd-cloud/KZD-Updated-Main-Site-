/* ==========================================================================
   POST /api/careers/apply — the careers Application tab
   (careers/[id]/ApplicationForm.tsx) posts multipart FormData here.

   Repeats every check the form makes, since the form's are a courtesy and
   this is the one that counts, and answers with per-field errors the form
   can show inline.

   TODO(email): this only validates and logs. Wire real delivery (CV and
   certificates to info@kzdsolutions.co.za, plus the confirmation email the
   form promises the applicant) once credentials exist, keeping this same
   request/response contract so ApplicationForm.tsx needs no change.
   ========================================================================== */

import { NextResponse } from "next/server";
import { getJob } from "@/lib/content";
import {
  CV_EXTENSIONS,
  CV_MAX_BYTES,
  CV_TYPES,
  EMAIL_RE,
  EXPERIENCE_OPTIONS,
  PHONE_RE,
  QUALIFICATION_EXTENSIONS,
  QUALIFICATION_TYPES,
  QUALIFICATIONS_MAX_BYTES,
  QUALIFICATIONS_MAX_FILES,
  fileAllowed,
} from "@/lib/careersApply";

const TEXT_LIMIT = 3000;

const REQUIRED: [name: string, message: string][] = [
  ["full_name", "Please enter your full name."],
  ["email", "Please enter your email address."],
  ["phone", "Please enter your phone number."],
  ["location", "Please tell us where you are based."],
  ["heard_about", "Please tell us how you heard about this position."],
  ["why_role", "Please tell us why you want this role."],
  ["built", "Please tell us about something you have built."],
  ["start_date", "Please choose when you could start."],
];

function fail(message: string, status = 400, errors?: Record<string, string>) {
  return NextResponse.json({ success: false, message, ...(errors ? { errors } : {}) }, { status });
}

export async function POST(request: Request) {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return fail("Invalid request body.");
  }

  const text = (name: string) => {
    const v = data.get(name);
    return typeof v === "string" ? v.trim().slice(0, TEXT_LIMIT) : "";
  };

  const job = getJob(text("job_id"));
  if (!job) return fail("We could not find that role.", 404);
  if (job.status !== "open") return fail("This role is no longer accepting applications.", 410);

  const errors: Record<string, string> = {};
  for (const [name, message] of REQUIRED) {
    if (!text(name)) errors[name] = message;
  }
  if (text("email") && !EMAIL_RE.test(text("email"))) errors.email = "Please enter a valid email address.";
  if (text("phone") && !PHONE_RE.test(text("phone"))) errors.phone = "Use a South African number, like 082 123 4567.";
  if (text("portfolio") && !/^https?:\/\/\S+\.\S+/i.test(text("portfolio"))) {
    errors.portfolio = "Please enter a full link, starting with https://";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text("start_date"))) errors.start_date ??= "Please choose a valid date.";
  if (text("privacy") !== "accepted") errors.privacy = "You need to accept the Recruitment Privacy Notice.";

  const cv = data.get("cv");
  if (!(cv instanceof File) || cv.size === 0) {
    errors.cv = "Please upload your CV.";
  } else if (!fileAllowed(cv, CV_TYPES, CV_EXTENSIONS)) {
    errors.cv = "Your CV needs to be a PDF or Word document.";
  } else if (cv.size > CV_MAX_BYTES) {
    errors.cv = "Your CV is larger than 5 MB.";
  }

  const quals = data.getAll("qualifications").filter((f): f is File => f instanceof File && f.size > 0);
  if (quals.length > QUALIFICATIONS_MAX_FILES) {
    errors.quals = `Please upload ${QUALIFICATIONS_MAX_FILES} files or fewer.`;
  } else if (quals.some((f) => !fileAllowed(f, QUALIFICATION_TYPES, QUALIFICATION_EXTENSIONS))) {
    errors.quals = "Certificates need to be PDFs or images.";
  } else if (quals.reduce((sum, f) => sum + f.size, 0) > QUALIFICATIONS_MAX_BYTES) {
    errors.quals = "Your certificates come to more than 10 MB together.";
  }

  if (Object.keys(errors).length) {
    return fail("Please check the highlighted fields.", 400, errors);
  }

  const experience = data
    .getAll("experience")
    .filter((v): v is string => typeof v === "string" && (EXPERIENCE_OPTIONS as readonly string[]).includes(v));

  // TODO(email): send the application and its files on, and confirm to the applicant.
  console.log("[careers] application received", {
    job: job.id,
    full_name: text("full_name"),
    email: text("email"),
    phone: text("phone"),
    location: text("location"),
    portfolio: text("portfolio"),
    heard_about: text("heard_about"),
    experience,
    start_date: text("start_date"),
    cv: cv instanceof File ? { name: cv.name, size: cv.size } : null,
    qualifications: quals.map((f) => ({ name: f.name, size: f.size })),
  });

  return NextResponse.json({ success: true, message: "Application received." });
}

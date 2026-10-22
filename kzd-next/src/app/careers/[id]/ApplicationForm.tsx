"use client";

/* ==========================================================================
   The Application tab — Penpot "Application — Junior Web Developer".

   Four groups (My information, Documents, Questions, Legal) posted as
   multipart FormData to /api/careers/apply, so the CV and certificates
   travel with the answers in one request. Validation runs here first for
   instant inline messages; the route repeats every check.

   Files live in state rather than in the <input type="file">, because a
   drop onto the zone and a pick from the dialog have to land in the same
   place, and the certificate list grows across several picks.
   ========================================================================== */

import { useId, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import Icon from "@/components/Icon/Icon";
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
  formatBytes,
} from "@/lib/careersApply";
import styles from "./apply.module.css";

type Status = "idle" | "loading" | "success" | "error";
type Errors = Partial<Record<string, string>>;

/* Text fields, in the order the first error should receive focus. */
const REQUIRED_TEXT: [name: string, message: string][] = [
  ["full_name", "Please enter your full name."],
  ["email", "Please enter your email address."],
  ["phone", "Please enter your phone number."],
  ["location", "Please tell us where you are based."],
  ["heard_about", "Please tell us how you heard about this position."],
  ["why_role", "Please tell us why you want this role."],
  ["built", "Please tell us about something you have built."],
  ["start_date", "Please choose when you could start."],
];

const today = () => new Date().toISOString().slice(0, 10);

function validate(data: FormData, cv: File | null): Errors {
  const errors: Errors = {};
  const get = (name: string) => String(data.get(name) ?? "").trim();

  for (const [name, message] of REQUIRED_TEXT) {
    if (!get(name)) errors[name] = message;
  }
  if (get("email") && !EMAIL_RE.test(get("email"))) errors.email = "Please enter a valid email address.";
  if (get("phone") && !PHONE_RE.test(get("phone"))) errors.phone = "Use a South African number, like 082 123 4567.";

  const portfolio = get("portfolio");
  if (portfolio && !/^https?:\/\/\S+\.\S+/i.test(portfolio)) {
    errors.portfolio = "Please enter a full link, starting with https://";
  }

  if (get("start_date") && get("start_date") < today()) errors.start_date = "Please choose a date from today onwards.";
  if (!cv) errors.cv = "Please upload your CV.";
  if (!data.get("privacy")) errors.privacy = "You need to accept the Recruitment Privacy Notice.";
  return errors;
}

/* ---- Small building blocks --------------------------------------------- */

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && <span className={styles.req} aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p className={styles.error} id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

function Group({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>
        <span className={styles.h2}>{title}</span>
        {sub && <span className={styles.sub}>{sub}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function DropZone({
  id,
  hint,
  accept,
  multiple,
  invalid,
  onFiles,
}: {
  id: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  invalid?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false);

  const onDrop = (ev: DragEvent<HTMLLabelElement>) => {
    ev.preventDefault();
    setOver(false);
    const files = Array.from(ev.dataTransfer.files);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <label
      className={`${styles.drop} ${over ? styles.dropOver : ""} ${invalid ? styles.dropInvalid : ""}`}
      htmlFor={id}
      onDragOver={(ev) => {
        ev.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <Icon name="upload" size="dense" className={styles.dropIcon} />
      <span className={styles.dropTitle}>Click to upload or drag and drop</span>
      <span className={styles.dropHint}>{hint}</span>
      <input
        className={styles.fileInput}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(ev) => {
          const files = Array.from(ev.target.files ?? []);
          ev.target.value = ""; // lets the same file be picked again after removal
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

function FileRow({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <li className={styles.fileRow}>
      <Icon name="file-earmark-text" size="dense" className={styles.fileIcon} />
      <span className={styles.fileName}>{file.name}</span>
      <span className={styles.fileSize}>{formatBytes(file.size)}</span>
      <button type="button" className={styles.fileRemove} onClick={onRemove} aria-label={`Remove ${file.name}`}>
        <Icon name="x-lg" size="dense" />
      </button>
    </li>
  );
}

/* ---- The form ------------------------------------------------------------ */

export default function ApplicationForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const id = useId();
  const doneRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [cv, setCv] = useState<File | null>(null);
  const [quals, setQuals] = useState<File[]>([]);

  const fid = (name: string) => `${id}-${name}`;
  const clear = (name: string) => setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));

  /* Props every text control shares: id, name, the error wiring, and
     clearing its own message as soon as the visitor edits it. */
  const control = (name: string) => ({
    id: fid(name),
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${fid(name)}-error` : undefined,
    onInput: () => clear(name),
  });

  function pickCv(files: File[]) {
    const file = files[0];
    if (!fileAllowed(file, CV_TYPES, CV_EXTENSIONS)) {
      setErrors((e) => ({ ...e, cv: "Your CV needs to be a PDF or Word document." }));
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      setErrors((e) => ({ ...e, cv: `That file is ${formatBytes(file.size)}. The limit is 5 MB.` }));
      return;
    }
    setCv(file);
    clear("cv");
  }

  function addQuals(files: File[]) {
    const bad = files.find((f) => !fileAllowed(f, QUALIFICATION_TYPES, QUALIFICATION_EXTENSIONS));
    if (bad) {
      setErrors((e) => ({ ...e, quals: `${bad.name} is not a PDF or image.` }));
      return;
    }
    const next = [...quals, ...files];
    if (next.length > QUALIFICATIONS_MAX_FILES) {
      setErrors((e) => ({ ...e, quals: `Please upload ${QUALIFICATIONS_MAX_FILES} files or fewer.` }));
      return;
    }
    if (next.reduce((sum, f) => sum + f.size, 0) > QUALIFICATIONS_MAX_BYTES) {
      setErrors((e) => ({ ...e, quals: "Together these come to more than 10 MB. Try fewer or smaller files." }));
      return;
    }
    setQuals(next);
    clear("quals");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const found = validate(data, cv);
    if (Object.keys(found).length) {
      setErrors(found);
      const first = form.querySelector<HTMLElement>(
        [...REQUIRED_TEXT.map(([n]) => n), "portfolio", "cv", "privacy"]
          .filter((n) => found[n])
          .map((n) => `#${CSS.escape(fid(n))}`)
          .join(",")
      );
      first?.focus();
      return;
    }

    data.set("job_id", jobId);
    if (cv) data.set("cv", cv);
    quals.forEach((f) => data.append("qualifications", f));

    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/careers/apply", { method: "POST", body: data });
      const result: { success: boolean; message: string; errors?: Errors } = await res.json();
      if (res.ok && result.success) {
        setStatus("success");
        requestAnimationFrame(() => {
          doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          doneRef.current?.focus();
        });
        return;
      }
      if (result.errors) setErrors(result.errors);
      setStatus("error");
      setMessage(result.message || "Something went wrong. Please try again.");
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Please check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.done} ref={doneRef} tabIndex={-1} role="status">
        <Icon name="check-circle" className={styles.doneIcon} />
        <h2 className={styles.h2}>Application sent</h2>
        <p className={styles.doneBody}>
          Thank you for applying for {jobTitle}. You will get an email confirming we have your application. Give us
          30 days to review. If you are shortlisted we will contact you with an interview date and time.
        </p>
      </div>
    );
  }

  const loading = status === "loading";

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={loading}>
      <Group title="My information" sub="Fill in your details below">
        <Field id={fid("full_name")} label="Full name" required error={errors.full_name}>
          <input className={styles.input} {...control("full_name")} type="text" autoComplete="name" placeholder="Your full name" />
        </Field>
        <Field id={fid("email")} label="Email address" required error={errors.email}>
          <input className={styles.input} {...control("email")} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" />
        </Field>
        <Field id={fid("phone")} label="Phone number" required error={errors.phone}>
          <input className={styles.input} {...control("phone")} type="tel" autoComplete="tel" inputMode="tel" placeholder="0XX XXX XXXX" />
        </Field>
        <Field id={fid("location")} label="Where are you based?" required error={errors.location}>
          <input className={styles.input} {...control("location")} type="text" autoComplete="address-level2" placeholder="City or suburb" />
        </Field>
      </Group>

      <Group title="Documents" sub="Upload your CV and any supporting documents">
        <Field id={fid("cv")} label="Your CV" required error={errors.cv}>
          {cv ? (
            <ul className={styles.files}>
              <FileRow file={cv} onRemove={() => setCv(null)} />
            </ul>
          ) : (
            <DropZone
              id={fid("cv")}
              hint="PDF or Word, max 5MB"
              accept={[...CV_EXTENSIONS, ...CV_TYPES].join(",")}
              invalid={Boolean(errors.cv)}
              onFiles={pickCv}
            />
          )}
        </Field>
        <Field id={fid("quals")} label="Qualifications and certificates" error={errors.quals}>
          {quals.length > 0 && (
            <ul className={styles.files}>
              {quals.map((f, i) => (
                <FileRow key={`${f.name}-${i}`} file={f} onRemove={() => setQuals((q) => q.filter((_, j) => j !== i))} />
              ))}
            </ul>
          )}
          {quals.length < QUALIFICATIONS_MAX_FILES && (
            <DropZone
              id={fid("quals")}
              hint="PDF or images, max 10MB total"
              accept={[...QUALIFICATION_EXTENSIONS, ...QUALIFICATION_TYPES].join(",")}
              multiple
              invalid={Boolean(errors.quals)}
              onFiles={addQuals}
            />
          )}
        </Field>
      </Group>

      <hr className={styles.rule} />

      <Group title="Questions" sub="Tell us a bit more about you">
        <Field id={fid("portfolio")} label="Portfolio, GitHub or LinkedIn" error={errors.portfolio}>
          <input className={styles.input} {...control("portfolio")} type="url" inputMode="url" autoComplete="url" placeholder="https://" />
        </Field>
        <Field id={fid("heard_about")} label="How did you hear about this position?" required error={errors.heard_about}>
          <input className={styles.input} {...control("heard_about")} type="text" placeholder="LinkedIn, a friend, our website..." />
        </Field>
        <Field id={fid("why_role")} label="Why do you want this role?" required error={errors.why_role}>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            {...control("why_role")}
            rows={3}
            maxLength={3000}
            placeholder="A short paragraph is fine. We would rather read something honest than something polished."
          />
        </Field>
        <Field id={fid("built")} label="Tell us about something you have built." required error={errors.built}>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            {...control("built")}
            rows={3}
            maxLength={3000}
            placeholder="A site, an app, a school project. What was it, and what was hard about it?"
          />
        </Field>

        <div className={styles.field} role="group" aria-labelledby={fid("experience")}>
          <span className={styles.label} id={fid("experience")}>
            Which of these have you worked with?
          </span>
          <div className={styles.checks}>
            {EXPERIENCE_OPTIONS.map((opt) => (
              <label className={styles.check} key={opt}>
                <input type="checkbox" name="experience" value={opt} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <Field id={fid("start_date")} label="When could you start?" required error={errors.start_date}>
          <input className={`${styles.input} ${styles.date}`} {...control("start_date")} type="date" min={today()} suppressHydrationWarning />
        </Field>

        <div className={styles.next}>
          <p className={styles.nextTitle}>What happens next</p>
          <p className={styles.nextBody}>
            You will get an email confirming we have your application. Give us 30 days to review. If you have not heard
            from us by then, your application was not successful this time. If you are shortlisted we will contact you
            with an interview date and time.
          </p>
        </div>
      </Group>

      <hr className={styles.rule} />

      <Group title="Legal">
        <div className={styles.field}>
          <label className={styles.check}>
            <input
              type="checkbox"
              id={fid("privacy")}
              name="privacy"
              value="accepted"
              aria-invalid={errors.privacy ? true : undefined}
              aria-describedby={errors.privacy ? `${fid("privacy")}-error` : undefined}
              onChange={() => clear("privacy")}
            />
            <span>
              I have read and accept the{" "}
              {/* TODO(content): no Recruitment Privacy Notice page exists yet —
                  same gap as the AuthModal's Privacy Notice link. */}
              <a className={styles.link} href="#" onClick={(ev) => ev.preventDefault()}>
                Recruitment Privacy Notice
              </a>
              <span className={styles.req} aria-hidden="true"> *</span>
            </span>
          </label>
          {errors.privacy && (
            <p className={styles.error} id={`${fid("privacy")}-error`}>
              {errors.privacy}
            </p>
          )}
        </div>
      </Group>

      <p className={styles.footnote}>All fields marked with * are required.</p>

      <button className={styles.submit} type="submit" disabled={loading}>
        {loading ? "Sending application" : "Submit application"}
      </button>

      <p className={styles.status} role="alert" aria-live="assertive">
        {status === "error" ? message : ""}
      </p>
    </form>
  );
}

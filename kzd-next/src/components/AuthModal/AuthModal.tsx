"use client";

/* ==========================================================================
   ⚠⚠  PROTOTYPE AUTHENTICATION UI — NOT REAL, NOT SECURE  ⚠⚠

   Ported from js/kzd-auth.js's modal (open/render/buildSignIn/buildRegister).
   The data layer it calls — signIn()/register() in @/lib/kzdStore — is a
   localStorage prototype: plain-text passwords, no server, no session token.
   See the banner at the top of kzdStore.ts. This file only builds the UI and
   the client-side validation copy that was already in the legacy script; it
   does not add any security this app doesn't have.

   Behaviour kept from the legacy modal:
     - Sign-in and register are the SAME modal — a button swaps the mode in
       place (mirrored here by swapping which form component is mounted),
       never closing and reopening.
     - Focus moves into the dialog on open and after every mode swap, Tab is
       trapped inside it, Escape and a backdrop click both close it, and
       focus returns to whatever opened it on close — the same contract as
       careers/[id]/EditModal.tsx and profile/EditModal.tsx.
     - Password fields have a show/hide toggle (eyeIcon in the legacy file).
     - "Forgot password?" shows an inline message instead of doing anything —
       there is no backend to send a reset email from.
   ========================================================================== */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import Image from "next/image";
import { register, signIn, type KzdUser } from "@/lib/kzdStore";
import styles from "./AuthModal.module.css";
import Icon from "@/components/Icon/Icon";

export type AuthMode = "signin" | "register";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* --------------------------------------------------------------------------
   Icons — the shared Bootstrap Icons set, same glyphs as js/kzd-auth.js.
   -------------------------------------------------------------------------- */

function EyeIcon({ open }: { open: boolean }) {
  return <Icon className={styles.eyeIcon} name={open ? "eye" : "eye-slash"} size="dense" />;
}

function CloseIcon() {
  return <Icon name="x-lg" />;
}

/* --------------------------------------------------------------------------
   Field primitives
   -------------------------------------------------------------------------- */

function TextField({
  id,
  label,
  required,
  half,
  type = "text",
  autoComplete,
  value,
  onChange,
  error,
  hint,
  inputRef,
}: {
  id: string;
  label: string;
  required?: boolean;
  half?: boolean;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const errorId = id + "-error";
  return (
    <div className={styles.field + (half ? " " + styles.fieldHalf : "")}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && (
          <span className={styles.req} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className={styles.control}>
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={type}
          className={styles.input}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={errorId}
          aria-invalid={error ? "true" : "false"}
        />
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
      <p className={styles.error} id={errorId} role="alert">
        {error}
      </p>
    </div>
  );
}

function PasswordField({
  id,
  label,
  required,
  autoComplete,
  value,
  onChange,
  error,
  hint,
  inputRef,
}: {
  id: string;
  label: string;
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const [showing, setShowing] = useState(false);
  const errorId = id + "-error";
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && (
          <span className={styles.req} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className={styles.control}>
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={showing ? "text" : "password"}
          className={styles.input}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={errorId}
          aria-invalid={error ? "true" : "false"}
        />
        <button
          type="button"
          className={styles.eye}
          aria-label={showing ? "Hide password" : "Show password"}
          onClick={() => setShowing((s) => !s)}
        >
          <EyeIcon open={!showing} />
        </button>
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
      <p className={styles.error} id={errorId} role="alert">
        {error}
      </p>
    </div>
  );
}

function BrandRow() {
  return (
    <div className={styles.brand}>
      <Image
        src="/Assets/logos/kzd-mark.png"
        width={26}
        height={26}
        alt=""
        className={styles.mark}
      />
      <span className={styles.word}>KZD Solutions</span>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Sign-in form — ported from buildSignIn().
   -------------------------------------------------------------------------- */

function SignInForm({
  titleId,
  onSwap,
  onDone,
}: {
  titleId: string;
  onSwap: () => void;
  onDone: (user: KzdUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setFormError("");

    let bad = false;
    let firstBadEmail = false;
    if (!email.trim()) {
      setEmailError("Enter your email address.");
      bad = true;
      firstBadEmail = true;
    } else if (!EMAIL_RE.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      bad = true;
      firstBadEmail = true;
    }
    if (!password) {
      setPasswordError("Enter your password.");
      bad = true;
    }
    if (bad) {
      (firstBadEmail ? emailRef : passwordRef).current?.focus();
      return;
    }

    const res = signIn(email, password);
    if (!res.ok) {
      setFormError(res.message);
      emailRef.current?.focus();
      return;
    }
    onDone(res.user);
  }

  return (
    <>
      <BrandRow />
      <h2 className={styles.title} id={titleId}>
        Sign in to apply
      </h2>
      <p className={styles.sub}>You need an account to submit and track your application.</p>

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <TextField
          id="kzd-si-email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={emailError}
          inputRef={emailRef}
        />
        <PasswordField
          id="kzd-si-password"
          label="Password"
          required
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={passwordError}
          inputRef={passwordRef}
        />

        <a
          className={styles.forgot}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPasswordError("Password reset needs the backend — not available in this prototype.");
          }}
        >
          Forgot password?
        </a>

        <p className={styles.formError} role="alert">
          {formError}
        </p>

        <button type="submit" className={styles.primary}>
          Sign in
        </button>
      </form>

      <div className={styles.divider}>
        <span>New here?</span>
      </div>

      <button type="button" className={styles.secondary} onClick={onSwap}>
        Create an account
      </button>
    </>
  );
}

/* --------------------------------------------------------------------------
   Register form — ported from buildRegister().
   -------------------------------------------------------------------------- */

interface RegisterErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirm?: string;
  consent?: string;
}

function RegisterForm({
  titleId,
  onSwap,
  onDone,
}: {
  titleId: string;
  onSwap: () => void;
  onDone: (user: KzdUser) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState("");

  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: RegisterErrors = {};
    const bad: RefObject<HTMLInputElement | null>[] = [];

    if (!firstName.trim()) {
      next.firstName = "Enter your first name.";
      bad.push(firstRef);
    }
    if (!lastName.trim()) {
      next.lastName = "Enter your last name.";
      bad.push(lastRef);
    }
    if (!email.trim()) {
      next.email = "Enter your email address.";
      bad.push(emailRef);
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address.";
      bad.push(emailRef);
    }
    if (password.length < 8) {
      next.password = "Use at least 8 characters.";
      bad.push(passwordRef);
    }
    if (confirm !== password) {
      next.confirm = "Passwords do not match.";
      bad.push(confirmRef);
    }
    if (!consent) {
      next.consent = "You need to accept the Privacy Notice.";
      bad.push(consentRef);
    }

    setErrors(next);
    setFormError("");

    if (bad.length > 0) {
      bad[0].current?.focus();
      return;
    }

    const res = register({ firstName, lastName, email, password });
    if (!res.ok) {
      if (res.field === "email") {
        setErrors((prev) => ({ ...prev, email: res.message }));
        emailRef.current?.focus();
      } else {
        setFormError(res.message);
      }
      return;
    }
    onDone(res.user);
  }

  return (
    <>
      <BrandRow />
      <h2 className={styles.title} id={titleId}>
        Create your account
      </h2>
      <p className={styles.sub}>One account lets you apply and follow where your application is.</p>

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.row}>
          <TextField
            id="kzd-rg-first"
            label="First name"
            required
            half
            autoComplete="given-name"
            value={firstName}
            onChange={setFirstName}
            error={errors.firstName}
            inputRef={firstRef}
          />
          <TextField
            id="kzd-rg-last"
            label="Last name"
            required
            half
            autoComplete="family-name"
            value={lastName}
            onChange={setLastName}
            error={errors.lastName}
            inputRef={lastRef}
          />
        </div>

        <TextField
          id="kzd-rg-email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          inputRef={emailRef}
        />
        <PasswordField
          id="kzd-rg-password"
          label="Password"
          required
          hint="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          inputRef={passwordRef}
        />
        <PasswordField
          id="kzd-rg-confirm"
          label="Confirm password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          inputRef={confirmRef}
        />

        <div className={styles.consent}>
          <input
            ref={consentRef}
            type="checkbox"
            id="kzd-rg-consent"
            className={styles.check}
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <label className={styles.consentLabel} htmlFor="kzd-rg-consent">
            {/* TODO(content): the Privacy Notice page does not exist yet — same gap
                as the legacy modal, which also linked "#". */}
            I accept the <a href="#">Privacy Notice</a>
            <span className={styles.req} aria-hidden="true">
              *
            </span>
          </label>
        </div>
        <p className={styles.error} role="alert">
          {errors.consent}
        </p>

        <p className={styles.formError} role="alert">
          {formError}
        </p>

        <button type="submit" className={styles.primary}>
          Create account
        </button>
      </form>

      <p className={styles.foot}>
        Already have an account?{" "}
        <button type="button" className={styles.link} onClick={onSwap}>
          Sign in
        </button>
      </p>
    </>
  );
}

/* --------------------------------------------------------------------------
   Modal shell — focus trap / Escape / backdrop close, same technique as
   careers/[id]/EditModal.tsx and profile/EditModal.tsx.
   -------------------------------------------------------------------------- */

export default function AuthModal({
  mode,
  onDone,
  onClose,
}: {
  mode: AuthMode;
  onDone: (user: KzdUser) => void;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState<AuthMode>(mode);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function focusables(): HTMLElement[] {
      if (!dialog) return [];
      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((n) => n.offsetWidth > 0 || n.offsetHeight > 0);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;
      if (!dialog?.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [onClose]);

  function handleDone(user: KzdUser): void {
    onDone(user);
  }

  let body: ReactNode;
  if (current === "signin") {
    body = <SignInForm titleId={titleId} onSwap={() => setCurrent("register")} onDone={handleDone} />;
  } else {
    body = <RegisterForm titleId={titleId} onSwap={() => setCurrent("signin")} onDone={handleDone} />;
  }

  return (
    <div
      className={styles.scrim}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
        {body}
      </div>
    </div>
  );
}

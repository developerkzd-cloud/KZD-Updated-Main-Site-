"use client";

/* "Looking for any help?" — posts JSON to /api/contact so we can show a
   sending / sent / error state without a page reload. Includes a service
   picker listing everything KZD offers. */

import { useId, useState, type FormEvent } from "react";
import Icon, { type IconName } from "@/components/Icon/Icon";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import { SERVICES } from "@/lib/services";
import styles from "./contact.module.css";

type Status = "idle" | "loading" | "success" | "error";

const FIELDS: { name: string; label: string; type: string; autoComplete: string; icon: IconName }[] = [
  { name: "first_name", label: "First name", type: "text", autoComplete: "given-name", icon: "person" },
  { name: "surname", label: "Surname", type: "text", autoComplete: "family-name", icon: "person-vcard" },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel", icon: "telephone" },
  { name: "email", label: "Email address", type: "email", autoComplete: "email", icon: "envelope" },
];

/* The full list: the six services, plus the consulting and web offerings
   from the Services page. */
const SERVICE_OPTIONS = [
  ...SERVICES.map((s) => s.name),
  "Consulting",
  "Web Design",
  "Web Hosting",
  "Domain Registration",
  "Something else",
];

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const id = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setStatus("loading");
    setMessage("");

    const data = new FormData(form);
    const payload = Object.fromEntries(
      ["first_name", "surname", "phone", "email", "service", "comment"].map((k) => [k, String(data.get(k) ?? "")])
    );

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: { success: boolean; message: string } = await res.json();
      if (res.ok && result.success) {
        setStatus("success");
        setMessage(result.message);
        form.reset();
      } else {
        setStatus("error");
        setMessage(result.message || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Please check your connection and try again.");
    }
  }

  const loading = status === "loading";

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {FIELDS.map((f) => (
        <div className={styles.field} key={f.name}>
          <label className={styles.label} htmlFor={`${id}-${f.name}`}>
            {f.label} *
          </label>
          <div className={styles.control}>
            <input
              className={styles.input}
              id={`${id}-${f.name}`}
              name={f.name}
              type={f.type}
              autoComplete={f.autoComplete}
              placeholder={`Enter your ${f.label.toLowerCase()}`}
              required
            />
            <Icon name={f.icon} size="dense" className={styles.fieldIcon} />
          </div>
        </div>
      ))}

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${id}-service`}>
          Service you need
        </label>
        <div className={styles.control}>
          <select className={`${styles.input} ${styles.select}`} id={`${id}-service`} name="service" defaultValue="">
            <option value="" disabled>
              Select a service
            </option>
            {SERVICE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size="dense" className={styles.fieldIcon} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${id}-comment`}>
          Your message
        </label>
        <div className={styles.control}>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            id={`${id}-comment`}
            name="comment"
            rows={4}
            placeholder="Describe your project"
          />
          <Icon name="chat-left-text" size="dense" className={`${styles.fieldIcon} ${styles.fieldIconTop}`} />
        </div>
      </div>

      <div className={styles.actions}>
        <p className={styles.consent}>We will never collect information about you without your explicit consent.</p>
        <button className={styles.submit} type="submit" disabled={loading}>
          {loading ? "Sending" : "Send message"} <ArrowIcon />
        </button>
      </div>

      <p
        className={`${styles.status} ${status === "success" ? styles.statusOk : ""} ${status === "error" ? styles.statusErr : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  );
}

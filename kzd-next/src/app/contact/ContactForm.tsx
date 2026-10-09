"use client";

/* The only client code on this route besides Map.tsx. Everything else —
   locations, channels, copy — stays server-rendered. Submits JSON to
   /api/contact rather than a native form POST, so we can show a loading /
   success / error state without a full page reload. */

import { useId, useState, type FormEvent } from "react";
import styles from "./contact.module.css";

type Status = "idle" | "loading" | "success" | "error";

const FIELDS = [
  { name: "first_name", label: "First Name", type: "text", autoComplete: "given-name" },
  { name: "surname", label: "Surname", type: "text", autoComplete: "family-name" },
  { name: "phone", label: "Phone Number", type: "tel", autoComplete: "tel" },
  { name: "email", label: "Email Address", type: "email", autoComplete: "email" },
] as const;

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const idPrefix = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      first_name: String(data.get("first_name") ?? ""),
      surname: String(data.get("surname") ?? ""),
      phone: String(data.get("phone") ?? ""),
      email: String(data.get("email") ?? ""),
      comment: String(data.get("comment") ?? ""),
    };

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
      <div className={styles.fieldRow}>
        {FIELDS.slice(0, 2).map((field) => (
          <div className={styles.field} key={field.name}>
            <label className={styles.label} htmlFor={`${idPrefix}-${field.name}`}>
              {field.label}
            </label>
            <input
              className={styles.input}
              id={`${idPrefix}-${field.name}`}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={`Enter your ${field.label.toLowerCase()}`}
              required
            />
          </div>
        ))}
      </div>

      <div className={styles.fieldRow}>
        {FIELDS.slice(2).map((field) => (
          <div className={styles.field} key={field.name}>
            <label className={styles.label} htmlFor={`${idPrefix}-${field.name}`}>
              {field.label}
            </label>
            <input
              className={styles.input}
              id={`${idPrefix}-${field.name}`}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={`Enter your ${field.label.toLowerCase()}`}
              required
            />
          </div>
        ))}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-comment`}>
          Your Message
        </label>
        <textarea
          className={styles.textarea}
          id={`${idPrefix}-comment`}
          name="comment"
          rows={4}
          placeholder="Describe your project"
        />
      </div>

      <div className={styles.actions}>
        <p className={styles.consent}>
          We will never collect information about you without your explicit consent.
        </p>
        <button className={styles.submit} type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send message"}
        </button>
      </div>

      <p
        className={`${styles.status} ${status === "success" ? styles.statusOk : ""} ${
          status === "error" ? styles.statusErr : ""
        }`}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  );
}

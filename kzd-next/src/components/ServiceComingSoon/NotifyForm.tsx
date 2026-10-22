"use client";

/* Email + "Notify me". Posts to the /api/notify stub; on success the form is
   replaced by "You are on the list". */

import { useState, type FormEvent } from "react";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import Icon from "@/components/Icon/Icon";
import styles from "./ServiceComingSoon.module.css";

type State = "idle" | "sending" | "done" | "error";

export default function NotifyForm({ topic }: { topic: string }) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setState("sending");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topic }),
      });
      const data = (await res.json()) as { success: boolean; message: string };
      setState(data.success ? "done" : "error");
      setMessage(data.message);
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <p className={styles.done} role="status">
        <Icon name="check-circle" size="dense" />
        You are on the list
      </p>
    );
  }

  return (
    <>
      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.srOnly} htmlFor={`notify-${topic}`}>
          Your email address
        </label>
        <input
          id={`notify-${topic}`}
          className={styles.input}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          aria-describedby={`notify-${topic}-note`}
        />
        <button className={styles.notify} type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending" : "Notify me"} <ArrowIcon />
        </button>
      </form>
      <p className={styles.note} id={`notify-${topic}-note`} role={state === "error" ? "alert" : undefined}>
        {state === "error" ? message : "One email when it launches. No spam."}
      </p>
    </>
  );
}

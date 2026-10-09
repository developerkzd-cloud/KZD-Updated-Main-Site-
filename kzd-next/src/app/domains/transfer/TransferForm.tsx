"use client";

/* ==========================================================================
   TransferForm — ported from domain-transfer.html's #transferForm.

   The contact-email field is kept for content parity with the legacy form,
   but exactly like the original handler (js/domains.js), it is never read
   on submit — goToDomainTransfer() only takes a domain and an EPP/auth
   code, because that is all FOSSBilling's transfer flow needs pre-filled.
   ========================================================================== */

import { useId, useState, type FormEvent } from "react";
import type { Tld } from "@/lib/content";
import { goToDomainTransfer } from "@/lib/kzd-integration";
import styles from "./transfer.module.css";

export default function TransferForm({ tlds }: { tlds: Tld[] }) {
  const [domain, setDomain] = useState("");
  const [eppCode, setEppCode] = useState("");
  const [email, setEmail] = useState("");
  const [warning, setWarning] = useState("");
  const idPrefix = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDomain = domain.trim();
    if (!trimmedDomain) {
      setWarning("Please enter the domain you want to transfer.");
      return;
    }
    setWarning("");
    goToDomainTransfer(tlds, trimmedDomain, eppCode.trim());
  }

  return (
    <div className={styles.formCard}>
      <h2 className={styles.formTitle}>Initiate Domain Transfer</h2>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-domain`}>Domain Name</label>
          <input
            className={styles.input}
            id={`${idPrefix}-domain`}
            type="text"
            placeholder="example.com"
            autoComplete="off"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-epp`}>Authorization Code (EPP Code)</label>
          <input
            className={styles.input}
            id={`${idPrefix}-epp`}
            type="text"
            placeholder="Enter your domain transfer code"
            autoComplete="off"
            value={eppCode}
            onChange={(e) => setEppCode(e.target.value)}
            required
          />
          <p className={styles.fieldNote}>Get this code from your current domain registrar.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-email`}>Contact Email</label>
          <input
            className={styles.input}
            id={`${idPrefix}-email`}
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {warning && <p className={styles.warn} role="alert">{warning}</p>}

        <button className={styles.submit} type="submit">Transfer</button>
      </form>

      <div className={styles.next}>
        <h3 className={styles.nextTitle}>What happens next?</h3>
        <ol className={styles.nextList}>
          <li>We&apos;ll send a transfer confirmation email to the domain&apos;s admin contact.</li>
          <li>Once approved, the transfer typically completes within 5-7 days.</li>
          <li>Your domain will be renewed for 1 year upon successful transfer.</li>
          <li>You&apos;ll get full control and management access.</li>
          <li>You&apos;ll have to pay the transfer fee.</li>
        </ol>
      </div>
    </div>
  );
}

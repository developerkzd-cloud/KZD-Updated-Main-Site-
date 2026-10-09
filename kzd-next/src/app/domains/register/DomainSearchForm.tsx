"use client";

/* ==========================================================================
   DomainSearchForm — ported from domain-register.html's #domainSearchForm
   plus the search/suggestions/chip behaviour in js/domains.js
   (setupDomainSuggestions, the '.tld-box' click handler, submitDomainSearch).

   There is no availability check here, on purpose (see kzd-integration.ts) —
   this only figures out the sld/tld the customer means and hands off to
   FOSSBilling via goToDomainOrder(). Three ways in:
     1. Typing a name and picking a TLD from the select, then submitting.
     2. Typing a full "name.tld" and submitting (the dot wins over the select).
     3. Clicking a popular-TLD chip -- appends its extension to whatever is
        typed and, if something was typed, orders immediately (as the
        original .tld-box handler did).
   Live suggestions (name + each popular TLD) appear once 2+ characters are
   typed, same threshold as the static site.
   ========================================================================== */

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import type { Tld } from "@/lib/content";
import { goToDomainOrder, isSupportedTld, splitDomain } from "@/lib/kzd-integration";
import styles from "./register.module.css";

const DEFAULT_TLD = ".co.za";

export default function DomainSearchForm({
  tlds,
  categoryLabels,
}: {
  tlds: Tld[];
  categoryLabels: Record<string, string>;
}) {
  const [value, setValue] = useState("");
  const [tld, setTld] = useState(DEFAULT_TLD);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [warning, setWarning] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId();

  const groups = useMemo(() => {
    const byCategory = new Map<string, Tld[]>();
    for (const t of tlds) {
      const list = byCategory.get(t.category) ?? [];
      list.push(t);
      byCategory.set(t.category, list);
    }
    return [...byCategory.entries()].map(([category, list]) => ({
      label: categoryLabels[category] ?? category,
      list,
    }));
  }, [tlds, categoryLabels]);

  const popular = useMemo(() => tlds.filter((t) => t.popular), [tlds]);

  const query = value.trim().replace(/\..+$/, "");
  const suggestions = query.length >= 2 ? popular.map((t) => `${query}${t.ext}`) : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function order(domainInput: string) {
    const { tld: parsedTld } = splitDomain(tlds, domainInput);
    if (!isSupportedTld(tlds, parsedTld)) {
      setWarning(`"${parsedTld || domainInput}" isn't an extension we currently offer.`);
      return;
    }
    setWarning("");
    goToDomainOrder(tlds, domainInput);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = value.trim();
    if (!raw) return;
    const domainInput = raw.includes(".") ? raw : `${raw}${tld}`;
    order(domainInput);
  }

  function handleChip(chipTld: string) {
    const current = value.split(".")[0];
    setValue(current + chipTld);
    setTld(chipTld);
    if (current) order(current + chipTld);
  }

  function handleSuggestion(suggestion: string) {
    setShowSuggestions(false);
    order(suggestion);
  }

  return (
    <div className={styles.searchCard}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.searchRow} ref={wrapRef}>
          <input
            className={styles.searchInput}
            type="text"
            id={`${idPrefix}-domain`}
            placeholder="Enter your desired domain name"
            autoComplete="off"
            aria-label="Domain name"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
              setWarning("");
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          <select
            className={styles.tldSelect}
            aria-label="Domain extension"
            value={tld}
            onChange={(e) => setTld(e.target.value)}
          >
            {groups.map((group) => (
              <optgroup label={group.label} key={group.label}>
                {group.list.map((t) => (
                  <option value={t.ext} key={t.ext}>{t.ext}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button className={styles.searchBtn} type="submit">Search</button>

          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestions} role="listbox">
              {suggestions.map((s) => (
                <button
                  type="button"
                  className={styles.suggestion}
                  key={s}
                  onClick={() => handleSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        {warning && <p className={`${styles.hint} ${styles.hintWarn}`}>{warning}</p>}
      </form>

      <div className={styles.chipsGrid}>
        {popular.map((t) => (
          <button
            type="button"
            className={styles.chip}
            key={t.ext}
            data-tld={t.ext}
            onClick={() => handleChip(t.ext)}
          >
            <span className={styles.chipExt}>{t.ext}</span>
            <span className={styles.chipDesc}>{t.description}</span>
            <span className={styles.chipPrice}>R{t.register}/yr</span>
          </button>
        ))}
      </div>
    </div>
  );
}

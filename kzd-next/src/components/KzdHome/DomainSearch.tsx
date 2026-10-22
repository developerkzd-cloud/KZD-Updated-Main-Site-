"use client";

/* The single-field domain search from the kzd homepage's Domains tab: the
   visitor types the whole domain and it is split into FOSSBilling's own
   register_sld / register_tld fields against the extensions actually sold.
   Ported from themes/kzd/assets/build/js/kzd-domain-input.js (parse()). */

import { useState, type FormEvent } from "react";
import { FOSSBILLING_ORIGIN } from "@/lib/kzd-integration";
import Sprite from "./Sprite";

function clean(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/\s+/g, "");
}

type Parsed = { ok: true; sld: string; tld: string } | { ok: false; error: string };

export function parseDomain(raw: string, tlds: string[]): Parsed {
  const v = clean(raw);
  const sample = tlds.includes(".co.za") ? ".co.za" : tlds[0] || ".co.za";
  if (!v) return { ok: false, error: `Enter a domain name, for example yourname${sample}.` };
  if (v.indexOf(".") === -1) return { ok: false, error: `Add the ending, for example ${v}${sample}.` };
  const sorted = [...tlds].sort((a, b) => b.length - a.length);
  const tld = sorted.find((t) => v.length > t.length && v.endsWith(t.toLowerCase()));
  if (!tld) {
    return { ok: false, error: `We do not offer ${v.slice(v.indexOf("."))} domains. Try ${tlds.slice(0, 5).join(", ")}.` };
  }
  const sld = v.slice(0, -tld.length);
  if (sld.indexOf(".") !== -1) {
    return { ok: false, error: `Enter the domain without a subdomain, for example ${sld.split(".").pop()}${tld}.` };
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(sld)) {
    return { ok: false, error: "Use only letters, numbers and hyphens in the name (no hyphen at the start or end)." };
  }
  return { ok: true, sld, tld };
}

/* mode="transfer" sends action=transfer, which FOSSBilling's domain order
   form reads to open its Transfer tab with the domain filled in. */
export default function DomainSearch({ tlds, mode = "register" }: { tlds: string[]; mode?: "register" | "transfer" }) {
  const verb = mode === "transfer" ? "Transfer" : "Search";
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsed = parseDomain(value, tlds);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    if (!parsed.ok) {
      e.preventDefault();
      setError(parsed.error);
      e.currentTarget.querySelector<HTMLInputElement>("[data-kzd-domain-visible]")?.focus();
    }
  }

  return (
    <>
      <form method="get" action={`${FOSSBILLING_ORIGIN}/order`} className="kzd-domain-search-form" onSubmit={onSubmit} noValidate>
        <input type="hidden" name="product" value="1" />
        {mode === "transfer" && <input type="hidden" name="action" value="transfer" />}
        <Sprite id="search" className="icon kzd-domain-search-icon" />
        <input
          type="text"
          placeholder="yourbusiness.co.za"
          aria-label="Domain name, including its ending"
          aria-describedby="kzd-home-domain-error"
          className="kzd-domain-search-input"
          data-kzd-domain-visible
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
        />
        <input type="hidden" name="register_sld" value={parsed.ok ? parsed.sld : ""} />
        <input type="hidden" name="register_tld" value={parsed.ok ? parsed.tld : ""} />
        <button type="submit" className="kzd-press kzd-domain-search-btn" aria-label={verb}>
          <span className="kzd-domain-search-btn-label">{verb}</span>
          <Sprite id="arrow-right" className="icon kzd-domain-search-btn-icon" />
        </button>
      </form>
      <p className="kzd-domain-search-error" id="kzd-home-domain-error" role="alert" hidden={!error}>
        {error}
      </p>
    </>
  );
}

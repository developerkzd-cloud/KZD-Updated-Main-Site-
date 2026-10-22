"use client";

/* Every extension with its register / transfer / renew price, in the kzd
   homepage's language: the search pill, hairline rows (the FAQ cards'
   dividers) and the black pill CTA. Each row's button opens FOSSBilling's
   domain order form on that extension. */

import { useState } from "react";
import type { Tld } from "@/lib/content";
import { FOSSBILLING_ORIGIN } from "@/lib/kzd-integration";
import Sprite from "./Sprite";

const rand = (n: number) => `R${n.toLocaleString("en-US")}`;

export default function TldPriceTable({ tlds, searchable = false, showTransfer = true }: { tlds: Tld[]; searchable?: boolean; showTransfer?: boolean }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase().replace(/^\.?/, ".");
  const rows = q.trim() ? tlds.filter((t) => t.ext.includes(needle) || t.description.toLowerCase().includes(q.trim().toLowerCase())) : tlds;

  return (
    <div>
      {searchable && (
        <div className="kzd-domain-search-form" role="search" style={{ marginBottom: 28 }}>
          <Sprite id="search" className="icon kzd-domain-search-icon" />
          <input
            type="search"
            className="kzd-domain-search-input"
            placeholder="Filter extensions, e.g. .co.za"
            aria-label="Filter domain extensions"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}
      <div className="kzd-tld-table" role="table" aria-label="Domain extension prices">
        <div className="kzd-tld-row kzd-tld-row-head" role="row">
          <span role="columnheader">Extension</span>
          <span role="columnheader">Register</span>
          {showTransfer && <span role="columnheader">Transfer</span>}
          <span role="columnheader">Renew</span>
          <span role="columnheader" className="kzd-sr">Order</span>
        </div>
        {rows.map((t) => (
          <div className="kzd-tld-row" role="row" key={t.ext}>
            <span role="cell" className="kzd-tld-row-ext">
              <strong>{t.ext}</strong>
              <small>{t.description}</small>
            </span>
            <span role="cell" data-label="Register">{rand(t.register)}<small>/yr</small></span>
            {showTransfer && <span role="cell" data-label="Transfer">{rand(t.transfer)}</span>}
            <span role="cell" data-label="Renew">{rand(t.renew)}<small>/yr</small></span>
            <span role="cell" className="kzd-tld-row-cta">
              <a className="kzd-tier-cta" href={`${FOSSBILLING_ORIGIN}/order?product=1&register_tld=${encodeURIComponent(t.ext)}`}>Register</a>
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="kzd-tld-empty">We do not offer that extension yet.</p>}
      </div>
    </div>
  );
}

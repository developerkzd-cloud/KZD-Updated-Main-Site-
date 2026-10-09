/* ==========================================================================
   Single source of truth for how the marketing site hands customers off to
   the FOSSBilling client portal (my.kzdsolutions.co.za). Nothing here checks
   real domain availability or pricing — that is FOSSBilling's job. This
   module only builds the right URL and (client-side) navigates to it.

   Ported from the static site's js/kzd-integration.js + js/domains.js. Pure
   functions only — no fs, no window access at module scope — so it is safe
   to import from both Server and Client Components. The TLD catalog itself
   lives in src/data/tlds.json, read through src/lib/content.ts (server-only)
   and passed down into client components as a prop, the same way getJobs()
   feeds JobTabs.
   ========================================================================== */

import type { Tld } from "./content";

export const FOSSBILLING_ORIGIN = "https://my.kzdsolutions.co.za";

/** FOSSBilling product IDs. Domains is product 1 (seeded by FOSSBilling
    itself as "Domains registration and transfer"). */
export const HOSTING_PRODUCTS = {
  hostingStarter: 2,
  hostingBasic: 3,
  hostingStandard: 4,
  hostingBusiness: 5,
  businessEmail: 6,
  premiumBusinessEmail: 7,
} as const;

export type HostingProductKey = keyof typeof HOSTING_PRODUCTS;

const DOMAIN_PRODUCT_ID = 1;

/** Split "example.co.za" into { sld: "example", tld: ".co.za" } using the
    known TLD list (so multi-part TLDs like .co.za are handled correctly,
    not just split on the last dot). */
export function splitDomain(tlds: Tld[], input: string): { sld: string; tld: string } {
  const value = (input || "").trim().toLowerCase();
  const known = [...tlds].sort((a, b) => b.ext.length - a.ext.length);
  for (const t of known) {
    if (value.endsWith(t.ext)) {
      return { sld: value.slice(0, -t.ext.length), tld: t.ext };
    }
  }
  const dot = value.indexOf(".");
  if (dot === -1) return { sld: value, tld: "" };
  return { sld: value.slice(0, dot), tld: value.slice(dot) };
}

/** Whether `tld` (e.g. ".xyz") is one KZD Solutions currently sells. */
export function isSupportedTld(tlds: Tld[], tld: string): boolean {
  return tlds.some((t) => t.ext === (tld || "").toLowerCase());
}

/** Build the FOSSBilling order URL for a domain, with the name/TLD
    pre-filled. FOSSBilling's own order form reads ?tld= and ?name= from
    the URL — this is not a custom parameter invented here. */
export function domainOrderUrl(sld: string, tld: string): string {
  const params = new URLSearchParams({ product: String(DOMAIN_PRODUCT_ID) });
  if (tld) params.set("tld", tld);
  if (sld) params.set("name", sld);
  return `${FOSSBILLING_ORIGIN}/order?${params.toString()}`;
}

/** Navigate to the domain order/registration flow. */
export function goToDomainOrder(tlds: Tld[], domainInput: string): void {
  const { sld, tld } = splitDomain(tlds, domainInput);
  window.location.href = domainOrderUrl(sld, tld);
}

/** Navigate to the domain transfer flow (same form, transfer tab). */
export function goToDomainTransfer(tlds: Tld[], domainInput: string, eppCode?: string): void {
  const { sld, tld } = splitDomain(tlds, domainInput);
  const url = new URL(domainOrderUrl(sld, tld));
  url.searchParams.set("action", "transfer");
  if (eppCode) url.searchParams.set("epp", eppCode);
  window.location.href = url.toString();
}

/** Navigate to a hosting plan's order flow. */
export function goToHostingOrder(productKey: HostingProductKey): void {
  const id = HOSTING_PRODUCTS[productKey];
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- absolute cross-origin URL (FOSSBILLING_ORIGIN), the rule can't see that through the template literal.
  window.location.href = `${FOSSBILLING_ORIGIN}/order?product=${id}`;
}

/** Format a number as South African Rand, e.g. 349 -> "R349". */
export function formatPrice(amount: number): string {
  return `R${amount}`;
}

/** Case/substring match against a TLD's extension or description — the one
    implementation of the search used by both /domains/pricing and the
    hosting/domains FAQ (the static site had this duplicated). */
export function filterTlds(tlds: Tld[], searchTerm: string): Tld[] {
  const term = (searchTerm || "").toLowerCase().trim();
  if (!term) return tlds;
  return tlds.filter(
    (t) => t.ext.toLowerCase().includes(term) || t.description.toLowerCase().includes(term)
  );
}

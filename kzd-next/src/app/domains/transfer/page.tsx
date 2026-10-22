/* ==========================================================================
   /domains/transfer — in the KZD homepage design (components/KzdHome):
   one-field transfer search that opens FOSSBilling's domain order form on
   its Transfer tab with the domain filled in (?action=transfer), beside
   the reasons to move and the transfer requirements. Copy unchanged from
   the previous port of domain-transfer.html.
   ========================================================================== */

import type { Metadata } from "next";
import Link from "next/link";
import { getTlds } from "@/lib/content";
import DomainSearch from "@/components/KzdHome/DomainSearch";
import Sprite from "@/components/KzdHome/Sprite";
import { FaqSection, KzdHome, PanelSection } from "@/components/KzdHome/sections";

const DESCRIPTION =
  "Transfer your domain to KZD Solutions. Easy, secure domain transfer process with expert support.";

export const metadata: Metadata = {
  title: "Transfer a Domain",
  description: DESCRIPTION,
  alternates: { canonical: "/domains/transfer" },
  openGraph: {
    type: "website",
    url: "/domains/transfer",
    title: "Transfer a Domain | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

const BENEFITS = [
  {
    icon: "wallet",
    title: "Affordable Transfer Pricing",
    body: (
      <>
        Some South African extensions transfer for as little as R49.{" "}
        <Link href="/domains/pricing" style={{ textDecoration: "underline" }}>See full transfer pricing</Link>.
      </>
    ),
  },
  { icon: "lock", title: "Free Privacy Protection", body: "Keep your personal information private with free WHOIS protection." },
  { icon: "lifebuoy", title: "24/7 Support", body: "Get help anytime with domain transfers and management." },
  { icon: "settings", title: "Easy Management", body: "Simple control panel for DNS, email, and domain settings." },
];

const NOTES = [
  "Domain must be at least 60 days old",
  "Domain cannot be within 60 days of expiration",
  "Unlock your domain at current registrar",
  "Disable privacy protection temporarily",
];

export default function DomainTransferPage() {
  const tlds = getTlds();

  return (
    <KzdHome after={<FaqSection />}>
      <PanelSection
        as="h1"
        eyebrow="Domain Transfer"
        title="Transfer Your Domain"
        lede="Transfer your domain to KZD Solutions for better management, security, and support."
      >
        <div className="kzd-split">
          <div>
            <DomainSearch tlds={tlds.map((t) => t.ext)} mode="transfer" />
            <div className="kzd-price-card kzd-domain-card kzd-card-plain" style={{ padding: "28px 26px" }}>
              <div className="kzd-menu-eyebrow">Important notes</div>
              <ul className="kzd-notes" style={{ marginTop: 12 }}>
                {NOTES.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            {BENEFITS.map((b, i) => (
              <div key={b.title} className="kzd-reveal-card kzd-price-card kzd-domain-card kzd-spotlight kzd-card-plain" style={{ display: "flex", gap: 18, padding: "24px 24px", ["--reveal-delay" as string]: `${i * 60}ms` }}>
                <span className="kzd-promise-icon" style={{ flex: "none" }}><Sprite id={b.icon} /></span>
                <div>
                  <h2 className="kzd-serif" style={{ fontSize: 19, lineHeight: 1.25, margin: 0, color: "#1A1A1A" }}>{b.title}</h2>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#3A3A3A", margin: "6px 0 0" }}>{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PanelSection>
    </KzdHome>
  );
}

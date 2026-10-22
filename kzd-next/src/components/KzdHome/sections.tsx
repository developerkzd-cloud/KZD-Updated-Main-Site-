/* ==========================================================================
   The KZD Solutions homepage design from FOSSBilling's kzd theme
   (themes/kzd/html_custom/mod_index_dashboard.html.twig), section for
   section, as server components. Markup, class names, copy and inline
   styles are the Twig's own; only the data source changes:
     - hosting / email plans: src/app/hosting/content.ts (the prices
       configured in FOSSBilling)
     - domain extensions:     src/data/tlds.json
   Behaviour lives in KzdEffects.tsx, bound by the same data-kzd-* hooks.

   The three mega-menu panels of the FOSSBilling header (How it works,
   Plans & pricing, Why KZD) render here as ordinary page sections, since
   kzd-next's own Nav replaces that header.
   ========================================================================== */

import type { CSSProperties, ReactNode } from "react";
import { EMAIL_PLANS, HOSTING_PLANS } from "@/app/hosting/content";
import type { Tld } from "@/lib/content";
import { BUILDER_URL, FOSSBILLING_ORIGIN, HOSTING_PRODUCTS } from "@/lib/kzd-integration";
import DomainSearch from "./DomainSearch";
import KzdEffects from "./KzdEffects";
import Sprite from "./Sprite";
import "./kzd-home.css";

const orderUrl = (params: Record<string, string | number>) =>
  `${FOSSBILLING_ORIGIN}/order?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`;

const rand = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/* ---------------------------------------------------------------------------
   Page shell
   ------------------------------------------------------------------------- */

/* `children` sit on the animated mesh backdrop (the Twig's .kzd-mesh-zone,
   which runs from the hero down to the plans); `after` follows it on plain
   white, as the FAQ does on the homepage. */
export function KzdHome({ children, after }: { children: ReactNode; after?: ReactNode }) {
  return (
    <main className="kzd-home">
      <div className="kzd-mesh-zone">
        <div className="kzd-mesh-parallax"><div className="kzd-mesh-layer" /></div>
        {children}
      </div>
      {after}
      <KzdEffects />
    </main>
  );
}

/* ---------------------------------------------------------------------------
   #builder — the AI builder hero
   ------------------------------------------------------------------------- */

const PROMPT_CHIPS = [
  { label: "Restaurant", prompt: "A seafood restaurant in Durban called Harbour Table" },
  { label: "Consulting", prompt: "A consulting practice in Johannesburg called Meridian Advisory" },
  { label: "Online store", prompt: "An online store selling handmade ceramics, called Clay & Co" },
  { label: "Fitness coach", prompt: "A personal training studio in Cape Town called Form & Function" },
];

const reveal = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;
const checkIcon: CSSProperties = { width: 14, height: 14, color: "#1A1A1A", flex: "none" };
const trustLine: CSSProperties = { display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color: "#3A3A3A" };

export function BuilderHero() {
  return (
    <section id="builder" className="kzd-builder-section" style={{ padding: "76px 32px 0", position: "relative" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div className="kzd-builder-grid" style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(340px, 560px) minmax(0, 1fr)", gap: "48px 56px", alignItems: "start" }}>
          <div className="kzd-builder-copy">
            <h1 className="kzd-serif kzd-reveal" style={{ fontWeight: 400, fontSize: "clamp(28px, 3vw, 44px)", lineHeight: 1.06, letterSpacing: "-0.02em", margin: 0, color: "#1A1A1A", textWrap: "balance", ...reveal(60) }}>
              Describe your business. Get a website.
            </h1>

            <div className="kzd-reveal kzd-hero-checklist" style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 14, ...reveal(200) }}>
              {["Real AI copy", "Real photography", "Live in a minute"].map((feature) => (
                <span key={feature} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#3A3A3A" }}>
                  <Sprite id="check" style={checkIcon} />
                  {feature}
                </span>
              ))}
            </div>

            <form method="get" action={BUILDER_URL} className="kzd-prompt-bar kzd-reveal" data-kzd-prompt-form style={{ marginTop: 18, position: "relative", display: "flex", alignItems: "center", gap: 8, borderRadius: 999, border: "1px solid rgba(26, 26, 26,0.12)", background: "#FFFFFF", boxShadow: "0 1px 2px rgba(26, 26, 26,0.04), 0 24px 48px -24px rgba(26, 26, 26,0.35)", padding: "6px 6px 6px 20px", ...reveal(260) }}>
              <Sprite id="search" style={{ width: 15, height: 15, color: "#6B6B6B", flex: "none" }} />
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <input type="text" name="prompt" autoComplete="off" aria-label="Describe your business" data-kzd-prompt-input style={{ width: "100%", border: 0, outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 15.5, fontWeight: 500, color: "#1A1A1A", padding: "12px 0", boxSizing: "border-box" }} />
                <span className="kzd-prompt-typing" data-kzd-prompt-typing aria-hidden="true" style={{ position: "absolute", inset: "12px 0 auto 0", display: "flex", alignItems: "center", fontSize: 15.5, fontWeight: 500, color: "#6B6B6B", whiteSpace: "nowrap", overflow: "hidden", pointerEvents: "none" }}>
                  <span data-kzd-prompt-typing-text />
                  <span className="kzd-prompt-cursor" />
                </span>
              </div>
              <button type="submit" className="kzd-prompt-submit kzd-press kzd-magnetic" aria-label="Build my website" style={{ flex: "none", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#1A1A1A", color: "#FFFFFF", border: 0, cursor: "pointer" }}>
                <Sprite id="arrow-right" style={{ width: 15, height: 15 }} />
              </button>
            </form>

            <form method="get" action={BUILDER_URL} className="kzd-pinned-prompt" data-kzd-pinned-prompt aria-hidden="true">
              <Sprite id="search" className="icon kzd-pinned-prompt-icon" />
              <input type="text" name="prompt" autoComplete="off" data-kzd-pinned-input placeholder="Describe your business" aria-label="Describe your business" tabIndex={-1} />
              <button type="submit" className="kzd-pinned-prompt-btn kzd-press" aria-label="Build my website" tabIndex={-1}>
                <Sprite id="arrow-right" />
              </button>
            </form>

            <div className="kzd-reveal kzd-chip-row" style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 14, ...reveal(320) }}>
              {PROMPT_CHIPS.map((chip) => (
                <button key={chip.label} type="button" className="kzd-chip" data-kzd-example-chip={chip.prompt} style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(26, 26, 26,0.16)", background: "#FFFFFF", boxShadow: "0 2px 6px -2px rgba(26, 26, 26,0.12)", fontSize: 13, fontWeight: 600, color: "#1A1A1A", cursor: "pointer", fontFamily: "inherit", transition: "border-color .15s ease, transform .15s ease" }}>
                  {chip.label}
                </button>
              ))}
            </div>
            <p className="kzd-hero-trust" style={{ marginTop: 14, ...trustLine }}>
              <Sprite id="check" style={checkIcon} />
              Free to try. No sign-up, no credit card.
            </p>
            <p className="kzd-hero-trust" style={{ marginTop: 6, ...trustLine }}>
              <Sprite id="check" style={checkIcon} />
              Your website is free when you host with us. You only pay for hosting.
            </p>
          </div>

          <div className="kzd-builder-demo" style={{ position: "relative" }}>
            <div className="kzd-builder-sweep" style={{ position: "absolute", top: -70, right: -50, width: 320, height: 320, background: "radial-gradient(circle, rgba(26, 26, 26,0.22), transparent 72%)", zIndex: 0, pointerEvents: "none" }} />
            <div className="kzd-reveal-card" style={{ position: "relative", zIndex: 2, borderRadius: 14, border: "1px solid rgba(26, 26, 26,0.12)", background: "#FFFFFF", boxShadow: "0 40px 90px -30px rgba(26, 26, 26,0.4), 0 70px 130px -50px rgba(26, 26, 26,0.32)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 18px", borderBottom: "1px solid rgba(26, 26, 26,0.1)", background: "#F4F5F7" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(26, 26, 26,0.18)", display: "block" }} />
                ))}
                <span style={{ marginLeft: 12, fontSize: 12, color: "#6B6B6B", letterSpacing: "0.02em" }}>kzdhosting.co.za/build</span>
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1A1A1A" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A1A1A", display: "block" }} />
                  Live
                </span>
              </div>
              <div className="kzd-builder-video-frame" style={{ position: "relative", background: "#1A1A1A", aspectRatio: "16 / 9" }}>
                <video className="kzd-builder-video" autoPlay muted loop playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}>
                  <source src="/kzd-home/builder-demo.mp4" type="video/mp4" />
                </video>
                <button type="button" className="kzd-video-toggle" data-kzd-video-toggle aria-label="Pause video">
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }} data-kzd-icon-pause>
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15, display: "none" }} data-kzd-icon-play>
                    <path d="M7 4.5v15l14-7.5-14-7.5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   #templates-strip — real sites the builder generated
   ------------------------------------------------------------------------- */

const TEMPLATES = [
  { name: "Studio Lumen", category: "Hair & skin salon", type: "Salons & spas", photo: "/kzd-home/studio-lumen.jpg" },
  { name: "Saffron Terrace", category: "Restaurant", type: "Restaurants & cafes", photo: "/kzd-home/saffron-terrace.jpg" },
  { name: "Clay & Co", category: "Online store", type: "Online stores", photo: "/kzd-home/clay-co.jpg" },
  { name: "Harbour House", category: "Guesthouse", type: "Guesthouses", photo: "/kzd-home/harbour-house.jpg" },
  { name: "Northbound Studio", category: "Creative studio", type: "Agencies & studios", photo: "/kzd-home/northbound-studio.jpg" },
];

export function TemplatesStrip() {
  return (
    <>
      <div style={{ padding: "0 32px", maxWidth: 1240, margin: "40px auto 0" }}>
        <div className="kzd-reveal" style={{ borderTop: "2px solid rgba(26, 26, 26,0.14)", paddingTop: "clamp(24px, 3vw, 36px)", textAlign: "center" }}>
          <div className="kzd-ed-eyebrow" style={{ justifyContent: "center" }}>No coding needed</div>
          <h2 className="kzd-ed-h2" style={{ margin: "12px auto 0", fontSize: "clamp(26px, 3.2vw, 40px)", textWrap: "balance", maxWidth: "20ch" }}>
            Friction-free. The only limit is your imagination.
          </h2>
        </div>
      </div>
      <section id="templates-strip" style={{ padding: "32px 32px clamp(64px, 7vw, 104px)", overflow: "hidden" }}>
        <div className="kzd-coverflow-stage">
          {TEMPLATES.map((t) => (
            <div className="kzd-cf-card" key={t.name}>
              <div className="kzd-template-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- the coverflow CSS sizes these directly */}
                <img className="kzd-tpl-real-shot" src={t.photo} alt={t.name} loading="lazy" decoding="async" />
              </div>
              <div className="kzd-template-label">
                {t.name}
                <span className="kzd-template-label-category">{t.category}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="kzd-types-tabs-wrap" data-kzd-types aria-hidden="true">
          <div className="kzd-types-tabs" data-kzd-types-tabs>
            <span className="kzd-types-notch" data-kzd-types-notch />
            {TEMPLATES.map((t) => (
              <span className="kzd-types-tab" data-kzd-type-pill key={t.type}>{t.type}</span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------------------
   How it works (the "steps" mega-menu panel)
   ------------------------------------------------------------------------- */

const STEPS = [
  { n: "01", title: "Describe the business", body: "One sentence: what it is, who it serves and where it operates." },
  { n: "02", title: "AI drafts the whole site", body: "Copy, palette, layout and real photography, not lorem ipsum in a template." },
  { n: "03", title: "Publish it your way", body: "Download a real codebase, a WordPress theme, or ask us to host it. Live in minutes." },
];

const panelSection: CSSProperties = { maxWidth: 1240, margin: "0 auto", padding: "clamp(48px, 6vw, 80px) 32px" };
const panelH: CSSProperties = { fontWeight: 400, fontSize: "clamp(26px, 2.8vw, 38px)", letterSpacing: "-0.01em" };
const panelLede: CSSProperties = { fontSize: 15.5, lineHeight: 1.65, color: "#3A3A3A", margin: "0 0 32px", maxWidth: 560 };
const ctaText: CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1A1A1A", borderBottom: "1px solid #1A1A1A", paddingBottom: 4 };

export function StepsSection({ cta = "#builder", ctaLabel = "Try the builder" }: { cta?: string; ctaLabel?: string }) {
  return (
    <section id="how-it-works" style={panelSection}>
      <span className="kzd-menu-eyebrow">How it works</span>
      <h2 className="kzd-serif" style={{ ...panelH, margin: "10px 0 36px" }}>Live in three steps, not three weeks</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 20 }}>
        {STEPS.map((s, i) => (
          <div key={s.n} className="kzd-reveal-card kzd-price-card kzd-domain-card kzd-spotlight" style={{ display: "flex", flexDirection: "column", padding: "28px 26px 26px", ...reveal(i * 70) }}>
            <div className="kzd-gradient-bar kzd-domain-card-bar" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3 }} />
            <span className="kzd-serif" style={{ fontSize: 13, color: "#6B6B6B" }}>{s.n}</span>
            <h3 className="kzd-serif" style={{ fontSize: 19, fontWeight: 400, margin: "10px 0 0", color: "#1A1A1A" }}>{s.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#6B6B6B", margin: "8px 0 0" }}>{s.body}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28 }}>
        <a href={cta} className="kzd-cta-text" style={ctaText}>{ctaLabel} &rarr;</a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Plans & pricing — Domains / Business Email / Shared Hosting tabs
   (the "hosting" mega-menu panel)
   ------------------------------------------------------------------------- */

const TLD_LABELS: Record<string, string> = {
  ".co.za": "South Africa", ".com": "Most Popular", ".net": "Networks",
  ".org": "Organizations", ".africa": "African Focus", ".joburg": "Johannesburg",
};

const PRODUCT_COPY: Record<string, string> = {
  hostingStarter: "2 GB SSD storage, 1 website, 10 mailboxes, weekly backups and a free SSL certificate.",
  hostingBasic: "4 GB SSD storage, 2 websites, 15 mailboxes, weekly backups and a free SSL certificate.",
  hostingStandard: "7 GB SSD storage, 5 websites, 25 mailboxes, weekly backups and a free SSL certificate.",
  hostingBusiness: "15 GB SSD storage, 10 websites, 50 mailboxes, weekly backups and priority support.",
  businessEmail: "25 professional mailboxes with webmail, Outlook and mobile support, and spam filtering.",
  premiumBusinessEmail: "100 mailboxes with larger storage, spam protection and DKIM/SPF email security.",
};

/* Twig's |truncate(30): cut at 30 characters and mark it. */
const truncate = (s: string, n = 30) => (s.length > n ? s.slice(0, n) + "..." : s);

type ProductCard = { key: keyof typeof HOSTING_PRODUCTS; title: string; price: number };

const CATEGORIES: { id: string; title: string; products: ProductCard[] }[] = [
  {
    id: "cat-email",
    title: "Business Email",
    products: EMAIL_PLANS.map((p) => ({ key: p.key, title: p.name, price: p.monthlyPrice })),
  },
  {
    id: "cat-hosting",
    title: "Shared Hosting",
    products: HOSTING_PLANS.map((p) => ({ key: p.key, title: `${p.name} Hosting`, price: p.monthly })),
  },
];

const simpleCard: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "32px 24px", textDecoration: "none" };
const cardPrice: CSSProperties = { marginTop: 20, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#1A1A1A", fontVariantNumeric: "tabular-nums" };
const cardTerm: CSSProperties = { marginTop: 2, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "#6B6B6B" };

/* The Domains tab's extension cards, .co.za featured. */
export function TldCards({ tlds }: { tlds: Tld[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 20 }}>
      {tlds.map((tld, i) => (
        <a key={tld.ext} href={orderUrl({ product: 1, register_tld: tld.ext })} className={`kzd-domain-card-simple kzd-tld-card kzd-spotlight${tld.ext === ".co.za" ? " is-featured" : ""}`} style={reveal((i % 6) * 70)}>
          <span className="kzd-tld-card-id">
            <span className="kzd-serif kzd-tld-card-name">{tld.ext}</span>
            <span className="kzd-tld-card-label">{TLD_LABELS[tld.ext] ?? "Domain extension"}</span>
          </span>
          <span className="kzd-tld-card-price">
            <span className="kzd-tld-card-amount"><span className="kzd-price-mark">R</span>{rand(tld.register)}</span>
            <span className="kzd-tld-card-term">per year</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export function PricingTabs({ tlds, initial = "tlds", id = "pricing" }: { tlds: Tld[]; initial?: "tlds" | "cat-hosting" | "cat-email"; id?: string }) {
  const featured = tlds.find((t) => t.ext === ".co.za");
  const ordered = featured ? [featured, ...tlds.filter((t) => t.ext !== ".co.za")] : tlds;
  const tabs = [{ id: "tlds", title: "Domains" }, ...CATEGORIES.map((c) => ({ id: c.id, title: c.title }))];

  return (
    <section id={id} style={panelSection}>
      <span className="kzd-menu-eyebrow">Plans &amp; pricing</span>
      <h2 className="kzd-serif" style={{ ...panelH, margin: "10px 0 8px" }}>
        Hosting solutions for <span style={{ fontStyle: "italic", color: "#1A1A1A" }}>any</span> project
      </h2>
      <p style={panelLede}>Shared hosting, business email and domain registration. Pick a plan below and see exactly what is included before you order.</p>

      <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === initial} className={`kzd-tab-btn${t.id === initial ? " is-active" : ""}`} data-kzd-tab={t.id}>
            <span>{t.title}</span>
          </button>
        ))}
      </div>

      <div className={`kzd-tab-panel${initial === "tlds" ? " is-active" : ""}`} data-kzd-panel="tlds">
        <h3 className="kzd-serif" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em", margin: "0 0 8px", textAlign: "center", color: "#1A1A1A" }}>Find Your Perfect Domain</h3>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#6B6B6B", margin: "0 auto 24px", maxWidth: 480, textAlign: "center" }}>
          Secure your online identity with a memorable domain name. Search for availability and register instantly through your KZD Solutions account.
        </p>

        <DomainSearch tlds={tlds.map((t) => t.ext)} />

        <TldCards tlds={ordered.slice(0, 6)} />
        {ordered.length > 6 && (
          <>
            <div style={{ marginTop: 32, textAlign: "center" }}>
              <button type="button" className="kzd-cta-text kzd-press" data-kzd-expand-trigger="all-tlds" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1A1A1A", border: "1px solid rgba(26, 26, 26,0.16)", borderRadius: 999, padding: "12px 24px", background: "none", cursor: "pointer" }}>
                Show all {ordered.length} extensions
              </button>
            </div>
            <div data-kzd-expand-target="all-tlds" hidden style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 20 }}>
              {ordered.slice(6).map((tld) => (
                <a key={tld.ext} href={orderUrl({ product: 1, register_tld: tld.ext })} className="kzd-domain-card-simple kzd-spotlight" style={simpleCard}>
                  <span className="kzd-serif" style={{ fontWeight: 700, fontSize: 23, letterSpacing: "-0.02em", margin: 0, color: "#1A1A1A" }}>{tld.ext}</span>
                  <span style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>{TLD_LABELS[tld.ext] ?? "Domain extension"}</span>
                  <span style={cardPrice}><span className="kzd-price-mark">R</span>{rand(tld.register)}</span>
                  <span style={cardTerm}>per year</span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat.id} className={`kzd-tab-panel${initial === cat.id ? " is-active" : ""}`} data-kzd-panel={cat.id} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))", gap: 24 }}>
          {cat.products.map((p, i) => (
            <a key={p.key} href={orderUrl({ product: HOSTING_PRODUCTS[p.key] })} className="kzd-domain-card-simple kzd-spotlight" style={{ ...simpleCard, ...reveal((i % 6) * 70) }}>
              <span className="kzd-serif" style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", margin: 0, color: "#1A1A1A" }}>{p.title}</span>
              <span style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#6B6B6B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{truncate(PRODUCT_COPY[p.key] ?? "")}</span>
              <span style={cardPrice}><span className="kzd-price-mark">R</span>{rand(p.price)}</span>
              <span style={cardTerm}>per month</span>
            </a>
          ))}
        </div>
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------------------
   #plans — "Pick a plan, we run the rest" tier cards
   ------------------------------------------------------------------------- */

const PLAN_LINES: Record<string, string> = {
  hostingStarter: "Great for a personal site or a first business page.",
  hostingBasic: "A step up once one site is not enough.",
  hostingStandard: "Our most popular plan for small businesses.",
  hostingBusiness: "For growing businesses running several sites.",
};

function Feature({ text }: { text: string }) {
  const words = text.split(" ");
  if (/^\d+ GB /.test(text)) return <span><strong>{words.slice(0, 2).join(" ")}</strong> {words.slice(2).join(" ")}</span>;
  if (/^\d+ /.test(text)) return <span><strong>{words[0]}</strong> {words.slice(1).join(" ")}</span>;
  return <span>{text}</span>;
}

const Tick = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Arrow = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function TierPlans() {
  const plans = HOSTING_PLANS;
  const allFeats = plans.map((p) => p.features.map((f) => f.text));
  const shared = allFeats[0].filter((f) => allFeats.every((fl) => fl.includes(f)));

  /* Months free per term, derived from the real prices, and only claimed
     when every plan agrees on it. */
  const freeY = [...new Set(plans.map((p) => Math.round(12 - p.yearly / p.monthly)))];
  const free2Y = [...new Set(plans.map((p) => Math.round(24 - p.twoyear / p.monthly)))];
  const savingY = freeY.length === 1 && freeY[0] > 0 ? `${freeY[0]} months free` : "";
  const saving2Y = free2Y.length === 1 && free2Y[0] > 0 ? `${free2Y[0]} months free` : "";

  return (
    <section id="plans" className="kzd-pp pp-body kzd-reveal" style={{ padding: "0 32px" }} data-kzd-plans>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div className="kzd-tier-head">
          <div>
            <div className="kzd-tier-eyebrow">South African hosting, managed for you</div>
            <h2 className="kzd-tier-title">Pick a plan, we run the rest</h2>
            <p className="kzd-tier-lede">Prices in rand, VAT included. Switch to yearly billing to see what you save.</p>
          </div>
          <div className="kzd-tier-billing">
            <div className="kzd-tier-toggle" role="group" aria-label="Billing period">
              <button type="button" data-kzd-period="1M" aria-pressed="true">Monthly</button>
              <button type="button" data-kzd-period="1Y" aria-pressed="false">Yearly</button>
              <button type="button" data-kzd-period="2Y" aria-pressed="false">2 Years</button>
            </div>
            <span className="kzd-tier-saving" data-kzd-saving aria-live="polite" data-saving-1m="" data-saving-1y={savingY} data-saving-2y={saving2Y} />
          </div>
        </div>

        <div className="kzd-tier-grid">
          {plans.map((p) => {
            const best = p.key === "hostingStandard";
            const feats = p.features.map((f) => f.text).filter((f) => !shared.includes(f));
            const id = HOSTING_PRODUCTS[p.key];
            return (
              <article key={p.key} className={`kzd-tier-card${best ? " is-best" : ""}`} aria-labelledby={`kzd-plan-${id}`}>
                <div className="kzd-tier-name-row">
                  <h3 className="kzd-tier-name" id={`kzd-plan-${id}`}>{p.name}</h3>
                  {best && <span className="kzd-tier-badge">Most popular</span>}
                </div>
                <p className="kzd-tier-desc">{PLAN_LINES[p.key]}</p>
                <div className="kzd-tier-amount-row">
                  <span className="kzd-tier-rand">R</span>
                  <span className="kzd-tier-amount" data-kzd-price data-price-1m={rand(p.monthly)} data-price-1y={rand(p.yearly)} data-price-2y={rand(p.twoyear)}>{rand(p.monthly)}</span>
                  <span className="kzd-tier-per" data-kzd-per data-per-1m="/mo" data-per-1y="/year" data-per-2y="/2 years">/mo</span>
                </div>
                <div className="kzd-tier-note" data-kzd-billed data-billed-1m="Billed monthly" data-billed-1y={`Works out to R${rand(p.yearly / 12, 2)}/mo`} data-billed-2y={`Works out to R${rand(p.twoyear / 24, 2)}/mo`}>Billed monthly</div>
                <a className="kzd-tier-cta" href={orderUrl({ product: id })}>
                  Get started
                  <Arrow />
                </a>
                <ul className="kzd-tier-feats">
                  {feats.map((f) => (
                    <li key={f}>
                      <Tick />
                      <Feature text={f} />
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="kzd-tier-nav" data-kzd-tier-nav>
          <button type="button" className="kzd-tier-arrow" data-kzd-tier-prev aria-label="Previous plans">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="kzd-tier-dots" aria-hidden="true">
            {plans.map((p) => <span key={p.key} />)}
          </div>
          <button type="button" className="kzd-tier-arrow" data-kzd-tier-next aria-label="More plans">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        {shared.length > 0 && (
          <div className="kzd-tier-shared">
            <span className="kzd-tier-shared-label">Every plan includes</span>
            <ul>
              {shared.map((f) => (
                <li key={f}>
                  <Tick />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Why KZD (the "why" mega-menu panel)
   ------------------------------------------------------------------------- */

const eyebrowSmall: CSSProperties = { fontFamily: "var(--kzd-font-display), 'Inter Tight', system-ui, sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1A1A" };

const PROMISES = [
  { span: 3, icon: "user", label: "Partnership", title: "Your hosting partner", body: "We handle server setups, migrations and the everyday problems, so you can focus on running the business.", delay: 60 },
  { span: 3, icon: "lock", label: "Uptime", title: "99.9% on secure servers", body: "Fast, highly secure cloud servers with round-the-clock monitoring and a team ready for anything.", delay: 120 },
  { span: 2, icon: "settings", label: "Location", title: "Hosted on local soil", body: "Based in Durban, so your visitors get first-class speed wherever you trade.", delay: 0 },
  { span: 2, icon: "arrows-exchange", label: "Migration", title: "We move you in", body: "Quick and free of charge, handled by our engineers.", delay: 60 },
  { span: 2, icon: "wallet", label: "Guarantee", title: "Thirty days to decide", body: "Money back within thirty days. No conversation required.", delay: 120 },
];

export function WhySection() {
  return (
    <section id="why-kzd" style={panelSection}>
      <span className="kzd-menu-eyebrow">Why KZD</span>
      <h2 className="kzd-serif" style={{ ...panelH, margin: "10px 0 8px" }}>
        Real service from <span style={{ fontStyle: "italic", color: "#1A1A1A" }}>real people</span>
      </h2>
      <p style={panelLede}>Think of us as your partner in hosting. Server setups, a broken website at midnight, email that will not send: our team holds experts in every field, so no question is too tough.</p>

      <div className="kzd-promise-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 24 }}>
        <div className="kzd-reveal-card kzd-price-card kzd-spotlight" style={{ gridColumn: "span 6", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 28, alignItems: "center", background: "radial-gradient(120% 160% at 100% -20%, rgba(107, 107, 107,0.4), transparent 55%), radial-gradient(90% 140% at -10% 120%, rgba(107, 107, 107,0.35), transparent 55%), #1A1A1A", color: "#F4F5F7", padding: "44px 40px", position: "relative", overflow: "hidden", ...reveal(0) }}>
          <div className="kzd-gradient-bar" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3 }} />
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.22)" }}>
              <Sprite id="lifebuoy" style={{ width: 22, height: 22, color: "#FFFFFF" }} />
            </span>
            <div style={{ ...eyebrowSmall, marginTop: 20, color: "#A7A7A7" }}>Support</div>
            <h3 className="kzd-serif" style={{ fontWeight: 400, fontSize: 32, lineHeight: 1.15, margin: "12px 0 0", color: "#FFFFFF" }}>Answered by a real person, every time.</h3>
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 1.7, color: "#D9D9D9", margin: 0 }}>
            Our support team is on hand for any hosting query, and they stay with it until the thing is genuinely fixed. No ticket queue, no chatbot loop, no &ldquo;we&apos;ll escalate this.&rdquo;
          </p>
        </div>

        {PROMISES.map((p) => {
          const big = p.span === 3;
          return (
            <div key={p.label} className="kzd-reveal-card kzd-price-card kzd-domain-card kzd-spotlight kzd-card-plain" style={{ gridColumn: `span ${p.span}`, display: "flex", flexDirection: "column", padding: big ? "34px 30px 32px" : "32px 28px 30px", ...reveal(p.delay) }}>
              <span className="kzd-promise-icon"><Sprite id={p.icon} /></span>
              <div style={{ ...eyebrowSmall, marginTop: big ? 20 : 18 }}>{p.label}</div>
              <h3 className="kzd-serif" style={{ fontSize: big ? 26 : 22, lineHeight: 1.2, margin: "12px 0 0", color: "#1A1A1A" }}>{p.title}</h3>
              <p style={{ fontSize: big ? 15.5 : 14.5, lineHeight: 1.6, color: "#3A3A3A", margin: `${big ? 14 : 12}px 0 0` }}>{p.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Generic panel section: the eyebrow + heading + lede every mega-menu panel
   opens with, around any body. Used by the /domains sub-pages.
   ------------------------------------------------------------------------- */

export function PanelSection({ id, eyebrow, title, lede, children, as = "h2" }: { id?: string; eyebrow: string; title: ReactNode; lede?: ReactNode; children?: ReactNode; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <section id={id} className="kzd-pp" style={panelSection}>
      <span className="kzd-menu-eyebrow">{eyebrow}</span>
      <H className="kzd-serif" style={{ ...panelH, margin: lede ? "10px 0 8px" : "10px 0 32px" }}>{title}</H>
      {lede && <p style={panelLede}>{lede}</p>}
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------------------
   #faq
   ------------------------------------------------------------------------- */

export type FaqItem = { q: string; a: ReactNode };

export const DOMAIN_FAQ: FaqItem[] = [
  { q: "How long does domain registration take?", a: "Most domains are registered and active within minutes of a successful payment. Some country-code extensions may take slightly longer while WHOIS records propagate." },
  { q: "Can I use my own nameservers?", a: "Yes. During checkout in your client portal you can choose to use your own nameservers instead of the KZD Solutions defaults." },
  { q: "How do I manage my domain after registering?", a: "Every domain you register is manageable from your KZD Solutions client dashboard, where you can update nameservers, contact details, and renewal settings." },
  { q: "What happens when my domain is about to expire?", a: "You'll receive renewal reminders by email ahead of your expiry date, and can renew directly from your client dashboard." },
];

export function FaqSection({ items = DOMAIN_FAQ }: { items?: FaqItem[] }) {
  return (
    <section id="faq" className="kzd-ed" style={{ padding: "0 32px clamp(56px, 7vw, 104px)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", borderTop: "2px solid rgba(26, 26, 26,0.14)", paddingTop: "clamp(24px, 3vw, 36px)" }}>
        <h2 className="kzd-reveal kzd-faqcard-title">Frequently Asked Questions</h2>
        <div className="kzd-faqcard-list">
          {items.map((item, i) => (
            <div key={item.q} className="kzd-faqcard kzd-reveal" style={reveal(i * 60)} data-kzd-faqcard>
              <button type="button" className="kzd-faqcard-btn" data-kzd-faqcard-trigger aria-expanded="false">
                <span className="kzd-faqcard-q">{item.q}</span>
                <span className="kzd-faqcard-icon" data-kzd-faqcard-icon aria-hidden="true">+</span>
              </button>
              <div className="kzd-faqcard-panel" data-kzd-faqcard-panel>
                <div style={{ overflow: "hidden" }}>
                  <p className="kzd-faqcard-a">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

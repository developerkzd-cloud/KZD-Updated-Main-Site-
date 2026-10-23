# Architecture

## The two-repository split

KZD Solutions runs on two independent applications, each with its own repo:

| | Repo | Role |
|---|---|---|
| Website | `KZD-Website-Updates` (static HTML/CSS/JS) | Marketing, SEO, product pages. No billing/account logic of its own. |
| FOSSBilling | `KZD-Fossbilling` (this repo, PHP) | Client portal: billing, invoicing, provisioning records, support, domains. |

They talk to each other in one direction only: the website links *into*
FOSSBilling for anything account/order/payment related. FOSSBilling never
calls back into the website. The join point is a single file:

```
website/js/kzd-integration.js
```

This defines `KZD.portalUrl` (the FOSSBilling base URL) and `KZD.products`
(a hand-maintained map from a short key like `hostingStarter` to the actual
FOSSBilling product ID). `KZD.goToHostingOrder('hostingStarter')` just does
`window.location.href = portalUrl + '/order?product=' + id`. There's no API
call, no shared session, no embedded iframe — it's a plain link handoff.
**If a product's ID changes (e.g. catalog gets reset), update the map in
this one file and the corresponding constant wherever it's referenced.**

**⚠️ Drift found, not yet resolved**: this table describes the website as
a separate static repo, but the actual marketing homepage (hero, prompt
bar, "Describe your business" copy) lives in *this* repo, as
`themes/kzd/html_custom/mod_index_dashboard.html.twig` — FOSSBilling's own
guest Index module. Either the marketing homepage's source of truth has
quietly moved here and this section is stale, or that file is a duplicate
of something meant to live in `KZD-Website-Updates`. Worth resolving
deliberately rather than leaving both plausible.

## Why this split, not a monolith

The website is a fast, cheap-to-host static site optimized for marketing/SEO.
FOSSBilling is a real PHP application with a database, cron jobs, and a
security surface (payments, PII, domain credentials) that has no business
being on the same stack as a brochure site. Keeping them separate means a
website typo can't take down billing, and a FOSSBilling security patch
doesn't require touching the marketing site.

## FOSSBilling internals

Stock FOSSBilling v0.8.5 (Apache-2.0, MIT-licensed adapters). Structure:

- `modules/` — one folder per feature area (Invoice, Client, Orderbutton,
  Servicedomain, Support, etc.), each with `Api/{Admin,Client,Guest}.php`
  (the API surface), `Service.php` (business logic), `Controller/` (routes),
  `templates/` (default Twig views).
- `library/Payment/Adapter/` — payment gateways. `Paystack.php` is
  KZD-specific (see `PAYSTACK.md`).
- `library/Registrar/Adapter/` — domain registrars. `Hostafrica.php` and
  `OpenProvider.php` are KZD-specific (see `HOSTAFRICA.md`, `OPENPROVIDER.md`).
- `themes/kzd/` — the client-facing theme (what customers see). Started as a
  copy of the stock `huraga` theme.
- `themes/admin_default/` — the admin panel theme (Tabler-based). Mostly
  stock; only branding-related files were touched (see `BRANDING.md`).

### The `html_custom` override mechanism — the most important thing to know

Every theme has two template directories: `html/` (the original, stock
templates) and `html_custom/` (KZD overrides). FOSSBilling's Twig loader
checks `html_custom/` **first**, falls back to `html/` if a file isn't
there (`library/FOSSBilling/Twig/TwigLoader.php`). **Never edit a file in
`html/` if you can instead copy it into `html_custom/` and edit the copy** —
that keeps a clean diff against upstream FOSSBilling and makes future core
updates safe to pull without clobbering customizations.

This project isn't perfectly consistent about that rule — a few small,
surgical edits went directly into `html/` files (e.g. one line in
`themes/admin_default/html/layout_default.html.twig` to pass `show_name:
true`) where copying the entire surrounding file into `html_custom/` would
have created a large, drift-prone duplicate for a one-line change. Each such
exception is commented in the file explaining why.

### Where content actually lives

A lot of "content" isn't in template files at all — it's in the database:

- **Email templates**: `email_template` table (`content`/`subject`
  columns). The `.twig` files in `themes/kzd/email-templates/` are
  **backups**, not the live source — see that folder's own README.
- **Products/pricing**: `product`, `product_payment`,
  `product_category` tables. Seeded via one-off PHP scripts in
  `themes/kzd/data-seeds/` (also kept as version-controlled records of what
  was seeded and why).
- **Extension config** (including SMTP, Paystack keys, registrar
  credentials): `extension_meta` table, encrypted, keyed generically by
  `meta_key = 'config'` per extension — not obviously named, easy to miss
  when grepping the database.
- **System settings** (invoice numbering, company info): `setting` table,
  one row per param.

## Deployment topology

- **Website**: GitHub Actions FTP-deploys to shared/reseller hosting on
  push to `main`.
- **FOSSBilling**: lives on a Contabo VPS (aaPanel), deployed via a
  dedicated GitHub Actions SSH workflow — see `DEPLOYMENT.md`.
- **Local dev**: Laragon on Windows, `fossbilling.test`, MySQL database
  `fossbilling_v085`. Two independent PHP installs exist on the dev
  machine (Laragon's own PHP, and a separate XAMPP install that happens to
  be on `PATH` for CLI use) — they have **different `php.ini` files**, so a
  fix that works from one CLI context may not reflect what the actual
  website is doing. If something behaves differently in a browser than in
  a CLI test script, check which PHP binary is actually in play.
- **AI Website Builder**: a third application, not part of either repo
  above — see `AI_WEBSITE_BUILDER.md`. Mounted at `/build` via a reverse
  proxy to a small Node/Express process. Not currently in git at all.

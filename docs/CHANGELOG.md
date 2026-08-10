# Changelog

High-level summary of customization milestones since the baseline install.
For exact diffs, `git log` is authoritative — this is a curated narrative,
not a replacement for it.

## Baseline

Fresh FOSSBilling 0.8.5 install (`40cd0ba`).

## Payment & registrar integration

- Installed and fixed the Paystack payment adapter (`c6af091`).
- Installed and fixed the HostAfrica domain registrar adapter (`884d152`).
- Installed and fixed the OpenProvider domain registrar adapter (`36bd69a`).
- One-click payment: save reusable Paystack authorizations, charge them
  directly without a checkout redirect (`f74539a`).

## Branding

- Authentication pages: branded split-panel layout (login/signup/password-reset)
  via `html_custom` overrides (`7a0c52b`).
- Dashboard redesign: quick actions, icon stat cards, restyled activity
  panels (`79f527c`).
- Guest landing page: marketing hero, feature grid matching the website's
  visual language (`8f16f69`, `d3bf109`).
- Navigation: grouped sidebar, pinned quick actions (`2e32d31`).
- Email branding: 8 customer-facing templates rebranded (`fb9321e`).
- White-labeled the client portal — removed the "Powered by FOSSBilling"
  credit (`d64a791`).
- Admin login: logo + company name (`830c8a9`).
- Admin dashboard: same treatment, plus replaced stock Tabler blue with the
  brand color across the whole admin area (`96ab6ff`, `c0469c8`).

## Website integration

- Seeded real TLD pricing (15 extensions) and domain transfer support in
  the order form (`df54a3e`).
- EPP/transfer code prefill from the website's `?epp=` query param
  (`49061d8`).
- Created the 4 Shared Hosting products in the catalog (`7b4697d`).
- Added real annual/2-year hosting pricing (`943047d`).
- Fixed silent failure on unavailable domains, added TLD suggestions
  (`54e35d3`).
- Website header: replaced the single "Get in Touch" CTA with Login/Register
  linking directly into the client portal, styled to match the nav (not
  separate buttons), positioned in a dedicated right-aligned column so the
  rest of the nav didn't visibly shift.
- Cleaned up: archived unused "coming soon" pages, removed a duplicate
  `images1/` asset folder, fixed a dead footer logo link and mismatched
  contact phone numbers, added missing SEO meta descriptions.

## Workflow & infrastructure

- Established `main`/`develop` branch convention for both repos.
- Added CI (PHP syntax lint) for FOSSBilling (`a3beee3`).
- Expanded `.gitignore`, disabled HostAfrica's order-time email-forwarding
  add-on to avoid surprise billing (`adbfc71`).
- Built and hardened an automated production deploy pipeline: nightly +
  manual trigger, forced-command-restricted SSH key, read-only GitHub
  deploy key for the server's `git pull` — see `DEPLOYMENT.md` for the full
  design.

## Bug fixes found via review and testing

- Fixed mid-order login/register redirect dropping customers to the
  homepage instead of back to their in-progress order (`aa59378`).
- Made the one-click-payment `client_saved_card` table self-healing instead
  of depending on a manual setup script (`aa59378`).
- Fixed Paystack's "auto-redirect" — turned out to be two stacked bugs (a
  config setting that could never be enabled, then a jQuery dependency this
  theme doesn't have) — see `PAYSTACK.md` (`e51f0ad`, `bf09eb4`).
- Added a step indicator to the order flow (`f34d4fd`).

## Pricing strategy update

- Reduced hosting storage allocations (5/10/20/50 GB → 2/4/7/15 GB) to
  avoid overselling the HostAfrica reseller account; added Business Email
  as a new product category (`c8c922a`).

## Phase 8 — email template rebrand

Rebranded the 11 customer-facing lifecycle/reminder templates
(`servicecustom_*`, `servicedomain_*`, invoice due/reminder) — the ones
that actually fire for this catalog, since hosting/email products are
`type=custom` (`fe3ab12`).

## Phase 9 — end-to-end testing

Full test pass across new customer purchase, returning customer, support
tickets (client + guest), admin workflow, and Business Email ordering — see
`END_TO_END_TESTING.md` for detailed results. Domain registration/transfer
identified as untestable from local dev (registrar IP whitelist).

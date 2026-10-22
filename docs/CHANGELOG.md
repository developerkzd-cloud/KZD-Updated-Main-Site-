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
- Fixed the admin "Create New Order" page crashing on any recurring-priced
  product — `Box_Period` defines 9 billing periods (up to 5Y) but
  `Product\Service`'s pricing builder only ever produces 7 (up to 3Y), and
  the period dropdown indexed straight into the shorter list. Found while
  importing an existing HostAfrica/DirectAdmin client into FOSSBilling
  (`78b93fb`).

## Existing-client onboarding incident (2026-09-06 to 2026-09-08)

Full investigation and fixes triggered by trying to bring `philfabu`
(philfabulous.co.za, a client who already had a DirectAdmin account before
being added to FOSSBilling) into the system, plus two live signups
(`sktradingstore.co.za`, `stylesbycebs.co.za`) whose domains silently failed
to register. Three separate, unrelated root causes, not one bug:

- **DirectAdmin "Log in to Dashboard" timing out for `philfabu`**: not a
  FOSSBilling bug. The service record's `username` was correct (verified
  against the real DirectAdmin account), and `library/Server/Manager/Directadmin.php`
  was sending a correctly-formed `CMD_API_LOGIN_KEYS` request the whole time
  (the DirectAdmin username is passed via HTTP Basic Auth impersonation,
  `reseller|user`, not a URL parameter — easy to mistake for "missing" from
  the request log, it isn't). Root cause was a transient network-level block
  between the production server (Contabo, `164.68.121.94`) and
  `da26.host-ww.net` — TCP connections timed out with no SYN-ACK on both
  port 443 and 2222, while the same host responded normally from every other
  network tested. Most likely a brute-force/failed-auth auto-block
  (consistent with the CSF/LFD SMTP incident documented in
  `PRODUCTION_READINESS.md`), though never conclusively confirmed on
  HostAfrica's end — it resolved on its own within about a day. **No code
  change** — if this recurs, retest plain TCP connectivity to
  `da26.host-ww.net:2222`/`:443` from the production server before assuming
  it's FOSSBilling's fault.
- **Admin order-manage page crashing for any non-group-master order**
  (`6cb114f`, `df4a803`) — real, previously-undiscovered stock bug, not
  specific to any one client. `mod_order_manage.html.twig` only sets the
  `addons` variable `{% if order.group_master == 1 %}`, but references it
  unconditionally in two places (the Addons nav-tab visibility check, and
  the tab content's `{% for addon in addons %}` loop). With this install's
  `strict_variables: true` Twig config, that's a hard "Variable does not
  exist" fatal for *any* order that isn't a group master — i.e. most single
  orders. Guarded both references (`is defined`, `|default([])`).
- **Domain registration ("Failed Setup") for two live signups** — two
  independent causes, not a code bug either:
  1. HostAfrica's reseller account was temporarily out of credit at the
     moment each order activated (`{"error":"Reseller does not have enough
     credits on his account"}`, found in `activity_system`). Resolved by
     topping up the reseller balance and re-running `Order::activate()` via
     the admin order's "Activate" button (works because
     `Order\Api\Admin::renew()`/`activate()` already retries a
     `failed_setup` order correctly — no manual DB surgery needed).
  2. Even after the balance was fixed, registration failed again on a
     *different* error: HostAfrica's EPP contact-create call rejects blank
     `city`/`address`/`country`/`phone` fields, and neither of these
     clients' profiles had a postal address on file — unsurprising, since
     client signup never required one
     (`Client\Api\Guest::create()`'s `RequiredParams` is just
     email/name/password). `Servicedomain::_getD()` **[core edit]**
     (`514ef11`, `ed5082b`) now defaults the registrant contact to KZD's own
     registered business address (new `company_city`/`company_state`/
     `company_postcode`/`company_country`/`company_phone_cc` rows in the
     `setting` table, alongside the existing `company_address_1`/
     `company_tel`), consistent with domains already being registered under
     KZD's own reseller account rather than the client's. A client's own
     profile address (if they fill one in) is still consulted, but only as
     a last-resort fallback below the company default and any explicit
     per-order contact override.
  Both affected orders (`#2`, `#6`) were manually retried once each root
  cause was fixed; the underlying data fix (company `setting` rows,
  `service_domain.contact_*` for these two existing rows) is not
  automated/scripted anywhere else.

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

## Phase 11 — domain/hosting checkout UX and DirectAdmin go-live

- Fixed Register/Transfer being silently blocked by a hidden own-domain
  checkbox's `required` attribute, added the same TLD-unavailable
  suggestions the domain page already had to the hosting order form's
  Register check (`49e9ebd`, `56bb143`).
- Confirmed HostAfrica's live nameservers (`dan1`/`dan2.host-ww.net`) and
  set them as FOSSBilling's default domain-registration nameservers —
  the last missing piece for a hosting+domain order to actually go live
  without manual DNS work.
- Ran the DirectAdmin automation plan's real end-to-end test (live order
  → account created → SSO "Login to Control Panel" confirmed working →
  cancelled to clean up) — confirms the `type=hosting` automation
  switched to earlier is fully working in production, not just in theory.
- Added the EPP/authorization-code field (optional, matching HostAfrica's
  own storefront) to both order forms' Transfer tabs, and made it
  optional on the website's transfer page too (`d0bca7f`, `1bb5cca`).
- Auto-run the domain check on arrival from the website, and moved the
  hosting cross-sell from the domain order form to the cart/checkout step
  so clicking it can no longer lose an in-progress domain entry
  (`fc394d3`).
- Made cross-sell products admin-configurable (was hardcoded IDs), and
  taught the hosting order form to skip its domain picker entirely when
  arriving from a cross-sell for a domain already in the cart (`68be327`,
  `fa7d269`).
- Replaced the native `window.confirm()`/`window.prompt()` fallback
  FOSSBilling silently uses everywhere (client-side; admin still has this
  gap) with proper Bootstrap-styled modals (`9adc706`) — see
  `CUSTOMIZATIONS.md` for why this was stock behaviour, not a KZD bug.
- See `CUSTOMIZATIONS.md`'s "Checkout UX" and "Styled confirmation
  modals" sections for the full detail on all of the above.

## Mobile UI fixes (2026-09-11)

- Investigated and fixed the mobile layout of the domain/hosting order
  forms' Register/Transfer/Own domain/Subdomain picker — a permanent
  desktop sidebar layout with inline pixel widths on the TLD select, never
  built responsively, clipping/overflowing below ~500px. Root cause: the
  sidebar's `nav-pills` component is horizontal by default in Bootstrap —
  an unconditional `flex-column` was the only thing forcing it vertical at
  every width.
- Extended the same pass to every other unresponsive pattern found in a
  follow-up audit of the client area and admin panel: missing
  `.table-responsive` wraps (cart/checkout table, both invoice tables —
  the latter confirmed broken live on production via a client screenshot
  showing the invoice's "Total" column cut off at 360px), unwrapped flex
  rows on the invoice payment-gateway picker and header, support ticket
  page/message headers, the domain "manage" page's stat row, and two
  admin-only issues (client detail page's avatar header, dashboard
  graph's fixed-width date picker).
- See `CUSTOMIZATIONS.md`'s "Mobile UI fixes" entry for the full file
  list, the `.input-group > .form-select` specificity gotcha hit partway
  through, and which files got a proper `html_custom`/override copy vs. a
  surgical direct edit (and why, per file size).

## Admin hosting order-manage page crashing on a missing service record (2026-10-01)

Reported live: `/admin/order/manage/10` fataled with "Impossible to access
an attribute (\"server\") on a null variable ... at line 3". Same shape as
the earlier `group_master` admin order-manage bug (see above) — the
hosting order's linked `service_hosting` row was missing, so
`admin.order_service()` returned `null`, and
`mod_servicehosting_manage.html.twig` dereferenced it unguarded. Wrapped
the template in a null-service check instead (`8db58b5`) — see
`CUSTOMIZATIONS.md`'s "Hosting DirectAdmin automation" section for detail.
Also added `/_design-capture/` (local Penpot screenshot tooling, has live
credentials in its own `.env`) to `.gitignore` — it was never meant to be
tracked or deployed.

## Invoice, client-portal, payment, and deploy-infra fixes (2026-08-31, 2026-10-15 to 2026-10-17)

A run of live-reported bugs, most of the same underlying shape: stock or
custom template/code assuming a value (an array key, an object, a Twig
global) is always present, which `strict_variables: true` turns into a
hard crash instead of a blank field the moment that assumption breaks.
Full detail for each in `CUSTOMIZATIONS.md`'s "Invoice PDF fixes" and
"Client-portal crash fixes" sections, plus `PAYSTACK.md` and
`DEPLOYMENT.md` for the two that extend those specifically.

- **Invoice PDF**: crashed outright once the company address was changed
  to a real 2-line address (a 3rd, unfilled address line isn't just
  empty by the time the template sees it — the key is gone entirely);
  separately, the logo rendered with no company name anywhere near it
  (same either/or bug already fixed in emails), and fixing that then
  overlapped the two because of a Dompdf `position: relative` quirk in
  the logo's own CSS rule (`f72effa`, `52b728d`).
- **Admin previewing a client's invoice link** crashed on a null `client`
  Twig global — that page is deliberately guest-accessible via hash, so
  `client` is null for an admin or an actual guest opening it directly,
  and the one-click-payment block didn't guard for that (`6a5fca0`).
- **DirectAdmin `unsuspendAccount()`** threw instead of succeeding
  whenever FOSSBilling's local "Suspended" status had drifted out of
  sync with an account that was already active on the server — blocking
  the only way to clear that stale status (`c3e028c`).
- **Client custom fields** missing `active`/`required` keys crashed the
  client profile page and (in the stock fallback template) the signup
  page — a gap an earlier fix (`c49e408`) patched everywhere except these
  two spots (`297532d`).
- **Password reset was actually broken**, not just erroring cosmetically:
  a circular self-reference in the shared public-page layout's
  `meta_description` fallback crashed any page that didn't override that
  block, which included the "set new password" page a client lands on
  from the reset email — and that crash had been masking a second,
  independent bug underneath it (the `hash` needed to submit the form was
  never actually passed to the template). A client had already been
  manually reset by an admin as a workaround before both were found and
  fixed at the root — the layout fix covers any current or future page
  using it, not just the one reported (`297532d`, `f0a7c49`).
- **Paystack one-click payment** hard-failed with "Class
  'Payment_Adapter_Paystack' not found" — the adapter file was never
  added to Composer's generated classmap after being committed (no
  tracked `composer.json` to re-run `dump-autoload` against), and the
  one-click code referenced the class directly with no fallback, unlike
  regular checkout. Fixed by hand-adding the classmap entry plus a
  `require_once` fallback; a related audit also found a declined/failed
  one-click charge was failing silently (the error was recorded but never
  shown to the client) and fixed that too. Verified for real afterward —
  not just read — by driving the actual code through FOSSBilling's API
  dispatcher against local dev (`f0a7c49`, `3e59ff8`).
- **GeoIP databases were never meant to be tracked** — two binary files
  the app re-downloads from GitHub on a schedule had been committed at
  baseline, showing as permanently "modified" every time the cron
  refreshed them. Untracked via `.gitignore` + `git rm --cached`; this
  surfaced a new, more general deploy gotcha (untracking a file the
  running app writes to breaks the next `git pull` with a merge conflict,
  not GeoIP-specific) now documented in `DEPLOYMENT.md` (`dd944b7`).

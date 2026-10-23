# Customizations

Master index of every deviation from stock FOSSBilling v0.8.5, why it exists,
which files it touches, and whether it's an override/extension or a direct
core edit. For deep detail on Paystack/HostAfrica/OpenProvider specifically,
see their dedicated docs — this file is the map, not the territory.

Legend: **[override]** = lives in `html_custom/` or is a new file, doesn't
touch stock code. **[core edit]** = a stock file was directly modified.

## Payments

- **Paystack payment gateway** — `library/Payment/Adapter/Paystack.php`
  **[core edit — new adapter file]**. Doesn't exist in stock FOSSBilling;
  written for this project. See `PAYSTACK.md`.
- **One-click payment (saved cards)** — same file, plus
  `modules/Invoice/Api/Client.php` **[core edit]** and a `client_saved_card`
  table that isn't part of FOSSBilling's schema (self-creates on first use,
  see `PAYSTACK.md`).
- **Paystack auto-redirect fix** — removed a dead config gate that made the
  "click to continue to Paystack" button mandatory instead of automatic, then
  fixed a jQuery dependency this theme doesn't have. See `PAYSTACK.md` for
  the full story — this one had two separate bugs stacked on each other.
- **Paystack "Class not found" on one-click payment** (2026-10-17) — the
  adapter file existed and was committed, but was never added to
  `vendor/composer/autoload_static.php`/`autoload_classmap.php`'s baked
  classmap (no `composer.json` is tracked in this repo, so `composer
  dump-autoload` couldn't just be re-run — added the entry by hand
  instead), and the one-click code referenced the class directly with no
  fallback, unlike the regular checkout path. Also fixed a related gap
  where a declined/failed one-click charge silently showed no error at
  all. Full detail in `PAYSTACK.md`'s "Known gaps" and "One-click payment"
  sections (`f0a7c49`, `3e59ff8`).

## Domain registrars

- **HostAfrica adapter** — `library/Registrar/Adapter/Hostafrica.php`
  **[core edit — new adapter file]**. See `HOSTAFRICA.md`, including its
  **local-dev-only test-mode stub** — fabricates availability results
  when `test_mode=1` since the real API can't be reached from local dev.
  Must be removed/verified inert before this file goes anywhere near
  production.
- **OpenProvider adapter** — `library/Registrar/Adapter/OpenProvider.php` +
  `OpenProvider/API.php` **[core edit — new adapter files]**. See
  `OPENPROVIDER.md`.

## Branding

- **Client theme** (`themes/kzd/`) — cloned from stock `huraga`, then
  rebranded throughout: dashboard, guest landing page, auth pages
  (login/signup/password-reset via `html_custom` overrides), navigation,
  invoice/support pages, footer ("Powered by FOSSBilling" credit removed).
  Colors/typography centralized in `themes/kzd/assets/build/css/kzd-overrides.css`
  (loaded after the compiled theme CSS, overrides via CSS custom properties
  — doesn't touch the compiled build itself).
- **Auth pages (login/signup/password-reset) simplified to a single
  centered column** — these three pages used to share a two-pane split
  layout (`partial_auth_panel.html.twig`): a dark left panel promoting the
  AI Website Builder (animated mesh background, floating video demo,
  feature checklist, "Describe your business" copy) next to the actual
  form. Removed entirely per direct request — nothing in that panel was
  helping someone sign in, and a returning customer doesn't need the
  builder re-sold to them at the one moment they just want to get in.
  `partial_auth_panel.html.twig` **[deleted, was override]** — zero
  remaining references. `.kzd-auth-wrapper` **[core edit in
  kzd-overrides.css]** rebuilt from a two-pane flex split into a centered
  single column (subtle dot-grid + soft radial background, unchanged
  card/back-link/footer components recentered). The mobile-only company
  logo (`d-lg-none`, since desktop used to show the logo in the now-gone
  panel instead) is now shown on all breakpoints — the one functional
  fix required by the removal, not just a style change.
- **Admin theme** (`themes/admin_default/`) — mostly stock. Two
  customizations: the admin login card shows the KZD logo + name
  (`html_custom/partial_admin_auth_card.html.twig`), and the dashboard
  topbar does too (`html_custom/partial_company_logo.html.twig` **[override]**
  adding a `show_name` option, wired up via one line in
  `html/layout_default.html.twig` **[core edit, documented inline]**). Brand
  color applied via `themes/admin_default/assets/build/css/kzd-admin-overrides.css`
  — see the note in `BRANDING.md` about this file's `.gitignore` situation,
  it's a trap for the unwary.
- **Email templates** — 19 of ~42 templates rebranded to a shared visual
  system (logo header, styled card, branded CTA button, footer signature).
  See `themes/kzd/email-templates/README.md` for exactly which ones and why
  the rest were deliberately left alone (dead product types, internal-only
  staff notifications).

## Ordering / checkout flow

**Bug fix: invisible white-on-white text in the domain search field
(and other bespoke form controls in this flow), reported live.**
`.kzd-domain-search-input` (and `.kzd-domain-search-tld`,
`.kzd-domain-years select`, `.kzd-domain-epp-input`, `.kzd-promo-form
input`) never set their own `color` — unlike Bootstrap's real
`.form-control`, which explicitly declares `color: var(--bs-body-color)`
on itself. Native `<input>`/`<select>` elements get their own UA-stylesheet
default text color independent of normal CSS inheritance from ancestors;
without an explicit author `color`, browsers apply their own dark-mode
form-control rendering (white text) based on the OS/browser preference —
completely bypassing this site's own `data-bs-theme` toggle system, since
that only redefines CSS custom properties, not the browser's native
UA-level default for unstyled form controls. Plain text elements
(`.kzd-cart-item-title` etc.) don't have this problem — only real
`<input>`/`<select>` elements do. Fixed by adding an explicit
`color: var(--bs-body-color)` (and, where missing, `background: #fff`) to
every bespoke form-control class in this flow. Separately,
`mod_order_index.html.twig` / `mod_order_product.html.twig`'s
`.kzd-order-page-card` **[both overrides, edited]** now also carries
`data-bs-theme="light"` — this whole redesigned flow was built with
hardcoded light-only colors and never given real dark-mode contrast
pairs, so it's pinned to light mode regardless of the site-wide toggle
(matches what was already done for the auth pages, see "Branding" above).

**Superseded** — this whole section originally described a 5-chip step
indicator (Product → Configure → Account → Cart → Payment) across the
stock Bootstrap accordion. That flow was replaced outright with a flattened
2-step design (Domain → Checkout), modelled on HostAfrica's own
search-results-cart-payment pattern. The old auto-check/cross-sell/
linked-domain mechanics described below (still real, still in the code)
now sit inside the new layout rather than the old one.

- **Flattened to 2 steps: Domain → Checkout.** `themes/kzd/html_custom/
  mod_orderbutton_content.html.twig` **[override]**. `#orderSteps` now
  renders exactly 2 chips (`order`, `checkout`) instead of 5; "Choose
  Product" and "Payment" (the gateway-redirect scaffold `#payment-html`)
  never get their own chip and fold into whichever chip they visually
  belong to via a `foldInto` map in the inline script. `Choose Product`
  itself is skipped in the DOM entirely (`{% if not request.product %}`)
  whenever a product arrives pre-selected — the normal path, since the
  homepage domain search always hands off with `?product=`.
  `mod_orderbutton_choose_product.html.twig` is untouched — still there as
  a fallback for the rare case of landing on bare `/order`.
- **Signing in is a gate at Checkout, not a numbered step.** Previously
  "Login or Register" was its own accordion item with equal visual weight
  to Domain/Checkout. It's still a separate accordion item
  (`html_custom/mod_orderbutton_client.html.twig` **[override, was
  stock]** — restyled with a lock icon instead of a step number, and the
  Sign In / Create Account switch moved from a buried text link under each
  form into a real top segmented tab bar, `id="in-tab"`/`id="up-tab"` kept
  exactly as stock so Bootstrap's Tab JS binds the same way) but it's not
  in `#orderSteps` at all — `register` folds into the `checkout` chip. It
  already auto-opens when a guest reaches checkout
  (`{% if request.checkout and not client %} show{% endif %}`, unchanged
  from stock), so functionally this was already "prompt right before
  paying" — the step indicator was the only thing making it *look* like a
  separate planned-ahead step.
- **Domain search redesigned as a live search bar + results panel**,
  matching HostAfrica's reference UI. `html_custom/
  mod_servicedomain_order_form.html.twig` **[override]** — every
  functional id/name/the entire embedded check/pricing/transfer JS from
  the previous version is unchanged (see the "Checkout UX: auto-check..."
  section below, still accurate for the *behaviour*, just not the
  markup/classes it's attached to); only the surrounding markup/classes
  were rebuilt (segmented Register/Transfer tabs, icon+input+TLD-select
  search row, an "Available"/error+suggestions results card). The
  TLD-unavailable error box now also doubles as the generic "couldn't
  reach the registrar" error display (see `HOSTAFRICA.md`'s IP-whitelist
  note) — both paths render the same suggestion-chip UI, so a registrar
  failure and a genuinely-taken domain look the same to the customer,
  which is a deliberate simplification, not a bug.
- **Checkout redesigned as one 2-column cart+payment screen**
  (`html_custom/mod_orderbutton_checkout.html.twig` **[override]**,
  already existed as an override for the cross-sell work below — this
  session's change was to its markup/layout, not the add/remove-item,
  promo, or cross-sell logic, which are untouched). Cart items, cross-sell
  block, and promo code sit in a left column; a sticky order summary +
  payment method picker + Pay Now button sit in a right column. All
  functional attributes kept identical to stock/previous
  (`#checkoutButton`, `#loginMessage`, `name="gateway_id"`,
  `cart/apply_promo`, `cart/remove_promo`, `cart/remove_item`,
  `cart/checkout`).
- **"Start Over" removed.** The old escape-hatch button (`cart/reset` via
  a styled confirm modal, see "Styled confirmation modals" below) was
  removed from `mod_orderbutton_content.html.twig` entirely, per explicit
  request — one less thing on the page. `cart/reset` itself is untouched
  and still reachable via the API if a "clear cart" affordance is ever
  wanted again.
- **`mod_order_index.html.twig` / `mod_order_product.html.twig`**
  **[override, new files]** — the two stock Order-module templates that
  wrap `mod_orderbutton_content.html.twig` in a page chrome
  (`/order` and `/order/:id`/`/order/:slug` respectively) both had a full
  gray "Products" card-header banner sitting above the redesigned flow,
  reading as a redundant extra step. Both now render a slim "Order" title
  strip instead (`kzd-order-page-card`/`kzd-order-page-header` classes in
  `kzd-overrides.css`) — cosmetic only, no route/controller changes.
- **Payment gateway trimmed to one option.** DB-only change, not code:
  `pay_gateway.enabled` set to `0` for "Custom" (manual/offline), leaving
  Paystack as the only active gateway shown at checkout — matches the
  "only one payment gateway" requirement. Reversible any time via
  Admin → Payment Gateways; not represented in any migration/seed script,
  so it won't survive a database reset.
- **⚠️ Local-dev-only registrar stub** — see `HOSTAFRICA.md`'s new
  "Local dev test-mode stub" section. Domain search cannot be exercised
  against the real HostAfrica API from local dev (IP whitelist), so
  `isDomainAvailable()` fabricates a result when `test_mode=1`. Must not
  ship to production as-is.
- **Mid-order login/register redirect fix** — guest header nav Login link
  and the session-expiry JS redirect now carry `?redirect_uri=` so a
  customer who logs in mid-checkout lands back where they were instead of
  the homepage. Touches `themes/kzd/html/layout_default.html.twig`
  **[core edit]** and `html_custom/mod_page_login.html.twig` /
  `mod_page_signup.html.twig` **[override]**. Unaffected by the redesign
  above.

## Domain Protection & Privacy add-on

- **Optional R99/year WHOIS privacy add-on** at domain checkout, unchecked
  by default, mirroring HostAfrica's own storefront upsell. Built almost
  entirely on stock FOSSBilling mechanisms already present (generic
  Product Addon system, `service_domain.privacy` column, the client/admin
  "Privacy" tab/buttons, HostAfrica's `enablePrivacyProtection()`/
  `disablePrivacyProtection()`) -- see `themes/kzd/data-seeds/README.md`
  for the full breakdown of what already existed vs. what was added.
- **`library/Registrar/Adapter/Hostafrica.php`** **[core edit]**:
  `_buildAddons()` now takes an optional `Registrar_Domain` -- register/
  transfer always pass `idprotection=0` (enabling a paid HostAfrica
  add-on at order-creation time risks HostAfrica auto-billing it through
  their own system, separate from FOSSBilling's billing -- same reasoning
  already applied to `emailforwarding`); renewal passes the domain's
  actual stored privacy state.
- **`modules/Servicedomain/Service.php`** **[core edit]**: `_getD()` now
  sets `Registrar_Domain::setPrivacyEnabled()` from
  `protection_purchased` (previously never set at all, so the registrar
  adapter's own privacy-aware code was silently inert); `action_create()`
  links a same-cart-checkout protection add-on order to the domain via
  `group_id` + product-id matching; `action_activate()` calls registrar
  privacy activation as an explicit post-registration step, only if
  purchased, with failures logged and never blocking domain registration
  itself; `enablePrivacyProtection()`/`disablePrivacyProtection()` now
  check the adapter's actual result instead of assuming success
  unconditionally (a real correctness fix -- previously a registrar-side
  failure was still recorded as "Enabled").
- **`themes/kzd/html_custom/mod_orderbutton_addons.html.twig`**
  **[override]**: restyles the stock generic add-on picker (used for the
  R99/year checkbox above) from a heading-sized title + green-check/red-X
  radio pair into a single checkbox with the price shown inline, matching
  HostAfrica's own checkout UX and the compact label sizing already used
  elsewhere on the domain order form. Field names/values submitted are
  unchanged from stock (a hidden `0` input per add-on guarantees an
  explicit value is always posted even when unchecked) -- purely visual,
  server-side validation is untouched.
- **Client/admin domain manage templates** **[core edit]**: added a
  Domain Protection & Privacy status block (purchased / registrar status)
  to the client Privacy tab and three new rows to the admin service
  details table; the existing manual Enable/Disable Privacy buttons are
  unchanged for admins, gated behind `protection_purchased` for clients
  (you shouldn't be able to "enable" a service you never bought).
- **Schema**: `service_domain` gained `protection_purchased`,
  `protection_order_id`, `protection_registrar_status` -- see the
  migration SQL and full detail in `themes/kzd/data-seeds/README.md`.
- **Not done in this pass**: associating Business Email with a domain
  (spec Parts 9-12 of the original request) is a separate feature,
  planned as a follow-up once this one is verified live.

## Domain registrant contact defaults to KZD's own address

- **`modules/Servicedomain/Service.php::_getD()`** **[core edit]** — the
  registrant/tech/billing/admin contact sent to HostAfrica for domain
  register/transfer now defaults to KZD's own registered business address
  rather than the client's profile. Priority order: an explicit per-order
  contact override (`service_domain.contact_*`, set directly on that one
  domain's record, not the client's) wins if staff ever set one; otherwise
  KZD's company address (`_getCompanyContactDefaults()`, new private
  method); the client's own profile address is consulted only as a
  last-resort fallback below that.
- **Why**: domains are deliberately registered under KZD's own reseller
  account (nameservers repointed to the reseller, DirectAdmin account
  created and connected — KZD retains operational control throughout the
  hosting relationship, not the client), so the registrant contact should
  be consistent regardless of whether a given client happened to fill in
  their own address. Client signup never required a postal address in the
  first place (`Client\Api\Guest::create()`'s `RequiredParams` is just
  email/name/password), so relying on the client's profile meant domain
  registration could fail outright — HostAfrica's EPP contact-create call
  rejects blank `city`/`address`/`country`/`phone` — silently, after the
  client had already paid, discovered only when staff happened to check.
  See `CHANGELOG.md`'s "Existing-client onboarding incident" entry for the
  two live signups (`sktradingstore.co.za`, `stylesbycebs.co.za`) this was
  found and fixed for.
- **Schema**: five new rows in the existing `setting` table (no new
  columns) — `company_city`, `company_state`, `company_postcode`,
  `company_country`, `company_phone_cc` — alongside the pre-existing
  `company_address_1` and `company_tel`. Not exposed in the admin System
  Settings UI (Admin → System Settings → Company only has a form for the
  original fields); set directly via SQL for now. Edit these rows in the
  `setting` table if the business address ever changes.
- **Not done in this pass**: no admin UI to edit the five new
  `company_*` settings (direct SQL only); no enforcement of a client-facing
  "required address" flow at signup or checkout — client profile fields
  remain optional, and now this doesn't matter for domain registration
  either way since it isn't relied on.

## Hosting/Business Email ↔ domain association + domain→hosting cross-sell

- **Goal**: non-technical customers buying a domain alone often don't
  realise they still need hosting (or email) to put anything on it.
  Buying Shared Hosting now optionally offers Register/Transfer/Own-domain
  at checkout (skippable); buying Business Email requires it (email needs
  a domain to attach to); buying a domain shows a plain-language warning
  plus hosting suggestions.
- **Reused, not rebuilt**: stock FOSSBilling already has this whole
  domain-bundling mechanism for `type=hosting` products
  (`modules/Servicehosting/Service.php`'s `attachOrderConfig()`/
  `validateOrderData()`/`getDomainProductFromConfig()`, called generically
  by `modules/Cart/Service.php::addItem()` based on whatever service class
  the product's `type` resolves to). KZD's hosting (ids 2-5) and Business
  Email (ids 6-7) products are `type=custom`, so the same three methods
  were added to **`modules/Servicecustom/Service.php`** **[core edit]**
  instead — same field names/AJAX endpoints as the hosting version, so
  `Cart\Service`'s duplicate-domain detection keeps working unchanged —
  but with a `domain_association` config knob (`off`/`optional`/
  `required`) stock hosting doesn't have, since stock hosting's domain
  requirement is hard-coded mandatory. `action_create()` also now records
  `associated_domain`/`associated_domain_order_id` into the service's
  existing `config` JSON blob (no schema change) when a domain was
  chosen; both keys surface automatically in the admin order-management
  screen (`modules/Servicecustom/templates/admin/mod_servicecustom_manage.html.twig`
  already loops over every `toApiArray()` key generically).
- **`modules/Servicecustom/templates/client/mod_servicecustom_order_form.html.twig`**
  **[core edit — new template file]** — didn't exist before (no stock
  template to override). Lives in the module's own template directory,
  not `themes/kzd/html_custom/`, because FOSSBilling's
  `system_template_exists()` check (gates whether this file is even
  included) only searches `theme/html` + each module's own
  `templates/client` directory — it doesn't know about `html_custom` at
  all, which is a separate, Twig-loader-only override mechanism for
  templates that already resolve via that first check. A brand-new
  template with no stock counterpart is invisible to it unless it's a
  real module template — same reasoning as
  `library/Registrar/Adapter/Hostafrica.php` being a new file rather than
  an override of something nonexistent. Adapted from
  `mod_servicehosting_order_form.html.twig` (same tabs/JS/AJAX calls,
  minus the subdomain tab, plus an "I'll set this up later" skip option
  shown only when `domain_association` is `optional`).
- **`modules/Product/Service.php::getPublicConfig()`** **[core edit]** —
  this existing hardcoded whitelist controls which `product.config` keys
  guests are allowed to see (security boundary, e.g. keeps hosting's
  `server_id` private); it only knew about `Servicehosting`'s own keys,
  so the new `domain_association` key was invisible to the checkout
  template until added here. Found by testing locally — the checkbox/tabs
  silently didn't render even though the seed script correctly wrote the
  config, because the guest-facing product API response was filtering it
  out.
- **`themes/kzd/data-seeds/configure_domain_association.php`**
  **[new]** — sets `product.config.domain_association` to `optional` for
  the 4 hosting products, `required` for the 2 Business Email products.
- **Cross-sell block later moved off this template entirely** — see
  "Checkout UX: auto-check, cross-sell placement, admin-configurable
  products" below for where it lives now and why.
- **Not done in this pass** (see the plan for the full list): switching
  hosting products to `type=hosting` for real DirectAdmin account
  automation (DirectAdmin connectivity was confirmed working, but this is
  a deliberately separate, bigger follow-up); an actual DirectAdmin
  mailbox-creation API (`CMD_API_POP`) for Business Email -- domain
  association is now captured, but a real mailbox still has to be created
  manually; a client-facing "your associated domain" display (admin gets
  it for free, there's no client template for `type=custom` services to
  add it to yet); a dropdown of the client's own already-purchased
  FOSSBilling domains for "own domain" (free-text only, matching stock
  hosting's own behaviour).

## Hosting DirectAdmin automation (type=hosting)

- **Follow-up to the section above**: the 4 hosting products
  (Starter/Basic/Standard/Business, ids 2-5) switched from `type=custom`
  to `type=hosting`, trading the optional-domain/skippable flow built
  above for full stock automation — real DirectAdmin account creation on
  order activation, suspend/unsuspend/cancel wired to the account,
  and a "Login to Control Panel" single sign-on button in the client area
  (`modules/Servicehosting/templates/client/mod_servicehosting_manage.html.twig`
  — stock, no template work needed). Domain is mandatory at hosting
  checkout again as a result — `Servicehosting::validateOrderData()` has
  no skip path. Deliberate trade-off, confirmed with the client.
- **This turned out to require zero code changes** — `Servicehosting`'s
  full lifecycle (`action_create`/`action_activate`/`action_suspend`/
  `action_unsuspend`/`action_cancel`/`action_uncancel`) is complete, stock
  FOSSBilling, already wired to real
  `library/Server/Manager/Directadmin.php` adapter calls. `action_renew()`
  is a stock no-op — renewal doesn't touch DirectAdmin, which is correct
  (nothing about the account needs to change on a billing renewal).
- **`themes/kzd/data-seeds/configure_hosting_plans.php`** **[new]** —
  creates one `service_hosting_hp` (Hosting Plan) row per product with
  resource limits matching what's advertised on `hosting.html`, and flips
  `product.type` to `hosting` + sets `product.config` to
  `{"server_id": 1, "hosting_plan_id": <id>}` (server id 1 = "HostAfrica
  Reseller", already configured and connection-tested working). Note:
  the DirectAdmin server (`library/Server/Manager/Directadmin.php`,
  hosting accounts) is a completely separate integration from the
  similarly-named domain registrar adapter
  (`library/Registrar/Adapter/Hostafrica.php`, domains) — same reseller,
  two unrelated APIs, don't confuse them.
- **No DirectAdmin package needs to pre-exist on the server.**
  `Directadmin.php::createAccount()` tries to match the Hosting Plan's
  name against real DirectAdmin packages; if there's no match (there
  won't be, we never created any), it automatically falls back to custom
  resource fields computed straight from the `service_hosting_hp` row.
  No coordination with HostAfrica's DirectAdmin panel was needed.
- Business Email (ids 6-7) is untouched, still `type=custom` with the
  domain-association flow from the section above.
- **`themes/kzd/html_custom/mod_servicehosting_order_form.html.twig`**
  **[override, bug fix]** — stock wraps the whole product info block
  (`{{ product_details }}` — title, description bullet list, pricing,
  quantity) in `<h5 class="mb-1">...</h5>`, which makes every nested
  element inherit bold heading styling (noticed once hosting checkout
  started actually being used, after the `type=hosting` switch above).
  Rendered unwrapped instead, matching how the same block renders for
  every other product type. The same copy-paste bug was in our own
  `modules/Servicecustom/templates/client/mod_servicecustom_order_form.html.twig`
  (adapted from the stock hosting template) — fixed there too.
- **Only affects new orders** — `client_order.service_type` is frozen at
  order-creation time, so pre-existing hosting orders (sold while
  `type=custom`) keep working under `Servicecustom` exactly as before.
- **Not done yet**: hosting plan upgrade/downgrade between tiers (stock
  supports it, not specifically tested); general UI/UX polish,
  deliberately deferred to a later session.
- **`modules/Servicehosting/templates/admin/mod_servicehosting_manage.html.twig`**
  **[core edit, surgical]** — reported live as a fatal error on
  `/admin/order/manage/<id>` for a `type=hosting` order: `Impossible to
  access an attribute ("server") on a null variable ... at line 3`
  (`{% set server = service.server %}`). `Order\Service::getOrderServiceData()`
  returns `null` whenever the order's linked `service_hosting` row is
  missing (account never provisioned, or the row was otherwise removed)
  — stock behaviour, same null-service shape as the `group_master`
  admin order-manage bug further up this file. The stock template never
  guarded against that, so this install's `strict_variables: true` Twig
  config turned it into a hard crash instead of a blank field. Wrapped
  the whole template body in `{% if not service %}` (shows a status
  badge + a plain warning that the account couldn't be found) `{% else
  %}` (original markup, unchanged) `{% endif %}`. Doesn't explain *why*
  order #10's service row is missing in the first place — that's a data
  question for whoever provisioned it, not a code bug — this only stops
  the page from fatally erroring when it happens (`8db58b5`).

- **Follow-up to the section above, using the same mechanism as the
  hosting automation section**: the 2 Business Email products (Business
  Email / Premium Business Email, ids 6-7) switched from `type=custom`
  to `type=hosting` too.
- **Why this needed no new mailbox-creation code**: DirectAdmin has no
  "mailbox-only" account type — a mailbox always lives inside a
  DirectAdmin User account tied to a domain. Rather than building a
  `CMD_API_POP` adapter method plus a mailbox-naming step at checkout,
  this reuses the exact same Hosting Plan mechanism as regular hosting:
  two new minimal `service_hosting_hp` rows (small quota, hosting
  features like PHP/CGI turned off since these accounts don't host a
  website, `max_pop` set to the advertised mailbox counts — 25 / 100).
  The client creates their own named mailboxes (`info@`, `sales@`, etc.)
  through DirectAdmin's own built-in "Email Accounts" screen, reached via
  the same stock "Login to Control Panel" SSO button
  (`modules/Servicehosting/templates/client/mod_servicehosting_manage.html.twig`)
  that ships automatically once `type=hosting` is set.
- **`themes/kzd/data-seeds/configure_email_hosting_plans.php`** **[new]**
  — same shape as `configure_hosting_plans.php`. Quota (mail storage) is
  a reasonable default, not a specific advertised number (the site copy
  only says "Larger Mail Storage" for Premium, no GB figure) — worth
  revisiting if that ever gets a specific advertised size.
- **Deliberately not built this pass** (client's choice, given the
  option): real per-mailbox automation (`CMD_API_POP`) so a mailbox like
  `info@domain.com` gets created automatically with zero client action.
  Would be a genuine follow-up if clients struggle with DirectAdmin's own
  email-account screen — logged here so it isn't forgotten, not because
  it's currently planned.
- **`unsuspendAccount()` erroring when the DirectAdmin account is already
  active** (2026-10-15) — `library/Server/Manager/Directadmin.php`
  **[core edit]**. Stock bug, not KZD-specific: `suspendAccount()` already
  treats "already in the target state" as a success no-op (`return true`
  if the account's already suspended), but `unsuspendAccount()` didn't —
  it threw `"Account is not suspended"` instead, which blocked
  `Servicehosting::action_unsuspend()` from ever syncing FOSSBilling's
  local order status back to Active whenever the two had drifted apart
  (e.g. the overdue-invoice cron auto-suspended the order locally, but
  the DirectAdmin account was already active — found live on order #1,
  `stylesbycebs.co.za`). Made `unsuspendAccount()` return `true` in that
  case too, mirroring `suspendAccount()`'s existing pattern (`c3e028c`).

## Checkout copy + own-domain safeguard

- **"Why do I need a domain?" explanation** added to the hosting/email
  order form (`themes/kzd/html_custom/mod_servicehosting_order_form.html.twig`
  — the `Servicecustom` version already had equivalent copy from when it
  was first built) — a customer landing on "Domain Configuration" with no
  context wasn't obvious *why* it's required.
- **Cross-sell copy** ("A domain is just an address...") — see "Checkout
  UX" below; the block itself has since moved off this template to the
  checkout step, copy carried over unchanged.
- **EPP/authorization code field** added to both the domain order form's
  and hosting order form's Transfer tabs, with identical explainer copy
  ("Most domains have a secret authorization code (EPP code)...").
  Neither tab asked for it at all before — the hosting form's Transfer
  tab had no field for it whatsoever (silently sent `transfer_code: null`
  to HostAfrica), and the domain order form had the input but no
  explanation of what it was or that it's optional. Kept explicitly
  optional on both, matching HostAfrica's own storefront (confirmed via a
  live test transfer on hostafrica.co.za — their checkout doesn't ask for
  it either) and FOSSBilling's own validator, which never required it.
- **Own-domain ownership checkbox**: "Own domain" (bring-your-own,
  register/transfer don't need this — register is for unclaimed domains,
  transfer already requires a real EPP/auth code) previously accepted any
  typed domain name with zero verification. Added a required checkbox
  ("I own this domain, or I am authorised to manage it") to both the
  hosting and `Servicecustom` order forms, client-side only (HTML5
  `required`, standard practice for this — real ownership verification
  isn't standard for this flow, and isn't a security hole regardless:
  nothing resolves to us unless the customer actually controls the
  domain's real DNS, so the risk is accidental typos, not hijacking).
  Submitted as `domain[owndomain_authorized]`, lands in the order's
  config for the record, no server-side enforcement added.
- **`themes/kzd/html_custom/mod_servicehosting_manage.html.twig`**
  **[override]** — surfaces that customers can log in to DirectAdmin
  directly (not just via the SSO button) once they set their own
  password on the Password tab, with the actual control panel URL shown
  (`server.cpanel_url`, already computed by stock
  `Servicehosting\Service::getManagerUrls()` — not hardcoded). Worth
  knowing why this needed spelling out at all: FOSSBilling never
  shows or emails the auto-generated account password (stock behaviour
  — `Servicehosting\Service::action_activate()` overwrites it with a
  placeholder immediately after `createAccount()` for security), so
  direct login without going through FOSSBilling first genuinely wasn't
  discoverable before this.

## Checkout UX: auto-check, cross-sell placement, admin-configurable products

- **Auto-run the availability/transferability check on arrival** — the
  marketing website's domain search and transfer form already handed off
  to this order form pre-filled via `?tld=`/`?name=`/`?action=`/`?epp=`
  query params (existing behaviour), but the customer still had to click
  "Check" a second time for the exact domain they'd already searched.
  `themes/kzd/html_custom/mod_servicedomain_order_form.html.twig`
  **[override]** now auto-clicks the Register or Transfer Check button
  once both a name and TLD are present in the URL. Verified locally:
  fires correctly for both actions (transfer's stubbed
  `can_be_transferred()` check completes fully offline; register's real
  HostAfrica lookup hits the documented IP-whitelist wall the same way
  it always has on local dev — unrelated to this change, see
  `HOSTAFRICA.md`).
- **Cross-sell moved from the domain order form to the cart/checkout
  step.** It used to sit below the Register/Transfer tabs on the domain
  order form; clicking it *before* clicking "Next" navigated away and
  lost whatever the customer had just typed/checked, since nothing is in
  the cart yet at that point — "Next" is what actually adds it. Now lives
  in `themes/kzd/html_custom/mod_orderbutton_checkout.html.twig`
  **[override, new file]** (stock has no cross-sell concept at all),
  shown only when the cart contains a domain (register or transfer) with
  no hosting product yet — the domain is already safely in the cart by
  then, so clicking through can't lose anything.
- **Admin-configurable cross-sell products** — the suggested product IDs
  were originally hardcoded (`[2, 3, 4, 5]`) directly in the template.
  Replaced with a `cross_sell_products` field on the domain product's own
  `config` JSON, editable from Products → Domains registration and
  transfer → **Configuration** tab in admin
  (`modules/Servicedomain/templates/admin/mod_servicedomain_config.html.twig`
  **[core edit]** — same checkbox-list-of-products pattern already used
  for the Addons/Upgrades tabs elsewhere on that page). Whitelisted in
  `modules/Product/Service.php::getPublicConfig()` **[core edit]** since
  the checkout template reads it via the guest API role, same reasoning
  as `domain_association` above. **Gotcha found via a real admin-form
  round-trip test** (not just a direct DB edit): the admin form always
  submits an empty placeholder value alongside real checkbox selections
  (needed so unchecking everything actually clears the saved list) — an
  empty string sneaking into the saved array broke `product_get()` for
  that one entry and silently emptied the *entire* cross-sell box instead
  of just skipping it. The checkout template now filters blank entries
  out of the stored array before use.
- **Redundant domain picker skipped when hosting arrives linked to a cart
  domain.** Clicking a cross-sell link used to land on the hosting order
  form's full Register/Transfer/Own-domain picker, asking the customer to
  re-pick an action and re-confirm ownership for a domain they'd just
  registered/transferred moments earlier in the same order. Checkout's
  cross-sell links now carry `?action=owndomain&owndomain_sld=&owndomain_tld=&linked_domain=1`;
  when `linked_domain=1` is present (and the product allows own-domain),
  `mod_servicehosting_order_form.html.twig` **[override]** skips the
  whole tab UI and shows a one-line confirmation instead ("This hosting
  package will be linked to `example.com`, which is already in your
  cart."), submitting the same fields as hidden inputs. Also taught the
  form's `default_action` logic to honour a plain `?action=` param
  (falling back to its original capability-based priority order when
  absent) so this and the auto-check work above compose correctly. A
  bare `?action=owndomain` link *without* `linked_domain=1` (no cart
  guarantee) still shows the full picker as before.
- **Verified domain transfer + hosting works the same as register +
  hosting** through this whole chain — transferred a domain into the
  cart, used the cross-sell, confirmed the resulting cart has exactly one
  domain-transfer item and one linked hosting item, no duplicate domain
  entry.

## Styled confirmation modals (replacing native browser dialogs)

- **Problem**: FOSSBilling's own `public/assets/js/api.js` already has a
  fully-built styled-modal code path for `fb_api_link({modal: {...}})`
  confirmations and prompts (the `type==="confirm"/"danger"/"prompt"`
  branches) — but it only uses that path if `typeof Modals !==
  "undefined"`, and nothing anywhere in stock FOSSBilling, client or
  admin, ever actually defines that global. It silently falls back to
  the browser's native `window.confirm()`/`window.prompt()` on every
  confirm-type action (e.g. removing a cart item) instead — this is
  stock behaviour, not something the `kzd` theme broke. Confirmed via
  both tracing `api.js` and a live Playwright test capturing the native
  `dialog` event firing.
- **Fix**: `themes/kzd/html/partials/kzd_modals.html.twig` **[new]**
  defines the missing `Modals` global with a `.create(options)` matching
  exactly the interface `api.js` already calls, built on Bootstrap 5's
  own `Modal` component (already loaded for this theme — no new
  dependency). Dynamic strings (title/content/label) are set via
  `textContent`, never `innerHTML`, matching `window.confirm()`'s own
  plain-text behaviour rather than trusting them as markup. Included from
  both `layout_default.html.twig` and `layout_public.html.twig`
  **[both overrides, edited]** — the order/checkout page
  (`mod_orderbutton_index`) extends `layout_public`, not `layout_default`,
  so both needed the include for full client-side coverage.
- **Not done**: the admin panel (`themes/admin_default`, a separate stock
  theme this change doesn't touch) has the exact same gap — its
  prompt-type dialogs (API key regeneration, etc.) still fall back to
  native `window.prompt()`. Left as a known follow-up since it wasn't the
  instance actually observed/reported; same fix (an equivalent partial
  included in `admin_default`'s own layout) would close it.

## Mobile UI fixes (domain configuration + wider audit)

- **Root cause pattern, found in the domain/hosting order forms first**:
  `mod_servicedomain_order_form.html.twig` and
  `mod_servicehosting_order_form.html.twig` **[both html_custom overrides,
  edited]** laid out the Register/Transfer/Own domain/Subdomain picker as
  a permanent sidebar (`nav nav-pills flex-column border-end me-3`) next
  to a search row (`d-flex gap-2` wrapping an `.input-group` with inline
  `style="max-width:...; width:...;"` on the TLD select) — no mobile
  breakpoint anywhere. Below ~500px combined width this clipped the TLD
  select, crowded the Check button, and squeezed the sidebar pills. Never
  built responsively in the first place, not a regression.
- **Fix approach**: `nav-pills` is Bootstrap's normal *horizontal* pill
  component — `flex-column` was the only thing forcing it vertical, so
  making that `flex-md-column`/`flex-md-row` (Bootstrap's own responsive
  utilities, confirmed present in the compiled bundle) mostly solves the
  switcher on its own. Inline `max-width`/`width` styles moved into new
  `.kzd-domain-*` classes in `themes/kzd/assets/build/css/kzd-overrides.css`
  so mobile media queries can actually override them (inline styles beat
  external CSS regardless of source order — `!important` was deliberately
  avoided). One real bug found mid-fix: `.kzd-domain-tld-select` alone
  lost to Bootstrap's own `.input-group > .form-select` rule on
  specificity (a compound selector beats a single class regardless of
  cascade order) — fixed by matching that same `.input-group > .x` shape.
  Desktop field widths were intentionally *not* flattened to one value —
  the hosting form's fields (320px) were already narrower than the
  standalone domain form's (500px) before this fix; preserved via a
  `--compact` modifier class rather than widened to match.
- **Extended via a follow-up audit** (same session, explicitly requested)
  to every other unresponsive pattern found across the client area and
  admin panel:
  - `mod_orderbutton_checkout.html.twig`, `mod_invoice_invoice.html.twig`
    (×2 tables) **[html_custom, edited]** — bare `<table>` elements with no
    `.table-responsive` wrapper, overflowing/clipping columns (confirmed
    live on production via screenshot: the invoice line-items table's
    "Total" column cut off at 360px).
  - `mod_invoice_invoice.html.twig` payment-gateway row — unwrapped
    `d-flex gap-3` of DB-configured, arbitrary-pixel-dimension logo
    buttons; added `flex-wrap` plus a `.kzd-gateway-logo` max-width/
    max-height cap (doesn't fight the existing inline `height`/`width` —
    different properties, no specificity conflict).
  - `mod_invoice_invoice.html.twig` card header, `mod_support_ticket.html.twig`
    (×2 rows) — unwrapped title+buttons / avatar+name+badge+date+button
    rows; added `flex-wrap`/responsive stacking classes.
  - `modules/Servicedomain/templates/client/mod_servicedomain_manage.html.twig`
    **[core edit, surgical]** — the domain "manage" page's Name/Expires/
    Registered stat row (`justify-content-around`, `fs-4` domain name, no
    wrap). Edited directly rather than copied into `html_custom` — this is
    a 300+ line stock file and the actual change is ~14 lines; same
    documented exception already used elsewhere in this file for exactly
    this tradeoff (see the styled-confirmation-modals entry above and the
    `html_custom`-override-mechanism note in `ARCHITECTURE.md`).
  - `themes/admin_default/html/mod_index_dashboard.html.twig`
    **[core edit, surgical]** — same reasoning (500+ line stock file, ~10
    line change): the dashboard income-graph date-range input had an
    inline `style="width: 16rem"` inside an unwrapped flex row; moved to a
    `.kzd-admin-graph-range` class (`max-width` instead of a fixed
    `width`) in `themes/admin_default/assets/build/css/kzd-admin-overrides.css`
    — remember this whole `assets/build/` directory is gitignored except
    this one force-added file (see `BRANDING.md`), so `git add -f` is
    needed for any future edit here too.
  - `themes/admin_default/html_custom/partial_admin_summary_card.html.twig`
    **[new override]** — small enough (31 lines) to properly override
    rather than surgically edit the stock file. Its header row (title/
    subtitle + optional aside) had no wrap; the Client detail page's
    112px avatar in that aside slot was the concrete instance found, but
    this is a shared partial so any future page adding an aside inherits
    the fix too.
- **Verified via a real Twig parser**, not just "the page returned 200" —
  every touched file was parsed with FOSSBilling's actual Twig library
  (custom filters/functions stubbed) to catch structural syntax errors
  that a stateless page load wouldn't necessarily reach (e.g. an error
  deep in a conditional branch). `php -l` does **not** validate `.twig`
  files (they're not PHP) despite superficially looking like it might —
  worth remembering next time a template needs a quick correctness check
  without a full authenticated page load.
- **Not done in this pass**: no visual/screenshot tool was available in
  the environment this work was done in — every fix was verified
  structurally (parses correctly, classes render, no page errors) and
  then confirmed visually by the client afterward via their own browser,
  not by the implementer directly. Worth keeping in mind for any future
  UI work done the same way — structural verification is necessary but
  not sufficient on its own.

## Invoice PDF fixes (2026-08-31)

`modules/Invoice/templates/pdf/default-invoice.twig` /
`default-invoice.css` **[core edit]**:

- **Crash on a company address with only 2 lines filled in** — the admin
  changed the company address from the demo placeholder text to a real
  one, leaving `address_3` blank, and the invoice PDF started fataling
  with `Key "address_3" ... does not exist`. `Invoice\Service::getFooterInfo()`
  strips every empty field out of the array it hands to the template
  (`foreach ($sourceData as $label => $data) { if (empty(trim($data)))
  unset(...); }`), so an unfilled `address_3` isn't just an empty string
  by the time the template sees it — the key doesn't exist at all, which
  is fatal under `strict_variables: true`, not just falsy. Added
  `|default('')` to every `footer.*` field the template reads without one
  (`address_1`/`2`/`3`, `company_name`, `email`, `www`, `signature`) so a
  blank company-setting field can't crash invoice generation again,
  regardless of which fields get left empty in the future.
- **Logo showing with no company name anywhere near it** — same
  either/or-logo-replaces-name bug already fixed across the 19 rebranded
  email templates (see "Branding" above), just never caught here since
  nobody had looked at an invoice with the logo actually configured until
  this incident surfaced it. Added `{{ footer.company_name }}` next to
  the logo in the invoice header.
- **The fix above then overlapped the logo and the name** — a genuine
  Dompdf gotcha, not obvious from the markup alone:
  `img.CompanyLogo { position: relative; left: 40px; top: 7px; }` in
  `default-invoice.css` shifts the logo *visually* right by 40px while
  its original box still occupies the unshifted space in the document
  flow. With no text after it, that's invisible — but the company-name
  text added right after it in source order renders starting from that
  original unshifted spot, and the visually-shifted logo lands on top of
  it. Fixed by moving the `position: relative; left: 40px; top: 7px`
  rule onto a new wrapping `.CompanyHeader` div instead of the image
  itself, so the logo and name lay out normally in flow inside it
  (`52b728d`, following `f72effa`).

## Client-portal crash fixes (strict_variables footguns, 2026-10-15 to 2026-10-17)

A cluster of unrelated crashes, all the same underlying class of bug this
install keeps running into: `strict_variables: true` (see
`PRODUCTION_READINESS.md`) turns a missing array key or a null object
reference into a hard fatal instead of FOSSBilling's stock "render
blank" behaviour, and stock FOSSBilling's own templates — plus this
project's `html_custom` overrides — weren't written defensively enough
for that setting everywhere.

- **Null `client` Twig global on the invoice page** —
  `themes/kzd/html_custom/mod_invoice_invoice.html.twig` **[core edit]**.
  `client` (`library/FOSSBilling/Twig/TwigFactory.php`) is `null` for
  anyone not currently logged in as a client — which includes an admin
  opening a client's invoice link directly, since `/invoice/:hash`
  deliberately uses `api_guest` (`Invoice\Controller\Client::get_invoice()`)
  so both guests and admin-previewing-as-guest can view it via the hash.
  The one-click-payment block called `client.invoice_get_saved_card(...)`
  unconditionally; guarded with `and client` alongside the existing
  unpaid-status check. A follow-up audit (see further down) confirmed
  this was the *only* unguarded `client.`/`admin.` usage anywhere in
  `themes/kzd/**` or the stock `modules/*/templates/client/` trees —
  every other usage was either already guarded or on a route that
  enforces `is_client_logged` first, so `client` can't be null there
  (`6a5fca0`).
- **Client custom fields missing `active`/`required` keys** —
  `modules/Client/templates/client/mod_client_profile.html.twig` and the
  *stock* `modules/Page/templates/client/mod_page_signup.html.twig`
  **[core edit, both]**. Same malformed-data shape as an earlier fix
  (`c49e408`, see further up): a custom field saved with the Active/
  Required checkboxes left unchecked (before that fix added a hidden-0
  fallback to the admin form) saves as `{title: "..."}` with no
  `active`/`required` keys at all — fatal under `strict_variables`, not
  just falsy. That earlier fix patched the admin form and two client
  templates but missed the client profile page, and separately missed
  that the *stock* signup template (behind the already-fixed
  `themes/kzd/html_custom/` override, so not normally rendered — but
  still worth fixing for defense in depth) had the identical gap. Both
  guarded with `|default(false)` (`297532d`).
- **Circular self-reference in `layout_public.html.twig`'s `meta_description`
  fallback** — `themes/kzd/html/layout_public.html.twig` **[core edit]**.
  `{% set meta_description = block('meta_description')|default(...) %}`
  computed the variable by calling `block('meta_description')` — but for
  any page that doesn't override that block, Twig falls through to the
  *parent template's own* definition of it, which was `{{ meta_description
  }}` — i.e. the block, when not overridden, read the very variable being
  assigned from calling it. Any page extending this layout without a
  `meta_description` override hit `Variable "meta_description" does not
  exist` the instant `block()` was evaluated. Found live on
  `mod_client_set_new_password.html.twig` (the page a client lands on
  after clicking the password-reset email link) — blocking an actual
  password reset, not just a cosmetic error.
  `modules/System/templates/client/mod_system_maintenance.html.twig` and
  `modules/Orderbutton/templates/client/mod_orderbutton_index.html.twig`
  extend the same layout without overriding the block either and would
  have hit the identical crash eventually. Fixed at the root instead of
  per-page: the block's fallback body now reads `settings.meta_description`
  directly (no self-reference), and the one other `{{ meta_description }}`
  read (the opengraph block) calls `block('meta_description')` instead of
  the removed variable — safe for any current or future page that doesn't
  bother overriding the block, not just the one that happened to get
  reported (`297532d`).
- **Password-reset `hash` never passed to its own template** —
  `modules/Client/Controller/Client.php` **[core edit]**. Masked by the
  bug directly above: `get_reset_password_confirm()` rendered
  `mod_client_set_new_password` with no second argument at all, so the
  template's `{{ hash }}` (populating a hidden form field the submit
  button depends on) was always undefined — but the `meta_description`
  crash fataled first, during `<head>` rendering, before execution ever
  reached that line in `<body>`, so this second bug stayed invisible
  until the first one was fixed. A client had already been manually
  reset by an admin as a workaround before this was caught. Now passes
  `['hash' => $hash]` through; also removed a client-side JS workaround
  in the template that re-derived the hash from
  `window.location.href.split('/').pop()` — a leftover patch for this
  same gap that was now not just redundant but a latent risk in its own
  right (an email client appending tracking params or a trailing slash
  to the link would have corrupted an otherwise-correct value)
  (`f0a7c49`, `3e59ff8`).
- **Audit coverage**: the password-reset request → email → confirm →
  update flow (`Client\Api\Guest.php`, `Client\Service.php`, rate-limiter
  policies, both email templates' link URLs) was traced end-to-end after
  the fixes above and found otherwise correct — hash format, 15-minute
  expiry, session invalidation on reset, all consistent. The one-click
  payment pipeline (JS → `Invoice\Api\Client` → `ServicePayGateway` →
  `Paystack.php::chargeAuthorization()` → `ServiceTransaction::
  createAndProcess()` → `verifyAndApply()`) was traced the same way and
  verified executing for real (not just read) via FOSSBilling's actual
  API dispatcher (`FOSSBilling\Api\Proxy`/`Dispatcher`) against local
  dev — see `PAYSTACK.md` for what that surfaced (the classmap issue and
  the silent-failure fix).

## Product catalog / pricing

- **4 Shared Hosting products** (Starter/Basic/Standard/Business) — seeded
  via `themes/kzd/data-seeds/create_hosting_products.php`. Storage
  allocations were later revised down (5/10/20/50 GB → 2/4/7/15 GB) to
  avoid overselling the 50 GB HostAfrica reseller account — see that
  script's README entry.
- **2 Business Email products** — seeded via
  `themes/kzd/data-seeds/create_business_email_products.php`, monthly
  billing only.
- **TLD pricing** (15 extensions) — seeded via direct SQL, not a script; see
  git log for the `tld` table statements.
- **Invoice numbering** — `KZD-100001` format. **No code change** — this is
  purely the `invoice_series` / `invoice_series_paid` / `invoice_starting_number`
  system settings (Admin → System Settings → Invoices).

## Homepage prompt bar (`mod_index_dashboard.html.twig`)

- **Example chips now actually fill the search bar.** The hero's "Describe
  your business" prompt bar has 4 example chips below it (Restaurant,
  Consulting, Online store, Fitness coach) — they rendered as plain
  `<span>`s with `cursor: default` and no click handler at all, purely
  decorative. `html_custom/mod_index_dashboard.html.twig` **[override]**:
  converted to real `<button type="button" data-kzd-example-chip="...">`
  elements; a small IIFE in the same file's inline `<script>` fills
  `[data-kzd-prompt-input]` and dispatches a real `input` event (not just
  `.value = ...`) so the existing animated-placeholder IIFE — which
  listens for genuine `input` events to hide itself — reacts exactly as if
  the visitor had typed it themselves.
- **Note**: this file lives at `themes/kzd/html_custom/`, i.e. inside
  *this* repo, not the separate `KZD-Website-Updates` static site
  described in `ARCHITECTURE.md`'s "two-repository split". Worth
  reconciling at some point — either the marketing homepage's source of
  truth has quietly moved to FOSSBilling's own guest Index module and
  `ARCHITECTURE.md` needs updating, or this file is a duplicate of
  something that's supposed to live on the other side. Not resolved as
  part of this session's work; flagging so it doesn't get lost.

## Client dashboard (`mod_index_dashboard.html.twig`, logged-in view)

- **Same template file serves both the guest marketing homepage and the
  logged-in client dashboard.** `{% extends client ? "layout_default..." :
  "layout_public..." %}` at the top, then `{% block body %}{% if client
  %}{{ parent() }}{% else %}...{% endif %}{% endblock %}` near the bottom:
  logged-in clients fall through to the normal `layout_default` body (which
  renders `{% block content %}` — the actual dashboard, defined earlier in
  the file), guests get the full custom marketing page injected directly
  into `body`, bypassing the layout's content block entirely. Easy to miss
  when searching for "the dashboard template" vs "the homepage template" —
  they're the same file.
- **The dashboard content itself (`{% block content %}`) already carries a
  full premium redesign**: `.kzd-quick-actions` (New Order/New Ticket/My
  Profile buttons), `.kzd-stat-card` grid (Account Balance, Invoices,
  Active Services, Open Tickets) with hover-lift, a gradient top-border
  reveal, circular icon badges that invert color on hover, and
  `font-variant-numeric: tabular-nums` on the stat values (the same
  Stripe-signature pattern independently arrived at here). Styles live in
  `kzd-overrides.css` under the "Dashboard: quick actions + overview stat
  cards" comment.
- **Bug: a plain, unstyled "Welcome to the KZD Solutions Client Portal"
  banner with a bullet list sat above those stat cards.** This was *not*
  template content — grepping the theme for that literal text finds
  nothing. It's FOSSBilling's stock `{% if settings.showcase_enabled %}`
  block (a bare Bootstrap `alert alert-info`), driven by the
  admin-configurable `showcase_text` setting (Index module, rendered via
  `markdown_to_html`), sitting untouched above an otherwise redesigned
  page. Removed the block from `html_custom/mod_index_dashboard.html.twig`
  entirely so the quick actions + stat cards are the first thing a client
  sees. If a "welcome" message is wanted again later, it needs to be built
  as a styled component matching the rest of the page, not re-enabled via
  the `showcase_enabled` setting (that always renders as the plain stock
  alert regardless of theme).

## AI Website Builder (separate application)

A third codebase, not part of either repo in `ARCHITECTURE.md`'s
"two-repository split" — see `AI_WEBSITE_BUILDER.md` for the full
breakdown (source location, deploy topology, this session's changes).
Mounted at `/build` on the same domain as FOSSBilling via a reverse proxy —
the homepage prompt bar above is a plain `<form method="get"
action="/build">`, no JS handoff involved.

## Infrastructure / workflow

- **CI** — `.github/workflows/ci.yml`: PHP syntax lint on push/PR to
  `main`/`develop`. No `composer validate` step — this install ships with
  `vendor/` committed directly rather than installed via Composer (no root
  `composer.json` exists), so there's nothing for Composer to validate.
- **Deploy** — `.github/workflows/deploy.yml`: automated SSH deploy to
  production, nightly + manual trigger. See `DEPLOYMENT.md` — this is its
  own significant piece of infrastructure, not a simple config tweak.
- **`.gitignore` exception for `themes/admin_default/assets/build/`** — that
  whole directory is normally excluded (regenerated Tabler build output),
  except one hand-maintained file
  (`kzd-admin-overrides.css`) which is force-added. See `BRANDING.md`.
- **Untracked the auto-downloaded GeoIP databases** (2026-10-17) —
  `library/FOSSBilling/GeoIP/Databases/{CC0-Country,PDDL-ASN}.mmdb` aren't
  source; `FOSSBilling\GeoIP\Reader::updateDefaultDatabases()` re-downloads
  them from GitHub releases whenever missing or >7 days old, fired every
  admin cron run. They only ended up tracked because the original
  baseline commit swept up the whole directory from an existing
  FTP-uploaded install (this repo's history doesn't start from a clean
  `git init`). Every cron refresh past that baseline snapshot showed up
  as a permanent, unexplained "modified" binary diff. Added both to
  `.gitignore` and untracked with `git rm --cached` (kept on disk, not
  deleted). See `DEPLOYMENT.md`'s "Known incident: untracking a
  previously-committed file breaks the next `git pull`" for the deploy-
  time gotcha this specific kind of change runs into, and why it isn't
  GeoIP-specific (`dd944b7`).

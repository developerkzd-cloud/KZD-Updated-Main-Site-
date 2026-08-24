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

## Domain registrars

- **HostAfrica adapter** — `library/Registrar/Adapter/Hostafrica.php`
  **[core edit — new adapter file]**. See `HOSTAFRICA.md`.
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

- **Step indicator** — `themes/kzd/html_custom/mod_orderbutton_content.html.twig`
  **[override]**. Purely visual progress bar across the order accordion
  (Product → Configure → Account → Cart → Payment), driven by Bootstrap's
  `shown.bs.collapse` event. No backend changes.
- **Mid-order login/register redirect fix** — guest header nav Login link
  and the session-expiry JS redirect now carry `?redirect_uri=` so a
  customer who logs in mid-checkout lands back where they were instead of
  the homepage. Touches `themes/kzd/html/layout_default.html.twig`
  **[core edit]** and `html_custom/mod_page_login.html.twig` /
  `mod_page_signup.html.twig` **[override]**.
- **Domain order form** — `html_custom/mod_servicedomain_order_form.html.twig`
  **[override]**: TLD-unavailable error box with alternative-TLD
  suggestions, and pre-fills EPP/transfer code + domain name from the
  website's query params (`?epp=`, `?sld=`, `?tld=`, `?action=transfer`).

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
- **`themes/kzd/html_custom/mod_servicedomain_order_form.html.twig`**
  **[override]** — added a warning + hosting-suggestion block below the
  Register/Transfer tabs. **The suggested product IDs (`[2, 3, 4, 5]`)
  are hardcoded in the template for now** — flagged there and here as the
  thing to replace with an admin-configurable `cross_sell_products` field
  on `Product` (mirroring the existing `addons` JSON field and its
  generic `mod_orderbutton_addons.html.twig` renderer) once it's worth
  the extra admin UI.
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
- **Only affects new orders** — `client_order.service_type` is frozen at
  order-creation time, so pre-existing hosting orders (sold while
  `type=custom`) keep working under `Servicecustom` exactly as before.
- **Not done yet**: Business Email / DirectAdmin mailbox automation
  (`CMD_API_POP` — no per-mailbox API in the adapter at all yet); hosting
  plan upgrade/downgrade between tiers (stock supports it, not
  specifically tested); general UI/UX polish, deliberately deferred to a
  later session.

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

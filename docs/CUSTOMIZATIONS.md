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

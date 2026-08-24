# KZD Solutions data seeds

Catalog data (products, TLD pricing) lives in the database, not files, so it
isn't visible in a normal git diff. These scripts are kept here purely as a
version-controlled record of what was seeded and how to reproduce it after a
database reset.

## create_hosting_products.php

Creates the "Shared Hosting" product category and the four Shared Hosting
plans (Starter/Basic/Business/Standard) with monthly, annual (1Y), and
2-year (2Y) recurring pricing enabled, matching the exact plan specs and
discounted multi-year rates from the KZD Solutions brief:

| Plan | Monthly | Annual (save 2 months) | 2-Year (save 5 months) |
|---|---|---|---|
| Starter | R99 | R990/yr | R1,881/2yr |
| Basic | R149 | R1,490/yr | R2,831/2yr |
| Standard | R199 | R1,990/yr | R3,781/2yr |
| Business | R249 | R2,490/yr | R4,731/2yr |

Run once with:

```
php create_hosting_products.php
```

(edit the PDO connection string at the top if the database name/credentials
differ). Prints the resulting product IDs -- update `KZD.products` in the
website's `js/kzd-integration.js` if they change.

Current mapping (fresh install order): Starter=2, Basic=3, Standard=4,
Business=5. Product ID 1 is FOSSBilling's own seeded domain product.

TLD pricing (15 extensions) was seeded via direct SQL rather than a script;
see the git log for the `tld` table INSERT/UPDATE statements used, and
`KZD_Solutions_reseller_pricing.docx` for the source figures.

## create_business_email_products.php

Creates a "Business Email" product category and its two plans, for
customers who only need professional email hosting (no website hosting):

| Plan | Monthly |
|---|---|
| Business Email | R79 (25 email accounts) |
| Premium Business Email | R149 (100 email accounts) |

Monthly billing only -- annual/2-year pricing isn't specified for these in
the source document. Run once with:

```
php create_business_email_products.php
```

Source: "KZD Solutions new pricing strategy - Updated Hosting Packages.docx",
Business Email Packages section. That same document also revised the 4
Shared Hosting plans' storage allocations down to 2/4/7/15 GB (from the
5/10/20/50 GB originally seeded above) to avoid overselling the 50 GB
HostAfrica reseller account -- applied directly to the existing products'
`description` field via SQL, not a script, since it only changed one line
per product.

Current mapping (fresh install order, continuing from the hosting plans
above): Business Email=6, Premium Business Email=7. Update `KZD.products` in
the website's `js/kzd-integration.js` if they change.

## 2026-08-21_domain_protection_columns.sql + create_domain_protection_addon.php

Adds the "Domain Protection & Privacy" optional domain add-on (R99/year,
WHOIS privacy), unchecked by default at checkout, mirroring HostAfrica's
own storefront upsell. Two parts, apply in order:

1. **`2026-08-21_domain_protection_columns.sql`** — schema migration.
   FOSSBilling runs frozen (no auto-migration), so this is a plain
   reversible SQL file (up block + commented-out down block). Adds three
   columns to `service_domain`:
   - `protection_purchased` (bool, default 0) — customer has a paid
     protection add-on order for this domain. This is the billing-truth
     flag; existing domains default to 0/not-purchased.
   - `protection_order_id` (nullable) — the linked add-on order's id, for
     admin traceability.
   - `protection_registrar_status` (nullable enum-ish string:
     `active`/`failed`/NULL=unknown) — whether the registrar actually
     confirmed WHOIS privacy is on, kept separate from `protection_purchased`
     so a registrar-side failure is never confused with "not purchased."
   Apply with: `mysql -u <user> -p <db> < 2026-08-21_domain_protection_columns.sql`

2. **`create_domain_protection_addon.php`** — creates the add-on product
   itself (type=`custom`, `is_addon=1`, `hidden=1` so it's never
   independently browsable/orderable, annual-only recurring pricing at
   R99/year) and attaches its id to the domain product's (id 1) `addons`
   JSON list, so FOSSBilling's existing generic add-on UI
   (`Orderbutton/templates/client/mod_orderbutton_addons.html.twig`) shows
   it automatically on both the Register and Transfer tabs of the domain
   order form — no template changes needed for the checkbox itself. Safe
   to re-run (skips creation if the product already exists, re-syncs the
   domain product's addon list either way). Run once with:

   ```
   php create_domain_protection_addon.php
   ```

   (edit the PDO connection string first). On the local dev DB this
   created product id 8. Price lives in `product_payment.a_price` for
   that product -- change it from Admin -> Products ->
   "Domain Protection & Privacy" any time; nothing else needs updating,
   the checkout price, invoice amount, and client/admin status displays
   all read it live.

   Code-side changes that make the purchase actually mean something (not
   part of this seed data): `library/Registrar/Adapter/Hostafrica.php`
   (register/transfer never auto-enable the registrar add-on -- see that
   file's own comments; renewal reflects stored purchase state) and
   `modules/Servicedomain/Service.php` (links a same-cart add-on order
   back to its domain order, activates registrar privacy post-registration
   only if purchased, records real success/failure instead of assuming
   success). See `docs/CUSTOMIZATIONS.md`.

   **Known limitation**: if a customer registers multiple domains in one
   cart and selects protection for only some, the domain <-> add-on-order
   linkage (matched via cart `group_id`) can't disambiguate which
   protection order belongs to which domain -- it's only reliable for the
   normal one-domain-at-a-time checkout.

## configure_domain_association.php

Turns on the domain-association checkout step for the 4 Shared Hosting
products (optional -- customer may skip) and the 2 Business Email
products (required -- email needs a domain), by writing
`product.config.domain_association` (`optional`/`required`) plus the
three `allow_domain_*` flags. Renders via the new
`modules/Servicecustom/templates/client/mod_servicecustom_order_form.html.twig`
(a real module template, not a `html_custom/` override -- see
`docs/CUSTOMIZATIONS.md` for why) and the domain-association methods
added to
`modules/Servicecustom/Service.php` -- see `docs/CUSTOMIZATIONS.md` for
the full design (why `type=custom` products needed their own version of
what `Servicehosting` already does for `type=hosting`).

Idempotent -- always overwrites `config` for the listed IDs (2-7), safe
to re-run. Run once with:

```
php configure_domain_association.php
```

(edit the PDO connection string first). Product IDs are the same fresh-
install mapping noted above (Starter=2, Basic=3, Standard=4, Business=5,
Business Email=6, Premium Business Email=7) -- update the ID arrays at
the top of the script if yours differ.

The domain→hosting cross-sell suggestion shown on the domain order form
(`mod_servicedomain_order_form.html.twig`) is separate: no seed data,
just a hardcoded list of hosting product IDs directly in that template
-- flagged there for becoming an admin-configurable `cross_sell_products`
field later.

## configure_hosting_plans.php

Switches the 4 Shared Hosting products (ids 2-5) from `type=custom` to
`type=hosting`, so FOSSBilling automatically creates/suspends/
unsuspends/cancels a real DirectAdmin account instead of requiring
manual setup, and the client area gets a stock "Login to Control Panel"
single sign-on button. See `docs/CUSTOMIZATIONS.md` ("Hosting DirectAdmin
automation") for the full design and why this needed zero code changes.

Creates one `service_hosting_hp` row per plan (resource limits matching
`hosting.html`'s advertised specs) and points each product's `config` at
that plan + `service_hosting_server` id 1 ("HostAfrica Reseller",
already configured). No DirectAdmin package needs to exist on the
server beforehand -- the adapter falls back to custom resource values
automatically when there's no name match.

**Trade-off**: hosting checkout now requires a domain again (no "skip
for now" option) -- confirmed with the client as worth it for full
automation. Business Email (ids 6-7) is untouched.

Idempotent -- safe to re-run (updates the Hp row + product config rather
than duplicating). Run once with:

```
php configure_hosting_plans.php
```

(edit the PDO connection string first). Only affects new orders --
existing hosting orders sold under `type=custom` are unaffected
(`client_order.service_type` is frozen at order-creation time).

**Before running against a real DirectAdmin account creation test**: this
creates a real user on the live server. See `docs/CUSTOMIZATIONS.md` and
get explicit sign-off before triggering `action_activate()` against
production -- `action_create()` alone (building the local FOSSBilling
record) is safe and doesn't touch DirectAdmin at all.

## rebrand_service_emails.php

Rebrands the 11 customer-facing lifecycle/reminder email templates
(`servicecustom_*`, `servicedomain_*`, `invoice_due_after`,
`invoice_payment_reminder`) to the same visual system as the 8 templates in
`email-templates/` (see that folder's own README). Content lives in the
`email_template` DB table; this script's job is just to push the branded
HTML into it. Safe to re-run -- it's a plain `UPDATE`, not an insert, so
running it twice just overwrites with the same content.

Run once with:

```
php rebrand_service_emails.php
```

(edit the PDO connection string at the top first). The full rendered
content for each template also lives as `.twig` files in
`email-templates/`, kept there purely as a readable backup/reference —
this script is the actual mechanism for getting that content into a fresh
database.

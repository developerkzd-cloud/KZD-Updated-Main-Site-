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

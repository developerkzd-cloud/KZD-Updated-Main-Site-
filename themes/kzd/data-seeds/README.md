# KZD Solutions data seeds

Catalog data (products, TLD pricing) lives in the database, not files, so it
isn't visible in a normal git diff. These scripts are kept here purely as a
version-controlled record of what was seeded and how to reproduce it after a
database reset.

## create_hosting_products.php

Creates the "Shared Hosting" product category and the four Shared Hosting
plans (Starter/Basic/Business/Standard) with monthly-only recurring pricing,
matching the exact plan specs from the KZD Solutions brief. Run once with:

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

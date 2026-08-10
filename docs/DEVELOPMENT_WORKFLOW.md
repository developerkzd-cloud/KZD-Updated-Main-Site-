# Development Workflow

## Branches

- **`main`** — production. Auto-deploys nightly + on manual trigger (see
  `DEPLOYMENT.md`). Never develop directly on this branch.
- **`develop`** — where all work happens. Merge to `main` when a batch of
  work has been tested and is ready to ship.

Both repos (website and FOSSBilling) follow this same convention.

## Making a change

1. Work on `develop`.
2. If it's a template file, prefer adding/editing in `html_custom/` over
   the stock `html/` directory (see `ARCHITECTURE.md`'s override
   mechanism section) — keeps upstream FOSSBilling updates safe to pull
   later.
3. Test locally against `fossbilling.test` before committing. Remember: two
   separate PHP installs exist on the dev machine with different
   `php.ini` files (Laragon's own, and a separate XAMPP install on `PATH`)
   — if testing via CLI script, make sure you're invoking the same PHP
   binary that actually serves the site
   (`C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe`), not whichever
   `php` resolves to on `PATH`.
4. **Domain/registrar features cannot be tested from local dev at all** —
   HostAfrica's API only accepts whitelisted IPs (see `HOSTAFRICA.md`).
   Budget for live-site testing on anything touching domain registration or
   transfer.
5. Run `php -l` on changed PHP files before committing — no PHPUnit/static
   analysis is wired into CI beyond syntax linting (see below), so this is
   the cheapest sanity check available.
6. Commit with a message explaining *why*, not just *what* — this
   codebase's git history is meant to be read later as documentation of
   decisions, not just a change log. Look at existing commit messages for
   the expected level of detail.
7. Push to `develop`. When ready to ship a batch: merge `develop` → `main`
   locally (`--no-ff` to preserve the merge point), push `main`. The
   automated deploy workflow (or a manual `gh workflow run deploy.yml`
   trigger) takes it from there for code; run any needed database scripts
   manually afterward (see `DEPLOYMENT.md`).

## CI

`.github/workflows/ci.yml` runs on push/PR to `main` and `develop`: PHP
syntax lint (`php -l` across all files, `vendor/` excluded) via
`shivammathur/setup-php`. That's it — no `composer validate` (there's no
root `composer.json`, this install ships with `vendor/` committed directly
rather than Composer-installed) and no automated test suite run in CI, even
though `modules/*/tests/` directories exist with PHPUnit tests scattered
through the codebase (pre-existing, not something this project's workflow
runs automatically — worth wiring up if that becomes a priority).

## Testing methodology used for Phase 9 (end-to-end testing)

No browser is available in the environment these end-to-end tests were run
from, so verification used real HTTP requests (`curl`, with session cookies
and CSRF tokens handled explicitly — FOSSBilling's CSRF token lives in a
`csrf_token` cookie, double-submit style) against the actual running API,
combined with direct database checks of each step's effect. This is
functionally thorough (catches real logic/data bugs — several were found
this way, not by reading code) but does **not** catch pure visual/CSS
issues, or anything that depends on client-side JavaScript actually
executing (e.g. the EPP-code prefill on the domain transfer form — verified
correct by reading the JS, not by seeing it run, since curl doesn't execute
JS). If you're testing something visual or JS-dependent, that needs an
actual browser pass on top of this kind of API-level testing. See
`END_TO_END_TESTING.md` for the full methodology and results of that
specific pass.

## Data seed scripts

`themes/kzd/data-seeds/` — one-off PHP scripts for populating catalog data
(products, categories) that lives in the database and wouldn't otherwise be
visible in a git diff. Each has a PDO connection string at the top
(defaults to local dev credentials, meant to be edited before running
elsewhere) and is safe to re-run — either idempotent by design (checks for
an existing category before creating one) or a straightforward `UPDATE`
that produces the same result each time. See `themes/kzd/data-seeds/README.md`
for the full list and what each one does; add a new entry there for any
script you add.

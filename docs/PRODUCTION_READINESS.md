# Production Readiness

Status as of 2026-10-21, end of the Phase 10 hardening/merge-prep pass.
Marked ✅ where confirmed working, ⚠️ where there's a known gap or something
untested, ❓ where this document genuinely doesn't know the answer and it
needs checking directly.

**Local dev (Laragon) is gone as of this pass** — there is no longer a local
environment to test against. Everything below from Phase 10 onward was
verified by reading the code (and, where noted, by actually running the
builder's Node server in isolation), not by clicking through the live site.
The items in the checklist immediately below are the only things standing
between this codebase and a real production cutover; everything else in
this document is historical context.

## Before merging live — action items

Nothing below is a code change. These are account-level/config steps only,
to be done directly on the production server/admin panel once this branch
is deployed there — none of them can be done from this repo.

- [ ] **HostAfrica IP whitelist.** Get the production server's real public
  IP whitelisted with HostAfrica (see `HOSTAFRICA.md`). Domain search,
  registration and transfer will fail with a whitelist error until this is
  done — this is now an honest failure, not a hidden fake-success (see
  "HostAfrica dev stub removed" below). This is the one item that actually
  blocks domain search/purchase/transfer from working at all.
- [ ] **Paystack: switch to live keys** (`sk_live_.../pk_live_...`) in
  admin → gateway settings, replacing the `sk_test_.../pk_test_...` pair.
  No code change needed — the adapter's behavior is governed entirely by
  which key type is configured (see Paystack checklist below).
- [ ] **Paystack: confirm the dashboard's webhook URL** points at
  production's real `ipn.php` endpoint, not a stale/local one.
- [ ] **Paystack: one real test-mode transaction**, then one small real
  transaction after switching to live keys — a full charge through
  Paystack's hosted checkout has never been completed end-to-end in any
  review so far, only invoice initialization and redirect.
- [ ] **Google Sign-In (new this pass, optional):** create an OAuth Client
  ID in Google Cloud Console (exact redirect URI is shown on the settings
  page) and enter the Client ID/Secret under admin → System Settings →
  "Sign in with Google." The button on login/signup stays hidden until
  this is filled in, so it's safe to leave blank if not wanted yet.
- [ ] **`force_https` + HSTS together.** Production's `config.php`
  (gitignored, server-only) needs `force_https: true` once a valid TLS
  cert is confirmed working, and the commented-out HSTS header in
  `deploy/nginx-fossbilling.conf.example` uncommented **at the same
  time** — not one without the other (see SSL section below for why).
- [ ] **Rotate the SMTP mailbox password** that was pasted into a chat
  conversation during SMTP troubleshooting, if that hasn't already been
  done (flagged in an earlier pass, still open).
- [ ] **Confirm Groq/Pexels keys are set** in `kzd-ai-website-builder-app/server/.env`
  on the production server (`GROQ_API_KEY`, `PEXELS_API_KEY`) — the proxy
  degrades gracefully without them (503 for AI generation, empty photo
  results) rather than crashing, but the builder needs both to actually work.

## Completed features

- Website ↔ FOSSBilling integration (product ID mapping, order handoff)
- Paystack payment gateway, including one-click saved-card payments
- HostAfrica + OpenProvider domain registrar adapters
- Full client-area + admin branding (see `BRANDING.md`)
- 19 of ~42 email templates rebranded (the ones that actually fire for this
  catalog — see `themes/kzd/email-templates/README.md`)
- Product catalog: 4 Shared Hosting plans, 2 Business Email plans, domain
  registration/transfer, 15 TLDs priced
- Custom invoice numbering (`KZD-100001` format)
- Order flow step indicator
- Automated production deploy pipeline (code only, nightly + manual)
- End-to-end tested: new customer purchase, returning customer, support
  tickets, admin workflow, Business Email ordering (`END_TO_END_TESTING.md`)
- **Phase 10 additions:**
  - Paystack is never named to customers — every customer-facing label now
    says "Pay with card" (button, redirect text, order-page trust bar, the
    invoice/checkout gateway picker's logo swapped for a generic card icon,
    dashboard footer line). Admin-only screens still say "Paystack" since
    staff need to know which processor is configured.
  - Sign in / sign up with Google, built on the existing session/password
    system (no new dependency) — see `library/FOSSBilling/Security/GoogleOAuth.php`,
    routes `/client/google-start` + `/client/google-callback`. Hidden
    automatically until an admin configures a Client ID/Secret.
  - AI website builder (`kzd-ai-website-builder-app/server/index.js`)
    hardened: both proxy routes (`/api/groq`, `/api/pexels`) now validate
    the request shape before forwarding, closing an open-proxy gap where
    anyone could've used the server's Groq/Pexels keys for arbitrary
    requests unrelated to building a site. Verified live by running the
    server and testing both abusive and legitimate payloads.
  - HostAfrica registrar adapter: a dev-only stub that fabricated fake
    domain-availability results (see Known Issues) has been removed —
    `isDomainAvailable()` now always makes the real API call.
  - Client-area header restyled to match the monochrome/pill design
    language already used on auth and checkout pages, plus a quiet link
    back to the main kzdsolutions.co.za site for continuity now that the
    two are understood to be separate apps (see `PROJECT_STRUCTURE.md`
    for how the Next.js marketing site is organized).
  - Spot-checked file upload handling (clean — the one upload path in the
    app is admin-only and already validates extension + MIME type) and
    admin API permission scoping (clean — the two `Api/Admin.php` classes
    with zero permission checks turned out to be intentional upstream
    design, not gaps).

## Known issues

| Issue | Severity | Status |
|---|---|---|
| HostAfrica production IP not yet whitelisted | High — blocks domain search/register/transfer entirely until done | ⚠️ Open — see action items above |
| Generic email signature on every email (`company_signature` setting) | Low — cosmetic | ⚠️ Open, needs the project owner's preferred wording |
| ~23 email templates still stock FOSSBilling styling (internal staff-facing + dead product types) | Low | Documented as intentionally deprioritized, see email-templates README |
| OpenProvider `getTlds()` returns empty | Low — HostAfrica is primary registrar | Open, low priority |
| No automated test suite runs in CI (PHPUnit tests exist in the codebase but aren't wired up) | Medium — regressions rely on manual/E2E testing | Open |

**Resolved this pass:** "Domain registration/transfer untestable from local
dev" is no longer the right framing — the underlying cause was a dev-only
stub in the HostAfrica adapter (fabricated fake availability results,
clearly labeled for removal), not a general local-dev limitation. The stub
is gone; the only remaining blocker is the real HostAfrica IP whitelist,
which is an account step, not a code or environment problem.

## Deployment checklist

- [x] `main`/`develop` branch convention on both repos
- [x] Automated code deploy (nightly + manual trigger) with a properly
  restricted credential model — see `DEPLOYMENT.md`
- [x] Deploy verified working end-to-end (test-triggered, confirmed via
  `git log` on the server matching the deployed commit)
- [ ] Database migration/seeding is manual by design — confirm whoever
  deploys knows to check `themes/kzd/data-seeds/README.md` after any
  release that touches the catalog or settings
- [ ] Rollback procedure — not yet documented. Currently: `git log`,
  `git checkout <previous-commit>` on the server, clear cache. Worth
  writing this down properly before it's needed under pressure.

## SMTP checklist

- [x] SMTP credentials configured (host, port 587, username, password) in
  both local dev and production admin panels
- [x] Local dev: confirmed genuinely working (real test email sent
  successfully via Laragon's PHP) — the earlier "success but nothing
  arrives" was two separate red herrings: a stale `openssl.cafile` path in
  an *unrelated* XAMPP PHP install that isn't what serves the site, and the
  admin test-email recipient being a different address than the one being
  checked
- [x] **Production: resolved.** Confirmed root cause via the mail host's
  support ticket response: Contabo's server IP had been auto-blocked by
  their firewall (CSF/LFD) after 5 failed SMTP AUTH attempts within an hour
  on 2026-08-07 — this matches an earlier log entry showing a failed login
  with incorrect credentials, from before the SMTP settings were corrected.
  Not an ongoing risk: the credentials now in place are correct, so the
  same failure shouldn't recur. Connectivity and an actual test send were
  both re-confirmed working on 2026-08-10 (real email received), and the
  email queue has no stuck/retrying backlog.
- [x] Verified via a real test-email send (`RESULT: true`, email confirmed
  received) — not just a connectivity check.

## Paystack checklist

- [x] Adapter installed, tested (invoice initialization, redirect flow)
- [x] Test-mode keys (`sk_test_...`) configured on local dev
- [x] Auto-redirect confirmed working (both stacked bugs fixed — see
  `PAYSTACK.md`)
- [x] Webhook signature validation (HMAC-SHA512) in place
- [x] Double verification (webhook payload is never trusted blindly, always
  re-verified against Paystack's API before crediting)
- [x] **Confirmed no code-level test/live gate exists** — the "Sandbox /
  Test Mode" checkbox in admin is a label only, never read in code.
  Behavior is governed entirely by which key type (`sk_test_`/`sk_live_`)
  is entered, so switching to live keys is purely a config change.
- [x] **Paystack is never named to the customer** — see Completed features
  above for the full list of what changed.
- [ ] Confirm production is using **live** keys (`sk_live_...`), not test
  keys, before accepting real customer payments — account-level step, see
  action items above
- [ ] Confirm the Paystack dashboard's configured webhook URL matches
  production's `ipn.php` endpoint
- [ ] A full real charge (OTP/card entry through Paystack's hosted
  checkout) has not been completed end-to-end in this review — only
  invoice initialization and redirect were verified. Recommend one real
  test-mode transaction before going live, and one small real transaction
  after switching to live keys.

## Registrar checklist

- [x] HostAfrica adapter installed and functioning (subject to the IP
  whitelist — see `HOSTAFRICA.md`)
- [x] OpenProvider adapter installed and functioning
- [x] Order-time email-forwarding add-on deliberately disabled (avoids
  surprise billing — see `HOSTAFRICA.md`)
- [x] **Dev-only availability stub removed** from `isDomainAvailable()` —
  real lookups always hit HostAfrica's actual API now, no fake data path
  left in the code. See Known Issues above.
- [x] **Code path traced end to end**: domain search → `servicedomain/check`
  (rate-limited, SLD HTML-escaped, TLD matched against the real catalog
  before any registrar call) → add to cart (`multiple=1`, doesn't clobber
  an existing cart item) → checkout → payment screen. Transfer follows the
  same shape via `can_be_transferred`. Traced by reading the code, not by
  running it — see "Before merging live" above for why.
- [ ] Domain registration and transfer need a real live-site test pass once
  the HostAfrica IP whitelist is in place — this can now actually be
  verified for real, since the fake-data stub that made local testing
  meaningless either way is gone.
- [ ] Confirm which registrar is authoritative for which TLDs in current
  admin configuration — not audited in this review

## Google Sign-In checklist

- [x] Built: `library/FOSSBilling/Security/GoogleOAuth.php` (plain REST
  calls via the existing shared HTTP client, no new Composer dependency),
  routes `/client/google-start` + `/client/google-callback` in
  `modules/Client/Controller/Client.php`, find-or-create logic in
  `modules/Client/Service.php::findOrCreateClientFromGoogleProfile()`.
- [x] CSRF-protected (random `state` stored in session, checked with
  `hash_equals`), rate-limited (`client_google_oauth_ip` policy, 20/hour),
  and the `redirect_uri` it accepts can't be turned into an open redirect
  (confirmed — FOSSBilling's URL helper always prefixes onto the app's own
  domain, never passes an absolute external URL through).
- [x] Button hidden automatically on login/signup until an admin fills in
  the Client ID/Secret — safe to deploy with this feature entirely unused.
- [ ] Needs a real Google Cloud OAuth Client ID/Secret entered in admin —
  account-level step, see action items above. Nothing in this checklist
  has been run against real Google infrastructure yet (no live environment
  to test it in).

## Cron jobs

- [x] **Verified and fixed.** `disable_auto_cron` is `true` in config, so
  FOSSBilling relies on a real system cron hitting `cron.php` every 5
  minutes. It was running — but from **root's** crontab instead of `www`'s,
  which caused a real production incident: every run recreated Doctrine's
  proxy cache directory as root, breaking the site for the `www`-owned web
  server (`Your proxy directory ".../doctrine/proxies" must be writable`).
  Moved to `www`'s crontab; both sides re-verified via `crontab -l` /
  `sudo -u www crontab -l`. Full incident writeup in
  `DEPLOYMENT.md`'s "Known incident" section.

## Backups

❓ Not reviewed in this pass. Needs direct answers: does aaPanel have
automated database + file backups configured for this site? What's the
retention/frequency? Has a restore ever actually been tested? This is
infrastructure-level and wasn't part of the application-level work covered
here.

## SSL

❓ Still not reviewed against production directly (no server access from
this environment). What's confirmed: `deploy/nginx-fossbilling.conf.example`
already has the HSTS header written and ready, deliberately commented out
with a note not to enable it until HTTPS is confirmed working end to end —
flipping `force_https: true` in production's `config.php` without HSTS
already working (or vice versa) risks locking visitors out if the cert
isn't actually serving correctly. Do both together, in that order (confirm
HTTPS works plain, then flip `force_https`, then uncomment HSTS), not either
one alone. See action items above.

## Environment variables / secrets

- [x] `config.php` gitignored on both local dev and production, confirmed
  never committed
- [x] GitHub deploy secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`,
  `DEPLOY_SSH_KEY`) scoped narrowly — see `DEPLOYMENT.md`'s security model
- [x] Registrar/payment credentials stored encrypted in the database
  (`extension_meta`, see `ARCHITECTURE.md`), not in plaintext config
- [ ] **A real SMTP password was pasted into a chat conversation during
  this review's SMTP troubleshooting.** Recommend rotating that mailbox
  password if it hasn't been done already.

## Security review

- [x] Payment webhook signature validation in place (Paystack)
- [x] Payment amounts always re-verified server-side against the gateway's
  API, never trusted from client/webhook payload directly
- [x] Deploy credentials use forced-command + read-only scoping (see
  `DEPLOYMENT.md`) rather than broad SSH/PAT access
- [x] Registrar order-time add-on billing risk addressed (HostAfrica
  email-forwarding — see above)
- [ ] `force_https` needs confirming as `true` in production (see SSL,
  above)
- [x] **File upload handling reviewed** — the only real upload path in the
  app (`modules/Servicedownloadable/`) is admin-only and already validates
  both file extension and MIME type via Symfony's `UploadedFile`. Clean.
- [x] **Admin API permission scoping spot-checked** — every `Api/Admin.php`
  class was checked for methods with zero `checkPermissions()` calls at
  all. Two hits (`Cart/Api/Admin.php`, `Page/Api/Admin.php`), both reviewed
  and found to be intentional upstream design (Cart is explicitly
  `hide_permissions: true` in FOSSBilling core; Page's one method just
  lists page names for a settings dropdown). This was a spot-check for one
  specific failure shape, not an exhaustive per-method audit.
- [x] **Rate limiting confirmed actually effective** — `config.php`'s empty
  `rate_limiter.policies: []` looked like it disabled limiting, but
  `RateLimiter::getConfig()` merges over a full set of defaults (login,
  signup, password reset, domain lookups, etc.) rather than replacing them.
  Nothing was actually unprotected.
- [x] **Open-proxy gap in the AI builder closed** — see Completed features
  above (Groq/Pexels request validation).

## Performance review

❓ Not reviewed in this pass. No load testing, query profiling, or asset
optimization audit was performed. Worth a dedicated pass once real traffic
patterns are known — premature to guess at bottlenecks before that.

## Future improvements

- Wire up the existing PHPUnit test suite to CI instead of syntax-lint-only
- Automate database migrations with the same rigor as code deploy, once the
  "always needs a human to check first" pattern stabilizes into something
  with predictable pre-conditions
- Rebrand the remaining ~23 stock email templates if/when they become
  customer-visible (e.g. if `type=hosting`/`license`/`downloadable`
  products are ever added)
- Implement `OpenProvider::getTlds()` properly if OpenProvider becomes the
  primary registrar
- Formal backup/restore test, SSL/HTTPS enforcement confirmation, and a
  documented rollback procedure — all flagged above as open items
- Full live run-through of every flow in this document (domain search,
  purchase, transfer, Google Sign-In, Paystack live charge) once a real
  environment exists again — Phase 10's work was verified by reading code
  and, for the AI builder only, running it in isolation. Nothing involving
  FOSSBilling's own PHP/MySQL stack has actually been executed since local
  dev went away.
- If the client-area header redesign (Phase 10) should more closely match
  the actual Next.js marketing site's Nav component rather than the
  best-effort match made from `PROJECT_STRUCTURE.md` alone, revisit it with
  the real `kzd-next` repo open side by side.

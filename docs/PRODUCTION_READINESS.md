# Production Readiness

Status as of 2026-08-10, end of the Phase 1–9 review/hardening pass. Marked
✅ where confirmed working, ⚠️ where there's a known gap or something
untested, ❓ where this document genuinely doesn't know the answer and it
needs checking directly.

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

## Known issues

| Issue | Severity | Status |
|---|---|---|
| Domain registration/transfer untestable from local dev (registrar IP whitelist) | Medium — process risk, not a code bug | ⚠️ Needs a manual live-site test pass |
| Generic email signature on every email (`company_signature` setting) | Low — cosmetic | ⚠️ Open, needs the project owner's preferred wording |
| ~23 email templates still stock FOSSBilling styling (internal staff-facing + dead product types) | Low | Documented as intentionally deprioritized, see email-templates README |
| OpenProvider `getTlds()` returns empty | Low — HostAfrica is primary registrar | Open, low priority |
| No automated test suite runs in CI (PHPUnit tests exist in the codebase but aren't wired up) | Medium — regressions rely on manual/E2E testing | Open |

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
- [ ] Confirm production is using **live** keys (`sk_live_...`), not test
  keys, before accepting real customer payments — not verified in this
  review, check directly in production admin settings
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
- [ ] Domain registration and transfer need a manual live-site test pass —
  not verifiable from local dev at all (see Known Issues)
- [ ] Confirm which registrar is authoritative for which TLDs in current
  admin configuration — not audited in this review

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

❓ Not reviewed in this pass beyond `force_https: false` in local dev's
config (expected there — local dev has no real cert). **Production's
`config.php` needs the same setting checked** — if it's also `false` in
production, that should be flipped to `true` once a valid certificate is
confirmed in place, or customer sessions/payment pages are reachable over
plain HTTP.

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
- [ ] No formal review was done of file upload handling, admin permission
  scoping, or rate limiting in this pass — out of scope for this review,
  worth a dedicated look before handling higher transaction volume

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

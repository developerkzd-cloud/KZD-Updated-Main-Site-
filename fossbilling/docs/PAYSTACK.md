# Paystack Payment Gateway

`library/Payment/Adapter/Paystack.php` — a full custom adapter, doesn't
exist in stock FOSSBilling. South African payment gateway (cards, Instant
EFT/Ozow, bank transfer).

## How it works

Two steps, matching FOSSBilling's payment adapter interface:

1. **`getHtml($api_admin, $invoice_id, $subscription)`** — called when a
   customer views an unpaid invoice and picks Paystack. Calls Paystack's
   `/transaction/initialize` API server-side with the invoice amount
   (converted to cents — Paystack requires the smallest currency unit) and
   a generated reference (`KZD-INV{invoice_id}-{timestamp}`, embedded so
   the invoice can be recovered later even without metadata). Returns HTML:
   a form that auto-submits to the `authorization_url` Paystack returns,
   redirecting the customer to Paystack's hosted checkout.
2. **`processTransaction($api_admin, $id, $data, $gateway_id)`** — called by
   `ipn.php` via two possible paths:
   - **Path A (webhook, preferred)**: Paystack POSTs to the configured
     webhook URL with an `x-paystack-signature` header. HMAC-SHA512
     validated before anything else happens.
   - **Path B (browser callback)**: the customer's browser returns to
     `callback_url` with `?reference=...` after paying. Less reliable
     (customer could close the tab before returning) but gives immediate
     feedback on the thank-you page.
   Both paths independently **re-verify the transaction with Paystack's API**
   before crediting anything — the payload is never trusted blindly, even
   from the signed webhook.

**Critical config detail**: `callback_url` must point at `ipn.php?redirect=1`,
not a plain content page. That's the URL FOSSBilling wires up to receive the
browser callback as IPN data *and then* forward the client to the invoice
page. Point it anywhere else and Path B silently never runs — payment
confirmation then depends entirely on the webhook being correctly configured
in the Paystack dashboard, with no fallback.

## Auto-redirect — two stacked bugs, both fixed

Originally, `getHtml()` returned a visible "Pay with Paystack" button the
customer had to click before being sent to Paystack — extra friction on
every single checkout. Root cause investigation found **two separate bugs**:

1. **Dead config gate.** The auto-submit script was wrapped in
   `if (!empty($this->config['auto_redirect']))`. That setting was
   referenced in code but **never added to `getConfig()`'s admin form** —
   there was no UI to turn it on, so it was always false, and the button was
   always mandatory. Fixed by removing the gate; auto-redirect is now
   unconditional, matching how FOSSBilling's own core banklink template
   (`modules/Invoice/templates/client/mod_invoice_banklink.html.twig`)
   handles every other redirect-based gateway.
2. **jQuery dependency that silently failed.** Even after fixing #1, the
   auto-redirect still didn't work in production. The script used
   `$(document).ready(...)` — but `themes/kzd/html/` never loads jQuery
   anywhere. This threw a silent `$ is not defined` and the script never
   ran. It had been invisible until now specifically *because* it sat
   behind the dead gate from bug #1 — nobody had ever seen it actually
   execute. Fixed by switching to
   `document.addEventListener('DOMContentLoaded', ...)`, plain JS, matching
   the pattern the core banklink template already uses successfully.

**Lesson for future payment-page changes**: this theme has no jQuery.
Anything added to a payment-page script must be vanilla JS, or it will fail
exactly this same way — silently, invisibly, until someone actually watches
the browser console.

## One-click payment (saved cards)

`saveReusableAuthorization()` and `chargeAuthorization()` on the adapter,
wired through `modules/Invoice/Api/Client.php` (`get_saved_card()`,
`pay_with_saved_card()`) and a UI button in
`themes/kzd/html_custom/mod_invoice_invoice.html.twig`. When a payment
succeeds with a reusable Paystack authorization, it's saved to a
`client_saved_card` table; a later invoice can be paid by hitting Paystack's
`/transaction/charge_authorization` directly, no redirect to checkout at
all.

`client_saved_card` isn't part of FOSSBilling's schema. It used to be
created by a standalone script nobody would remember to run on a fresh
deploy (a real landmine — silently 500s on first save/charge in any new
environment). Now self-heals: `Payment_Adapter_Paystack::ensureSavedCardTableExists($pdo)`
runs a `CREATE TABLE IF NOT EXISTS` lazily wherever the table is touched
(both in the adapter and in `Invoice/Api/Client.php`), so a new
environment just works.

**A declined/pending/failed one-click charge now actually tells the client
why** (2026-10-17). `Paystack.php::verifyAndApply()` never throws on a
non-`success` verification — correct for the redirect and webhook paths,
where nothing synchronously depends on an exception — but
`pay_with_saved_card()` used to treat "`createAndProcess()` didn't throw"
as success and return `true` regardless, so a declined or OTP-pending
saved-card charge silently reloaded the client back to the still-unpaid
invoice with zero explanation, even though the real failure reason was
already sitting on the transaction row. It now loads the transaction
after `createAndProcess()` and throws with that stored error message if
it didn't end up `Model_Transaction::STATUS_PROCESSED`, so the UI's
existing (previously dead) error-callback path actually fires.

## Config

Admin → gateway settings for Paystack: Secret Key, Public Key
(`sk_test_.../pk_test_...` for sandbox, `sk_live_.../pk_live_...` for
production), and a Sandbox/Test Mode checkbox. No `auto_redirect` field —
that's gone now that it's unconditional (see above).

## Known gaps / things to watch

- **`composer dump-autoload` must be re-run (by hand — see below) whenever
  a new file is added under `library/Payment/Adapter/`.** Hit live
  (2026-10-17): `library/Payment/Adapter/Paystack.php` was added back in
  July but never made it into `vendor/composer/autoload_static.php` /
  `autoload_classmap.php`'s baked `$classMap`, so
  `class_exists('Payment_Adapter_Paystack')` failed — but *only* for the
  one-click payment code (`Invoice/Api/Client.php`'s
  `\Payment_Adapter_Paystack::ensureSavedCardTableExists(...)` static
  calls), which reference the class directly. Regular Paystack checkout
  never hit this, because `ServicePayGateway::getAdapterClassName()`
  already self-heals with a `require_once` fallback when `class_exists()`
  fails first. No `composer.json` is tracked in this repo (predates the
  git-based deploy setup — see `DEPLOYMENT.md`), so `composer
  dump-autoload` can't be run normally here; the missing classmap entry
  was added by hand to both generated files, in the same form Composer
  itself produces. `Invoice/Api/Client.php` also now has its own
  `ensurePaystackAdapterLoaded()` `require_once` fallback (mirroring
  `getAdapterClassName()`'s pattern) so this specific code path can't
  break the same way again even if the classmap drifts a second time —
  but any *other* new adapter file added the same way would still need
  the classmap entry added by hand, or a real `composer dump-autoload`
  run somewhere that has a `composer.json`.
- No dedicated unit test file for this adapter (`Paystack*Test.php` doesn't
  exist). Changes here are only as safe as manual/E2E testing catches.
- Full payment completion (a real charge through Paystack's hosted
  checkout, OTP/card entry) can't be automated via simple HTTP requests —
  every round of testing this adapter has gone up to "invoice initializes
  correctly and redirects" and stopped there. If you need to verify a
  charge actually completes and flips an invoice to `paid`, that's a manual
  browser test with Paystack test-mode keys and their documented test card
  numbers.

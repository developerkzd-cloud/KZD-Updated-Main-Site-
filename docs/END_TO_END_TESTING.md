# Phase 9 — End-to-End Testing

Run 2026-08-10, against local dev (`fossbilling.test`) unless noted. Tested via
real HTTP requests against FOSSBilling's actual API (session cookies, CSRF
tokens, the works) plus direct database verification of each step's effect —
not just code review. No browser was available in this environment, so pure
visual/CSS correctness wasn't verified here; that needs a manual pass
separately.

## Summary

| Flow | Result |
|---|---|
| New customer: website → hosting purchase → registration → checkout → payment → invoice → dashboard | ✅ Pass |
| Domain registration | ⚠️ Blocked locally (see below) — needs manual confirmation on the live site |
| Domain transfer | ⚠️ Blocked locally (see below) — needs manual confirmation on the live site |
| Returning customer (login → see existing service) | ✅ Pass |
| Support ticket — client | ✅ Pass |
| Support ticket — guest | ✅ Pass |
| Administrator workflow (view/manage order, client, ticket) | ✅ Pass |
| Business Email ordering | ✅ Pass |

## Detail

### New customer journey — PASS

`GET /order?product=2` → `POST cart/add_item` → `POST client/create` (new
account) → cart persisted correctly through registration → `POST
cart/checkout` → order + invoice created correctly (verified in DB: order
`client_id`/`product_id`/`status` correct, invoice `unpaid`/`ZAR`/linked to
the right client) → payment page (`/invoice/banklink/...`) correctly renders
the Paystack auto-redirect fix (vanilla JS, not the old broken jQuery) → new
order visible on the client dashboard immediately after registration.

**Not tested:** actually completing the Paystack charge. That requires
interactive card entry/OTP through Paystack's own checkout page, which is
outside what can be driven via curl. Confirmed test-mode keys (`sk_test_`)
are configured, so this is safe to test manually.

**Incidental finding, not a bug:** registering with `@example.com` was
correctly rejected ("Email address is invalid") — FOSSBilling does real
DNS/MX validation on the email domain, and `example.com` has no mail
server. Working as intended; just don't use that domain for manual testing
either.

### Domain registration / transfer — BLOCKED (environmental, not a bug)

Every registrar API call (`servicedomain/check`, registration, transfer)
failed with:

> HostAfrica error: "You cannot perform this action as your server's IP
> address is not on the whitelist. Your IP is: 41.114.48.54"

This is HostAfrica's reseller API only trusting specific whitelisted server
IPs (presumably the production server's IP, not local dev machines) — a
real security feature working correctly, not a defect. **Consequence:**
domain registration and transfer cannot be meaningfully tested from local
dev at all. This needs to be tested directly on the live site
(`kzdsolutions.co.za` → domain search → register/transfer a real or
disposable-cost test domain) since that's the only environment with a
whitelisted IP.

The EPP/transfer-code prefill from the website's `?epp=` query param is
client-side JavaScript (reads `URLSearchParams` after page load) — verified
correct via code review (`themes/kzd/html_custom/mod_servicedomain_order_form.html.twig`),
but not independently testable via curl since curl doesn't execute JS.

### Returning customer — PASS

Fresh login session (separate cookie jar, simulating a new browser)
correctly authenticated and immediately showed the existing order on the
dashboard, plus direct access to `/order/service/manage/{id}` for that
order.

### Support tickets — PASS

Client-side: `ticket_create` → `ticket_reply` both succeeded; verified via
`ticket_get` that both messages are present. Guest-side: `guest_tickets_enabled`
returns true, and an unauthenticated `ticket_create` succeeded and returned
a valid ticket hash.

### Administrator workflow — PASS

Local dev admin password was temporarily reset for this test (see note to
project owner — needs to be changed back). Confirmed: admin login works,
admin dashboard loads, and admin can see and act on everything created
during this test run — the new order, the new client, and the support
ticket (including posting a reply as staff).

### Business Email ordering — PASS

`cart/add_item` for both Business Email (id 6, R79) and Premium Business
Email (id 7, R149) succeed and reflect the correct price in the cart. Matches
the earlier live-site confirmation that the "GET STARTED" buttons on
hosting.html correctly route to `my.kzdsolutions.co.za/order?product=6/7`.

## Recommendations

1. **Manually verify domain registration/transfer on the live site** — this
   is the one flow this testing pass genuinely could not cover. Use a cheap
   or already-owned test domain.
2. **Manually complete one real Paystack test-mode payment** end-to-end (the
   only piece of the purchase flow not exercised here) to confirm the
   invoice actually flips to `paid` and the order activates.
3. Test data created on local dev during this run (client id 3 `Phase9
   Tester`, order id 10, invoice id 14, tickets id 3 and one guest ticket)
   was left in place rather than deleted — safe to clean up or ignore, it's
   local dev only.
4. The admin password on local dev was changed during testing — reset it to
   whatever you'd like.

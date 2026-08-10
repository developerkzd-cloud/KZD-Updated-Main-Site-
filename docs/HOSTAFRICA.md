# HostAfrica Registrar Adapter

`library/Registrar/Adapter/Hostafrica.php` — full custom adapter for
HostAfrica's reseller domain API. Doesn't exist in stock FOSSBilling.

## ⚠️ IP whitelist requirement — the thing that will confuse you

HostAfrica's reseller API only accepts requests from **whitelisted server
IPs**. Confirmed directly: every domain lookup/registration/transfer call
from a local dev machine fails with:

> HostAfrica error: "You cannot perform this action as your server's IP
> address is not on the whitelist. Your IP is: {whatever the dev machine's
> public IP is}"

This means **domain features cannot be meaningfully tested from local dev
at all** — not a bug, this is HostAfrica's own security control, presumably
scoped to the production server's IP only. Any change to this adapter, or
to anything downstream of it (order flow, pricing display), needs to be
verified on the live site, not local dev. Budget for that when planning
registrar-adapter work — you can't iterate-and-test locally the way you can
with everything else in this codebase.

## What's customized

- Order-time `emailforwarding` add-on is deliberately **disabled** (`0`,
  not `1`) — see `_getCreateDomainParams()` or wherever the order payload
  is built. HostAfrica's docs indicate enabling this at order time triggers
  a paid add-on automatically; the intent is to let clients opt in
  separately via `enablePrivacyProtection()`-style calls later if they want
  it, not bill them for it by default. **Don't re-enable this without
  checking why it was disabled** — it was a deliberate anti-surprise-billing
  decision, not an oversight.
- `_isSuccess()` has an inline comment flagging it as unverified — HostAfrica's
  docs don't document their error response envelope shape, so this method's
  correctness for edge-case error formats hasn't been confirmed against
  real failure responses beyond what's been seen in practice.
- `_makeRequest()` logs the full raw API response body at `info` level on
  every call. Worth periodically checking this doesn't end up logging
  anything sensitive (auth tokens, customer PII) into `data/log/` — it
  hasn't been audited specifically for that.

## Line endings — a deploy gotcha, not a code issue

During the first production deploy of changes touching this file, `git
diff` against the server's copy showed the *entire file* as changed —
every line removed and re-added. This wasn't a real content difference:
confirmed via `git diff -w` (ignore-whitespace) coming back completely
empty, and `file` reporting CRLF line terminators on the server's copy vs.
LF in git. The server's whole codebase had been manually uploaded via
FTP/file manager at some point with Windows line endings, unrelated to any
actual customization. Harmless, but expect to see this kind of noise on any
file that predates the git-based deploy setup (`DEPLOYMENT.md`) — check
with `git diff -w` before assuming a real conflict.

## Known gaps

- Error handling relies on the (undocumented) HostAfrica error envelope
  shape holding steady — see the `_isSuccess()` note above.

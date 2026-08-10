# OpenProvider Registrar Adapter

`library/Registrar/Adapter/OpenProvider.php` + `OpenProvider/API.php` —
full custom adapter for OpenProvider's domain API. Doesn't exist in stock
FOSSBilling.

## Status

Installed and functioning for standard registrar operations — real API
calls throughout, proper try/catch around each one. The various `return
false` statements scattered through the file are genuine failure branches
after a live request came back unsuccessful, not stubs or unimplemented
methods.

## Known gap: `getTlds()` returns empty

`getTlds()` just `return []` — it doesn't actually query OpenProvider for
their supported TLD list. Practical effect: an admin setting up TLD pricing
for OpenProvider specifically can't use FOSSBilling's auto-populate-from-registrar
feature and has to enter TLDs manually. Low priority in practice because
**HostAfrica is the primary registrar for this project** (see
`HOSTAFRICA.md`) — OpenProvider appears to be a secondary/backup option.
Worth implementing properly if OpenProvider ever becomes the primary path.

## Relationship to HostAfrica

Two registrar adapters exist for redundancy/coverage, not because domains
are split by TLD or region between them — check current admin configuration
to see which registrar is actually active for which TLDs before assuming.

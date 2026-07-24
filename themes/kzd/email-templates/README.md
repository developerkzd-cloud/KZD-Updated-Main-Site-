# KZD Solutions branded email templates

FOSSBilling stores email template content in the `email_template` database
table (`content`/`subject` columns), not in files — the `.twig` files under
each module's `templates/email/` folder are only the factory-default seed
content. These files are a **version-controlled backup/reference** of what
was pushed into the database for the following action codes:

- `mod_client_signup` — welcome email
- `mod_client_confirm` — email address verification
- `mod_client_password_reset_request` — password reset link
- `mod_client_password_reset_information` — password changed confirmation
- `mod_invoice_created` — invoice created
- `mod_invoice_paid` — payment received / receipt
- `mod_support_ticket_open` — support ticket opened confirmation
- `mod_support_ticket_staff_reply` — staff replied to ticket

## Important: `guest.system_company` has a reduced key set in email context

Unlike the theme templates (which get the full company settings array), the
sandboxed email renderer only exposes:
`www, name, signature, logo_url, logo_url_dark, favicon_url,
display_bank_info, bank_info_pagebottom, note, privacy_policy, tos`.

`email`, `tel`, `address_*`, `account_number`, `bank_name`, `bic`,
`vat_number` are **not available** — referencing them throws a template
rendering error at send time. Confirmed by triggering a real password-reset
send through the running app.

## To re-apply after a database reset

Run each file's content through an `UPDATE email_template SET content = ?
WHERE action_code = ?` (see the admin Email Templates screen, or a small PDO
script). Setting `is_overridden = 1` keeps FOSSBilling's own "using default
vs. customized" tracking accurate.

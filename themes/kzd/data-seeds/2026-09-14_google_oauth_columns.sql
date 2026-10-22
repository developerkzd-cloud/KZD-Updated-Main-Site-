-- Google Sign-In: new `client` column to link a FOSSBilling account to a
-- Google account.
--
-- FOSSBilling 0.8.5 runs RedBean in frozen mode (db.freeze defaults to
-- true, not overridden in config.php) and this project has no migrations
-- framework, so schema changes are applied manually per environment --
-- see docs/DEPLOYMENT.md "Applying database changes".
--
-- `google_sub` stores Google's stable, non-reusable "subject" identifier
-- (the `sub` claim from Google's userinfo/ID token response) -- NOT the
-- client's email. Email can change or be reused by a different Google
-- account over time; `sub` never does, so it's the only safe value to use
-- as the actual authentication key once an account is linked. Existing
-- clients are unaffected: this column defaults to NULL (no Google account
-- linked) for every pre-existing row.
--
-- Apply:   mysql -u <user> -p <database> < 2026-09-14_google_oauth_columns.sql
-- Or run only the UP block manually if you prefer to review each
-- statement first.

-- ============================= UP =============================

ALTER TABLE `client`
    ADD COLUMN `google_sub` VARCHAR(255) NULL DEFAULT NULL
        COMMENT 'Google account subject identifier (OpenID "sub" claim) linked to this client, if any. Never the email -- see migration header.',
    ADD UNIQUE INDEX `idx_client_google_sub` (`google_sub`);

-- ============================ DOWN ============================
-- Reverse this migration (destructive -- drops the column and any data in
-- it, unlinking every client that used Google sign-in):
--
-- ALTER TABLE `client`
--     DROP INDEX `idx_client_google_sub`,
--     DROP COLUMN `google_sub`;

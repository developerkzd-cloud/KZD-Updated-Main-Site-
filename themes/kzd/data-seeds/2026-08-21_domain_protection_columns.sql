-- Domain Protection & Privacy add-on: new service_domain columns.
--
-- FOSSBilling 0.8.5 runs RedBean in frozen mode (db.freeze defaults to
-- true, not overridden in config.php) and this project has no migrations
-- framework, so schema changes are applied manually per environment --
-- see docs/DEPLOYMENT.md "Applying database changes".
--
-- Existing domains are unaffected: protection_purchased defaults to 0
-- (not purchased) and protection_registrar_status defaults to NULL
-- (unknown) for every pre-existing row, per spec Part 16.
--
-- Apply:   mysql -u <user> -p <database> < 2026-08-21_domain_protection_columns.sql
-- Or run only the UP block manually if you prefer to review each
-- statement first.

-- ============================= UP =============================

ALTER TABLE `service_domain`
    ADD COLUMN `protection_purchased` TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'Customer has an active/paid Domain Protection & Privacy add-on order for this domain (billing truth, independent of registrar state)',
    ADD COLUMN `protection_order_id` INT NULL DEFAULT NULL
        COMMENT 'client_order.id of the linked Domain Protection & Privacy add-on order, if any',
    ADD COLUMN `protection_registrar_status` VARCHAR(20) NULL DEFAULT NULL
        COMMENT 'Registrar-confirmed privacy activation outcome: active, failed, or NULL/unknown (never inferred, only set after a real adapter call)';

-- ============================ DOWN ============================
-- Reverse this migration (destructive -- drops the three columns and
-- any data in them):
--
-- ALTER TABLE `service_domain`
--     DROP COLUMN `protection_purchased`,
--     DROP COLUMN `protection_order_id`,
--     DROP COLUMN `protection_registrar_status`;

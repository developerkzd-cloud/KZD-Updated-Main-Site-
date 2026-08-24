<?php
// Switches the 2 Business Email products (Business Email / Premium
// Business Email, ids 6-7) from type=custom to type=hosting, using the
// exact same mechanism as themes/kzd/data-seeds/configure_hosting_plans.php
// did for the 4 Shared Hosting plans -- see docs/CUSTOMIZATIONS.md
// ("Business Email DirectAdmin automation") for the full reasoning.
//
// DirectAdmin has no "mailbox-only" account type -- a mailbox always
// lives inside a DirectAdmin User account tied to a domain. So this
// creates 2 minimal Hosting Plans (small quota, hosting features like
// PHP/CGI/website hosting turned off, `max_pop` set to the advertised
// mailbox counts) rather than building a separate mailbox-creation API.
// The client creates their own named mailboxes (info@, sales@, etc.)
// through DirectAdmin's own built-in "Email Accounts" screen, reached via
// the same "Login to Control Panel" SSO button that ships automatically
// once type=hosting is set (modules/Servicehosting/templates/client/mod_servicehosting_manage.html.twig).
//
// IMPORTANT: only affects orders created AFTER this script runs --
// client_order.service_type is frozen at order-creation time, so
// existing Business Email orders keep working under Servicecustom
// exactly as before.
//
// Idempotent -- safe to re-run. Run once: php configure_email_hosting_plans.php

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fossbilling_v085;charset=utf8mb4', 'root', 'root');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

const DIRECTADMIN_SERVER_ID = 1; // "HostAfrica Reseller" -- service_hosting_server

// Quota (mail storage) isn't a specific advertised number on the site
// copy ("Larger Mail Storage" for Premium is qualitative, not a GB
// figure) -- these are reasonable defaults for email-only accounts, not
// a marketing commitment. max_pop (mailbox count) IS advertised exactly.
// No websites/FTP/databases/subdomains -- these are email-only accounts,
// not general hosting.
$plans = [
    ['product_id' => 6, 'name' => 'Business Email',         'quota' => '5120',  'max_pop' => 25],
    ['product_id' => 7, 'name' => 'Premium Business Email',  'quota' => '10240', 'max_pop' => 100],
];

// Hosting features (PHP/CGI/website hosting) turned off -- these accounts
// exist for email, not for hosting a site. SSL stays on for secure
// webmail access. Spam filtering on, matching what's advertised.
$commonConfig = json_encode([
    'php' => '0',
    'ssl' => '1',
    'cgi' => '0',
    'dnscontrol' => '1',
    'cron' => '0',
    'spam' => '1',
]);

$findHp = $pdo->prepare('SELECT id FROM service_hosting_hp WHERE name = :name');
$insertHp = $pdo->prepare(
    'INSERT INTO service_hosting_hp
        (name, quota, bandwidth, max_ftp, max_sql, max_pop, max_sub, max_park, max_addon, config, created_at, updated_at)
     VALUES
        (:name, :quota, "unlimited", 0, 0, :max_pop, 0, 0, 0, :config, NOW(), NOW())'
);
$updateHp = $pdo->prepare(
    'UPDATE service_hosting_hp SET
        quota = :quota, bandwidth = "unlimited", max_ftp = 0, max_sql = 0,
        max_pop = :max_pop, max_sub = 0, max_park = 0, max_addon = 0,
        config = :config, updated_at = NOW()
     WHERE id = :id'
);
$updateProduct = $pdo->prepare('UPDATE product SET type = "hosting", config = :config WHERE id = :id');

foreach ($plans as $plan) {
    $findHp->execute(['name' => $plan['name']]);
    $hpId = $findHp->fetchColumn();

    $params = [
        'quota' => $plan['quota'],
        'max_pop' => $plan['max_pop'],
        'config' => $commonConfig,
    ];

    if ($hpId) {
        $updateHp->execute($params + ['id' => $hpId]);
        echo "Updated hosting plan '{$plan['name']}' -> Hp id {$hpId}\n";
    } else {
        $insertHp->execute($params + ['name' => $plan['name']]);
        $hpId = (int) $pdo->lastInsertId();
        echo "Created hosting plan '{$plan['name']}' -> Hp id {$hpId}\n";
    }

    $productConfig = json_encode([
        'server_id' => DIRECTADMIN_SERVER_ID,
        'hosting_plan_id' => (int) $hpId,
    ]);
    $updateProduct->execute(['config' => $productConfig, 'id' => $plan['product_id']]);
    echo "Product #{$plan['product_id']}: type=hosting, hosting_plan_id={$hpId}, server_id=" . DIRECTADMIN_SERVER_ID . "\n";
}

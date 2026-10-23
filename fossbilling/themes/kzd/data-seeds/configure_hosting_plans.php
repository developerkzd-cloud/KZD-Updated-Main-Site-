<?php
// Switches the 4 Shared Hosting products (Starter/Basic/Standard/Business,
// ids 2-5) from type=custom to type=hosting, so FOSSBilling automatically
// creates/suspends/unsuspends/cancels a real DirectAdmin account on order
// activation instead of requiring manual account setup, and the client
// area gets a one-click "Login to Control Panel" SSO button
// (modules/Servicehosting/templates/client/mod_servicehosting_manage.html.twig
// -- stock, ships as soon as type=hosting is set, no template work needed).
//
// Business Email (ids 6-7) is untouched -- stays type=custom with the
// domain-association flow already shipped.
//
// Creates one `service_hosting_hp` (Hosting Plan) row per product,
// resource limits matching what's advertised on hosting.html. No
// DirectAdmin package needs to pre-exist on the server: if the plan name
// doesn't match a real DirectAdmin package, Directadmin.php::createAccount()
// automatically falls back to sending these exact custom resource values
// instead (see docs/CUSTOMIZATIONS.md).
//
// IMPORTANT: this only affects orders created AFTER this script runs.
// client_order.service_type is frozen at order-creation time (verified
// this session), so existing/past hosting orders keep working under
// Servicecustom exactly as before -- nothing retroactive.
//
// Idempotent -- safe to re-run: updates the Hp row + product config if a
// plan with the same name already exists, rather than duplicating it.
//
// Run once: php configure_hosting_plans.php

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fossbilling_v085;charset=utf8mb4', 'root', 'root');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

const DIRECTADMIN_SERVER_ID = 1; // "HostAfrica Reseller" -- service_hosting_server

// max_addon = addon domains BEYOND the account's own primary domain, so
// the advertised "Websites" count (which already includes the primary
// domain the account is created under) is reduced by 1.
$plans = [
    ['product_id' => 2, 'name' => 'Starter Hosting',  'quota' => '2048',  'max_addon' => 0, 'max_sub' => 5,  'max_pop' => 10, 'max_ftp' => 2,  'max_sql' => 5],
    ['product_id' => 3, 'name' => 'Basic Hosting',    'quota' => '4096',  'max_addon' => 1, 'max_sub' => 7,  'max_pop' => 15, 'max_ftp' => 5,  'max_sql' => 10],
    ['product_id' => 4, 'name' => 'Standard Hosting', 'quota' => '7168',  'max_addon' => 4, 'max_sub' => 9,  'max_pop' => 25, 'max_ftp' => 10, 'max_sql' => 20],
    ['product_id' => 5, 'name' => 'Business Hosting', 'quota' => '15360', 'max_addon' => 9, 'max_sub' => 15, 'max_pop' => 50, 'max_ftp' => 20, 'max_sql' => 50],
];

// Bandwidth isn't a distinguishing spec on the current site copy --
// defaulting all 4 plans to unlimited (DirectAdmin convention), not a
// specific advertised number.
//
// Values must be strings, not booleans: Server_Package::getCustomValue()
// (library/Server/Package.php) is strictly typed `?string` -- a stored
// boolean throws a TypeError the moment Directadmin.php's
// getCustomPackageFields() reads it back (`$package->getCustomValue('cgi') ? 'ON' : 'OFF'`
// still needs a real string to satisfy the getter's own return type).
$commonConfig = json_encode([
    'php' => '1',
    'ssl' => '1',
    'cgi' => '1',
    'dnscontrol' => '1',
    'cron' => '1',
    'spam' => '1',
]);

$findHp = $pdo->prepare('SELECT id FROM service_hosting_hp WHERE name = :name');
$insertHp = $pdo->prepare(
    'INSERT INTO service_hosting_hp
        (name, quota, bandwidth, max_ftp, max_sql, max_pop, max_sub, max_park, max_addon, config, created_at, updated_at)
     VALUES
        (:name, :quota, "unlimited", :max_ftp, :max_sql, :max_pop, :max_sub, 0, :max_addon, :config, NOW(), NOW())'
);
$updateHp = $pdo->prepare(
    'UPDATE service_hosting_hp SET
        quota = :quota, bandwidth = "unlimited", max_ftp = :max_ftp, max_sql = :max_sql,
        max_pop = :max_pop, max_sub = :max_sub, max_park = 0, max_addon = :max_addon,
        config = :config, updated_at = NOW()
     WHERE id = :id'
);
$updateProduct = $pdo->prepare('UPDATE product SET type = "hosting", config = :config WHERE id = :id');

foreach ($plans as $plan) {
    $findHp->execute(['name' => $plan['name']]);
    $hpId = $findHp->fetchColumn();

    $params = [
        'quota' => $plan['quota'],
        'max_ftp' => $plan['max_ftp'],
        'max_sql' => $plan['max_sql'],
        'max_pop' => $plan['max_pop'],
        'max_sub' => $plan['max_sub'],
        'max_addon' => $plan['max_addon'],
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

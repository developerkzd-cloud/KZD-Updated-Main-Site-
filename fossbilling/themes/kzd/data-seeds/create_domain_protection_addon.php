<?php
// Creates the "Domain Protection & Privacy" add-on product (R99/year,
// annual billing only) and attaches it to the domain product (id 1,
// "Domains registration and transfer") as an available add-on, so the
// optional checkbox appears on the domain order form's Register and
// Transfer tabs via FOSSBilling's existing generic addon UI
// (modules/Orderbutton/templates/client/mod_orderbutton_addons.html.twig).
//
// Defaults to unchecked at checkout -- that's the addon UI's own default,
// not something this script configures.
//
// Requires the schema migration to already be applied:
// 2026-08-21_domain_protection_columns.sql
//
// Run once: php create_domain_protection_addon.php
// Safe to re-run: skips creation if a product with this title already
// exists, and always re-syncs the domain product's `addons` list to
// include it.

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fossbilling_v085;charset=utf8mb4', 'root', 'root');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

const DOMAIN_PRODUCT_ID = 1; // FOSSBilling's own seeded "Domains registration and transfer" product.
const ADDON_TITLE = 'Domain Protection & Privacy';
const ADDON_SLUG = 'domain-protection-privacy';
const ADDON_PRICE = 99; // R99/year -- editable afterwards from Admin -> Products, per spec Part 2.

$findStmt = $pdo->prepare('SELECT id FROM product WHERE title = :title');
$findStmt->execute(['title' => ADDON_TITLE]);
$addonId = $findStmt->fetchColumn();

if ($addonId) {
    echo "'" . ADDON_TITLE . "' already exists -> product id {$addonId} (skipping creation)\n";
} else {
    $insertPayment = $pdo->prepare(
        'INSERT INTO product_payment
            (type, once_price, once_setup_price, w_price, m_price, q_price, b_price, a_price, bia_price, tria_price,
             w_enabled, m_enabled, q_enabled, b_enabled, a_enabled, bia_enabled, tria_enabled)
         VALUES
            ("recurrent", 0, 0, 0, 0, 0, 0, :a_price, 0, 0,
             0, 0, 0, 0, 1, 0, 0)'
    );
    $insertPayment->execute(['a_price' => ADDON_PRICE]);
    $paymentId = (int) $pdo->lastInsertId();

    $description = 'Optional. Protect your domain and privacy by hiding your WHOIS contact '
        . 'details from public lookup.';

    // hidden = 1: not independently browsable/orderable as a standalone
    // product -- only offered as an addon on the domain product, per
    // findEnabledAddonById() in modules/Product/Repository/ProductRepository.php
    // which requires type='custom' + is_addon=1 (not hidden=0).
    $insertProduct = $pdo->prepare(
        'INSERT INTO product
            (product_payment_id, title, slug, description, unit, active, status, hidden, is_addon, setup, type, priority, created_at, updated_at)
         VALUES
            (:payment_id, :title, :slug, :description, "product", 1, "enabled", 1, 1, "after_payment", "custom", 1, NOW(), NOW())'
    );
    $insertProduct->execute([
        'payment_id' => $paymentId,
        'title' => ADDON_TITLE,
        'slug' => ADDON_SLUG,
        'description' => $description,
    ]);
    $addonId = (int) $pdo->lastInsertId();

    echo 'Created ' . ADDON_TITLE . " -> product id {$addonId} (payment id {$paymentId})\n";
}

$addonId = (int) $addonId;

$domainStmt = $pdo->prepare('SELECT addons FROM product WHERE id = :id');
$domainStmt->execute(['id' => DOMAIN_PRODUCT_ID]);
$existingAddons = json_decode((string) ($domainStmt->fetchColumn() ?: '[]'), true);
if (!is_array($existingAddons)) {
    $existingAddons = [];
}

if (!in_array($addonId, $existingAddons, true)) {
    $existingAddons[] = $addonId;
    $pdo->prepare('UPDATE product SET addons = :addons WHERE id = :id')
        ->execute([
            'addons' => json_encode(array_values($existingAddons)),
            'id' => DOMAIN_PRODUCT_ID,
        ]);
    echo "Attached addon {$addonId} to domain product " . DOMAIN_PRODUCT_ID . "\n";
} else {
    echo "Domain product " . DOMAIN_PRODUCT_ID . " already lists addon {$addonId}\n";
}

echo "\nDomain Protection & Privacy addon product id: {$addonId}\n";
echo "Set this as the 'protection addon product id' module setting (see Servicedomain\\Service).\n";

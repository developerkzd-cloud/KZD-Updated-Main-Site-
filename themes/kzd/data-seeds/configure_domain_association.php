<?php
// Enables domain association at checkout for the Shared Hosting plans
// (optional -- customer may skip) and Business Email plans (required --
// email needs a domain to attach to). Uses the domain-association
// capability added to modules/Servicecustom/Service.php, rendered by
// themes/kzd/html_custom/mod_servicecustom_order_form.html.twig. See
// docs/CUSTOMIZATIONS.md for the full design.
//
// Idempotent -- safe to re-run, always overwrites product.config for the
// listed IDs with the values below (doesn't merge with anything else
// that might be there, since these products currently have no other
// config keys set).
//
// Run once: php configure_domain_association.php

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fossbilling_v085;charset=utf8mb4', 'root', 'root');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Product IDs per themes/kzd/data-seeds/README.md's "Current mapping" notes.
$hostingProductIds = [2, 3, 4, 5]; // Starter, Basic, Standard, Business Hosting
$businessEmailProductIds = [6, 7]; // Business Email, Premium Business Email

$hostingConfig = json_encode([
    'domain_association' => 'optional',
    'allow_domain_register' => true,
    'allow_domain_transfer' => true,
    'allow_domain_own' => true,
]);

$emailConfig = json_encode([
    'domain_association' => 'required',
    'allow_domain_register' => true,
    'allow_domain_transfer' => true,
    'allow_domain_own' => true,
]);

$update = $pdo->prepare('UPDATE product SET config = :config WHERE id = :id');

foreach ($hostingProductIds as $id) {
    $update->execute(['config' => $hostingConfig, 'id' => $id]);
    echo "Product #{$id}: domain_association = optional\n";
}

foreach ($businessEmailProductIds as $id) {
    $update->execute(['config' => $emailConfig, 'id' => $id]);
    echo "Product #{$id}: domain_association = required\n";
}

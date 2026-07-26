<?php
// One-click payment: stores a reusable Paystack authorization per client so
// a later payment can be charged directly (POST /transaction/charge_authorization)
// instead of redirecting to Paystack's hosted checkout page again.
//
// One row per (client_id, gateway) -- a new successful reusable charge
// overwrites the previous saved card for that gateway. Run once:
//   php create_client_saved_card_table.php

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fossbilling_v085;charset=utf8mb4', 'root', 'root');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS client_saved_card (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        client_id INT UNSIGNED NOT NULL,
        gateway VARCHAR(50) NOT NULL,
        authorization_code VARCHAR(191) NOT NULL,
        email VARCHAR(191) NOT NULL,
        card_type VARCHAR(50) DEFAULT NULL,
        last4 VARCHAR(4) DEFAULT NULL,
        exp_month VARCHAR(2) DEFAULT NULL,
        exp_year VARCHAR(4) DEFAULT NULL,
        bank VARCHAR(100) DEFAULT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uniq_client_gateway (client_id, gateway),
        KEY idx_client (client_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);

echo "client_saved_card table ready.\n";
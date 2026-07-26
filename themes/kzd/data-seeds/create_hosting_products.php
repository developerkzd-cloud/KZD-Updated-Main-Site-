<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fossbilling_v085;charset=utf8mb4', 'root', 'root');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$categoryId = 2; // Shared Hosting

$plans = [
    [
        'key' => 'hostingStarter',
        'slug' => 'hosting-starter',
        'title' => 'Starter',
        'price' => 99,
        'features' => [
            '5 GB SSD Storage',
            'DirectAdmin Control Panel',
            '1 Website',
            '5 Subdomains',
            'Free .co.za Domain (Annual Plans Only)',
            'Free SSL Certificate',
            '10 Email Accounts',
            '2 FTP Accounts',
            '5 MySQL Databases',
            'Weekly Backups',
            'Standard Support',
        ],
    ],
    [
        'key' => 'hostingBasic',
        'slug' => 'hosting-basic',
        'title' => 'Basic',
        'price' => 149,
        'features' => [
            '10 GB SSD Storage',
            'DirectAdmin Control Panel',
            '2 Websites',
            '7 Subdomains',
            'Free .co.za Domain (Annual Plans Only)',
            'Free SSL Certificate',
            '15 Email Accounts',
            '5 FTP Accounts',
            '10 MySQL Databases',
            'Weekly Backups',
            'Standard Support',
        ],
    ],
    [
        'key' => 'hostingStandard',
        'slug' => 'hosting-standard',
        'title' => 'Standard',
        'price' => 199,
        'features' => [
            '20 GB SSD Storage',
            'DirectAdmin Control Panel',
            '5 Websites',
            '9 Subdomains',
            'Free .co.za Domain (Annual Plans Only)',
            'Free SSL Certificate',
            '25 Email Accounts',
            '10 FTP Accounts',
            '20 MySQL Databases',
            'Weekly Backups',
            'Standard Support',
        ],
    ],
    [
        'key' => 'hostingBusiness',
        'slug' => 'hosting-business',
        'title' => 'Business',
        'price' => 249,
        'features' => [
            '50 GB SSD Storage',
            'DirectAdmin Control Panel',
            '10 Websites',
            '15 Subdomains',
            'Free .co.za Domain (Annual Plans Only)',
            'Free SSL Certificate',
            '50 Email Accounts',
            '20 FTP Accounts',
            '50 MySQL Databases',
            'Weekly Backups',
            'Priority Support',
        ],
    ],
];

$insertPayment = $pdo->prepare(
    'INSERT INTO product_payment
        (type, once_price, once_setup_price, w_price, m_price, q_price, b_price, a_price, bia_price, tria_price,
         w_enabled, m_enabled, q_enabled, b_enabled, a_enabled, bia_enabled, tria_enabled)
     VALUES
        ("recurrent", 0, 0, 0, :m_price, 0, 0, 0, 0, 0,
         0, 1, 0, 0, 0, 0, 0)'
);

$insertProduct = $pdo->prepare(
    'INSERT INTO product
        (product_category_id, product_payment_id, title, slug, description, unit, active, status, hidden, setup, type, priority, created_at, updated_at)
     VALUES
        (:category_id, :payment_id, :title, :slug, :description, "product", 1, "enabled", 0, "after_payment", "custom", :priority, NOW(), NOW())'
);

$results = [];
$priority = 1;
foreach ($plans as $plan) {
    $insertPayment->execute(['m_price' => $plan['price']]);
    $paymentId = (int) $pdo->lastInsertId();

    $description = "**" . $plan['title'] . " Hosting** - R" . $plan['price'] . "/month\n\n";
    foreach ($plan['features'] as $feature) {
        $description .= "- {$feature}\n";
    }
    $description .= "\n_Free .co.za domain included with annual hosting plans only._";

    $insertProduct->execute([
        'category_id' => $categoryId,
        'payment_id' => $paymentId,
        'title' => $plan['title'] . ' Hosting',
        'slug' => $plan['slug'],
        'description' => $description,
        'priority' => $priority++,
    ]);
    $productId = (int) $pdo->lastInsertId();

    $results[$plan['key']] = $productId;
    echo "Created {$plan['title']} Hosting -> product id {$productId} (payment id {$paymentId})\n";
}

echo "\nKZD.products mapping:\n";
foreach ($results as $key => $id) {
    echo "  {$key}: {$id}\n";
}

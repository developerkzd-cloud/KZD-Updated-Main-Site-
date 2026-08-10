<?php
// Creates the "Business Email" product category and its two email-only
// plans, per "KZD Solutions new pricing strategy - Updated Hosting
// Packages.docx" (Business Email Packages section). Monthly billing only --
// the source document doesn't specify annual/2-year pricing for these.
// Run once: php create_business_email_products.php

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fossbilling_v085;charset=utf8mb4', 'root', 'root');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$categoryStmt = $pdo->prepare('SELECT id FROM product_category WHERE title = :title');
$categoryStmt->execute(['title' => 'Business Email']);
$categoryId = $categoryStmt->fetchColumn();

if (!$categoryId) {
    $pdo->prepare('INSERT INTO product_category (title, created_at, updated_at) VALUES (:title, NOW(), NOW())')
        ->execute(['title' => 'Business Email']);
    $categoryId = (int) $pdo->lastInsertId();
}

$plans = [
    [
        'key' => 'businessEmail',
        'slug' => 'business-email',
        'title' => 'Business Email',
        'price' => 79,
        'features' => [
            'Professional Email',
            '25 Email Accounts',
            'Webmail Access',
            'Outlook Support',
            'Mobile Phone Support',
            'Spam Filtering',
            'Secure SSL Connections',
        ],
    ],
    [
        'key' => 'premiumBusinessEmail',
        'slug' => 'premium-business-email',
        'title' => 'Premium Business Email',
        'price' => 149,
        'features' => [
            '100 Email Accounts',
            'Larger Mail Storage',
            'Outlook Support',
            'Mobile Support',
            'Webmail',
            'Spam Protection',
            'DKIM & SPF Email Security',
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

    $description = '**' . $plan['title'] . '** - R' . $plan['price'] . "/month\n\n";
    foreach ($plan['features'] as $feature) {
        $description .= "- {$feature}\n";
    }

    $insertProduct->execute([
        'category_id' => $categoryId,
        'payment_id' => $paymentId,
        'title' => $plan['title'],
        'slug' => $plan['slug'],
        'description' => $description,
        'priority' => $priority++,
    ]);
    $productId = (int) $pdo->lastInsertId();

    $results[$plan['key']] = $productId;
    echo "Created {$plan['title']} -> product id {$productId} (payment id {$paymentId})\n";
}

echo "\nKZD.products mapping additions:\n";
foreach ($results as $key => $id) {
    echo "  {$key}: {$id}\n";
}

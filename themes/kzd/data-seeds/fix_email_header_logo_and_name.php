<?php
// Fixes the email header markup across all 19 rebranded customer-facing
// email templates (the 8 from the original branding pass + 11 from
// rebrand_service_emails.php). The header was an either/or:
//   {% if logo_url %}<img ...>{% else %}<strong>{{ company.name }}</strong>{% endif %}
// so with a logo configured (KZD Solutions has one), every email showed
// ONLY the logo image and never the company name text next to it.
// Fixed to show both together, matching the logo+name pattern already
// used on the admin login page and the client auth panel.
//
// Idempotent -- a plain string REPLACE keyed on the exact old snippet, so
// re-running this after it's already applied is a harmless no-op (the old
// snippet no longer matches). Safe to re-run.
//
// Edit the DB connection line below to match this environment, then:
//   php fix_email_header_logo_and_name.php

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fossbilling_v085;charset=utf8mb4', 'root', 'root');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$old = '{% if guest.system_company.logo_url %}<img src="{{ guest.system_company.logo_url }}" alt="{{ guest.system_company.name }}">{% else %}<strong>{{ guest.system_company.name }}</strong>{% endif %}';

$new = '{% if guest.system_company.logo_url %}<img src="{{ guest.system_company.logo_url }}" alt="{{ guest.system_company.name }}" style="height:36px;vertical-align:middle;margin-right:10px;">{% endif %}<strong style="font-size:18px;vertical-align:middle;">{{ guest.system_company.name }}</strong>';

$stmt = $pdo->prepare("SELECT id, action_code, content FROM email_template WHERE content LIKE :pattern");
$stmt->execute(['pattern' => '%' . str_replace(['%', '_'], ['\\%', '\\_'], $old) . '%']);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$update = $pdo->prepare('UPDATE email_template SET content = :content WHERE id = :id');
foreach ($rows as $row) {
    $update->execute([
        'content' => str_replace($old, $new, $row['content']),
        'id' => $row['id'],
    ]);
    echo "Fixed {$row['action_code']}\n";
}

echo count($rows) . " template(s) updated.\n";

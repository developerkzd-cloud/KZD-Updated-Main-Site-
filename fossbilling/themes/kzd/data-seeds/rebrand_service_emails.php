<?php
// Rebrands the 11 customer-facing lifecycle/reminder email templates
// (servicecustom_*, servicedomain_*, invoice_due_after, invoice_payment_reminder)
// to match the KZD Solutions visual system already used by the other 8
// branded templates. Safe to re-run -- it's a plain UPDATE, not an insert.
// Edit the DB connection line below to match this environment, then:
//   php rebrand_service_emails.php

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fossbilling_v085;charset=utf8mb4', 'root', 'root');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$css = <<<CSS
	<style type="text/css">
		body { margin:0; padding:0; background:#f4f5f9; font-family: Arial, Helvetica, sans-serif; font-size:15px; color:#1f1f1f; }
		.email-wrapper { max-width:560px; margin:0 auto; padding:32px 16px; }
		.email-card { background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5e7eb; }
		.email-header { padding:28px 32px; border-bottom:1px solid #e5e7eb; }
		.email-header img { height:36px; }
		.email-body { padding:32px; }
		.email-body h1 { font-size:20px; font-weight:700; color:#000d51; margin:0 0 16px; }
		.email-body p { margin:0 0 14px; line-height:1.6; }
		.email-body ul.info-list { list-style:none; margin:0 0 20px; padding:16px 20px; background:#f7f8fc; border-radius:10px; }
		.email-body ul.info-list li { padding:4px 0; }
		.email-btn { display:inline-block; background:#2946f3; color:#ffffff !important; text-decoration:none; padding:12px 28px; border-radius:999px; font-weight:600; margin:8px 0 20px; }
		.email-footer { padding:24px 32px; background:#f7f8fc; border-top:1px solid #e5e7eb; }
		.email-footer .signature { font-style:italic; color:#6b7280; margin-bottom:12px; }
		.email-footer .company { color:#6b7280; font-size:12px; line-height:1.6; }
		a { color:#2946f3; }
	</style>
CSS;

function wrap(string $css, string $body): string
{
    return <<<HTML
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
{$css}
</head>
<body>
	<div class="email-wrapper">
		<div class="email-card">
			<div class="email-header">
				{% if guest.system_company.logo_url %}<img src="{{ guest.system_company.logo_url }}" alt="{{ guest.system_company.name }}" style="height:36px;vertical-align:middle;margin-right:10px;">{% endif %}<strong style="font-size:18px;vertical-align:middle;">{{ guest.system_company.name }}</strong>
			</div>
			<div class="email-body">
{$body}
			</div>
			<div class="email-footer">
				<div class="signature">{{ guest.system_email.signature }}</div>
				<div class="company">{{ guest.system_company.name }}<br>&copy; {{ "now"|date("Y") }} {{ guest.system_company.name }}. {{ 'All rights reserved.'|trans }}</div>
			</div>
		</div>
	</div>
</body>
</html>
HTML;
}

$templates = [];

$templates['mod_servicecustom_activated'] = wrap($css, <<<'BODY'
				<h1>{{ 'Your Service Is Now Active'|trans }}</h1>
				<p>{{ 'Hello'|trans }} {{ c.first_name|default('') }} {{ c.last_name|default('') }},</p>
				<p>{{ 'Your'|trans }} <strong>{{ order.title|default('') }}</strong> {{ 'is now activated.'|trans }}</p>
				<a class="email-btn" href="{{ 'login'|url(query: { 'email': c.email|default('') }, area: 'client') }}" target="_blank">{{ 'Log In'|trans }}</a>
				<p><a href="{{ 'client/profile'|url(area: 'client') }}" target="_blank">{{ 'Edit your profile'|trans }}</a></p>
BODY);

$templates['mod_servicecustom_suspended'] = wrap($css, <<<'BODY'
				<h1>{{ 'Service Suspended'|trans }}</h1>
				<p>{{ 'Hello'|trans }} {{ c.first_name|default('') }} {{ c.last_name|default('') }},</p>
				<p>{{ 'Your'|trans }} <strong>{{ order.title|default('') }}</strong>, {{ 'activated on'|trans }} <strong>{{ order.activated_at|default('')|format_date }}</strong>, {{ 'is now suspended.'|trans }}</p>
				{% if order.reason|default('') %}
				<ul class="info-list">
					<li><strong>{{ 'Reason'|trans }}:</strong> {{ order.reason|default('') }}</li>
				</ul>
				{% endif %}
				<p>{{ 'If you have any questions regarding this, please log in and submit a support ticket.'|trans }}</p>
				<a class="email-btn" href="{{ 'login'|url(query: { 'email': c.email|default('') }, area: 'client') }}" target="_blank">{{ 'Log In'|trans }}</a>
				<p><a href="{{ 'support'|url(query: { 'ticket' : 1 }, area: 'client') }}" target="_blank">{{ 'Submit a support ticket'|trans }}</a></p>
BODY);

$templates['mod_servicecustom_canceled'] = wrap($css, <<<'BODY'
				<h1>{{ 'Service Canceled'|trans }}</h1>
				<p>{{ 'Hello'|trans }} {{ c.first_name|default('') }} {{ c.last_name|default('') }},</p>
				<p>{{ 'Your'|trans }} <strong>{{ order.title|default('') }}</strong>, {{ 'activated on'|trans }} <strong>{{ order.activated_at|default('')|format_date }}</strong>, {{ 'is now canceled.'|trans }}</p>
				{% if order.reason|default('') %}
				<ul class="info-list">
					<li><strong>{{ 'Reason'|trans }}:</strong> {{ order.reason|default('') }}</li>
				</ul>
				{% endif %}
				<p>{{ 'If you have any questions regarding this, please log in and submit a support ticket.'|trans }}</p>
				<a class="email-btn" href="{{ 'login'|url(query: { 'email': c.email|default('') }, area: 'client') }}" target="_blank">{{ 'Log In'|trans }}</a>
				<p><a href="{{ 'support'|url(query: { 'ticket' : 1 }, area: 'client') }}" target="_blank">{{ 'Submit a support ticket'|trans }}</a></p>
BODY);

$templates['mod_servicecustom_renewed'] = wrap($css, <<<'BODY'
				<h1>{{ 'Service Renewed'|trans }}</h1>
				<p>{{ 'Hello'|trans }} {{ c.first_name|default('') }} {{ c.last_name|default('') }},</p>
				<p>{{ 'Your'|trans }} <strong>{{ order.title|default('') }}</strong> {{ 'has been renewed.'|trans }}</p>
				{% if order.expires_at|default('') %}
				<ul class="info-list">
					<li><strong>{{ 'Next Renewal Date'|trans }}:</strong> {{ order.expires_at|default('')|format_date }}</li>
				</ul>
				{% endif %}
				<a class="email-btn" href='{{ "order/service/manage/#{order.id|default('')}"|url(area: 'client') }}' target="_blank">{{ 'Manage Your Order'|trans }}</a>
				<p><a href="{{ 'login'|url(query: { 'email': c.email|default('') }, area: 'client') }}" target="_blank">{{ 'Log In'|trans }}</a></p>
BODY);

$templates['mod_servicecustom_unsuspended'] = wrap($css, <<<'BODY'
				<h1>{{ 'Service Reactivated'|trans }}</h1>
				<p>{{ 'Hello'|trans }} {{ c.first_name|default('') }} {{ c.last_name|default('') }},</p>
				<p>{{ 'Your'|trans }} <strong>{{ order.title|default('') }}</strong> {{ 'is now unsuspended.'|trans }}</p>
				<a class="email-btn" href='{{ "order/service/manage/#{order.id|default('')}"|url(area: 'client') }}' target="_blank">{{ 'Manage Your Order'|trans }}</a>
				<p><a href="{{ 'login'|url(query: { 'email': c.email|default('') }, area: 'client') }}" target="_blank">{{ 'Log In'|trans }}</a></p>
BODY);

$templates['mod_servicedomain_activated'] = wrap($css, <<<'BODY'
				<h1>{{ 'Your Domain Is Now Active'|trans }}</h1>
				<p>{{ 'Hello'|trans }} {{ c.first_name|default('') }} {{ c.last_name|default('') }},</p>
				<p>{{ 'Your'|trans }} <strong>{{ order.title|default('') }}</strong> {{ 'is now activated.'|trans }}</p>
				<p>{{ 'Please keep in mind that your domain name may not be visible on the internet instantly due to the propagation process, which may take up to 48 hours. Your website and email will not function until the domain has propagated.'|trans }}</p>
				<ul class="info-list">
					<li><strong>{{ 'Domain'|trans }}:</strong> {{ service.domain|default('') }}</li>
					<li><strong>{{ 'Registration Date'|trans }}:</strong> {{ order.created_at|default('')|format_date }}</li>
					<li><strong>{{ 'Registration Period'|trans }}:</strong> {{ service.period|default('') }} {{ 'Year(s)'|trans }}</li>
					{% if order.expires_at|default(false) %}<li><strong>{{ 'Expires On'|trans }}:</strong> {{ order.expires_at|format_date }}</li>{% endif %}
					{% if order.period|default(false) %}<li><strong>{{ 'Billing Period'|trans }}:</strong> {{ order.total|default(0)|format_currency(order.currency|default(default_currency)) }} {{ order.period|default('')|period_title }}</li>{% endif %}
				</ul>
				<ul class="info-list">
					<li><strong>{{ 'Nameserver 1'|trans }}:</strong> {{ service.server.ns1|default('') }}</li>
					<li><strong>{{ 'Nameserver 2'|trans }}:</strong> {{ service.server.ns2|default('') }}</li>
					{% if service.server.ns3|default('') %}<li><strong>{{ 'Nameserver 3'|trans }}:</strong> {{ service.server.ns3|default('') }}</li>{% endif %}
					{% if service.server.ns4|default('') %}<li><strong>{{ 'Nameserver 4'|trans }}:</strong> {{ service.server.ns4|default('') }}</li>{% endif %}
				</ul>
				<a class="email-btn" href='{{ "order/service/manage/#{order.id|default('')}"|url(area: 'client') }}' target="_blank">{{ 'Manage Your Order'|trans }}</a>
				<p><a href="{{ 'login'|url(query: { 'email': c.email|default('') }, area: 'client') }}" target="_blank">{{ 'Log In'|trans }}</a></p>
BODY);

$templates['mod_servicedomain_renewed'] = $templates['mod_servicecustom_renewed'];
$templates['mod_servicedomain_suspended'] = $templates['mod_servicecustom_suspended'];
$templates['mod_servicedomain_unsuspended'] = $templates['mod_servicecustom_unsuspended'];

$templates['mod_invoice_due_after'] = wrap($css, <<<'BODY'
				<h1>{{ 'Invoice Past-Due'|trans }}</h1>
				<p>{{ 'Hello'|trans }} {{ c.first_name|default('') }} {{ c.last_name|default('') }},</p>
				<p>{{ 'This is a payment reminder that your invoice'|trans }} <strong>{{ invoice.serie_nr|default('') }}</strong> {{ 'is past-due by'|trans }} {{ days_passed|default('') }} {{ 'days.'|trans }}</p>
				<ul class="info-list">
					<li><strong>{{ 'Amount Due'|trans }}:</strong> {{ invoice.total|default(0)|format_currency(invoice.currency|default(default_currency)) }}</li>
					<li><strong>{{ 'Due Date'|trans }}:</strong> {{ invoice.due_at|default('')|format_date }}</li>
					{% if invoice.orders|default([])|length > 0 %}
						{% for order in invoice.orders|default([]) %}
							<li><strong>{{ 'Order ID'|trans }}:</strong> #{{ order.id }}</li>
							{% if order.product_name %}<li><strong>{{ 'Product'|trans }}:</strong> {{ order.product_name }}</li>{% endif %}
							{% if order.expires_at %}<li><strong>{{ 'Renewal Date'|trans }}:</strong> {{ order.expires_at|format_date }}</li>{% endif %}
						{% endfor %}
					{% endif %}
				</ul>
				<a class="email-btn" href='{{ "invoice/#{invoice.hash|default('')}"|url(area: 'client') }}' target="_blank">{{ 'View & Pay Invoice'|trans }}</a>
				<p>{{ 'You can also'|trans }} <a href="{{ "invoice/pdf/#{invoice.hash|default('')}"|url(area: 'client') }}" target="_blank">{{ 'download the invoice as a PDF'|trans }}</a> {{ 'or'|trans }} <a href="{{ 'login'|url(query: { 'email': c.email|default('') }, area: 'client') }}" target="_blank">{{ 'log in'|trans }}</a>.</p>
BODY);

$templates['mod_invoice_payment_reminder'] = wrap($css, <<<'BODY'
				<h1>{{ 'Invoice Payment Reminder'|trans }}</h1>
				<p>{{ 'Hello'|trans }} {{ c.first_name|default('') }} {{ c.last_name|default('') }},</p>
				<p>{{ 'This is a reminder that your invoice'|trans }} <strong>{{ invoice.serie_nr|default('') }}</strong> {{ 'is due in'|trans }} {{ invoice.due_at|default('')|daysleft }} {{ 'days.'|trans }}</p>
				<ul class="info-list">
					<li><strong>{{ 'Amount Due'|trans }}:</strong> {{ invoice.total|default(0)|format_currency(invoice.currency|default(default_currency)) }}</li>
					<li><strong>{{ 'Due Date'|trans }}:</strong> {{ invoice.due_at|default('')|format_date }}</li>
					{% if invoice.orders|default([])|length > 0 %}
						{% for order in invoice.orders|default([]) %}
							<li><strong>{{ 'Order ID'|trans }}:</strong> #{{ order.id }}</li>
							{% if order.product_name %}<li><strong>{{ 'Product'|trans }}:</strong> {{ order.product_name }}</li>{% endif %}
							{% if order.expires_at %}<li><strong>{{ 'Renewal Date'|trans }}:</strong> {{ order.expires_at|format_date }}</li>{% endif %}
						{% endfor %}
					{% endif %}
				</ul>
				<a class="email-btn" href='{{ "invoice/#{invoice.hash|default('')}"|url(area: 'client') }}' target="_blank">{{ 'View & Pay Invoice'|trans }}</a>
				<p>{{ 'You can also'|trans }} <a href="{{ "invoice/pdf/#{invoice.hash|default('')}"|url(area: 'client') }}" target="_blank">{{ 'download the invoice as a PDF'|trans }}</a> {{ 'or'|trans }} <a href="{{ 'login'|url(query: { 'email': c.email|default('') }, area: 'client') }}" target="_blank">{{ 'log in'|trans }}</a>.</p>
BODY);

$update = $pdo->prepare('UPDATE email_template SET content = :content, is_overridden = 1 WHERE action_code = :code');
foreach ($templates as $code => $content) {
    $update->execute(['content' => $content, 'code' => $code]);
    echo "Updated {$code}\n";
}

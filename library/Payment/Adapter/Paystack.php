<?php

declare(strict_types=1);
/**
 * Paystack Payment Gateway Adapter for FOSSBilling
 * KZD Solutions (kzdsolutions.co.za / KZDBilling)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Paystack flow:
 *   1. getHtml()           — Calls Paystack API to initialize a transaction,
 *                            returns a redirect button to Paystack Checkout.
 *   2. processTransaction() — Called by FOSSBilling's ipn.php when:
 *                             (a) Paystack posts a charge.success webhook, OR
 *                             (b) Client returns via callback_url with ?reference=
 *                            Validates signature (webhook) or verifies via API
 *                            (both paths), then credits client and pays invoice.
 *
 * Amounts: Paystack requires ZAR in CENTS — R1.00 = 100 (integer)
 * Docs:    https://paystack.com/docs/payments/accept-payments/
 */

class Payment_Adapter_Paystack extends Payment_AdapterAbstract implements FOSSBilling\InjectionAwareInterface
{
    protected ?Pimple\Container $di = null;

    public function setDi(Pimple\Container $di): void
    {
        $this->di = $di;
    }

    public function getDi(): ?Pimple\Container
    {
        return $this->di;
    }

    public function __construct(private $config)
    {
        if (empty($this->config['secret_key'])) {
            throw new Payment_Exception(
                'The ":pay_gateway" payment gateway is not fully configured. Please configure the :missing',
                [':pay_gateway' => 'Paystack', ':missing' => 'Secret Key'],
                4001
            );
        }

        if (empty($this->config['public_key'])) {
            throw new Payment_Exception(
                'The ":pay_gateway" payment gateway is not fully configured. Please configure the :missing',
                [':pay_gateway' => 'Paystack', ':missing' => 'Public Key'],
                4001
            );
        }
    }

    // -------------------------------------------------------------------------
    // Static config — defines what appears in the FOSSBilling admin gateway form
    // -------------------------------------------------------------------------

    public static function getConfig(): array
    {
        return [
            'supports_one_time_payments' => true,
            'supports_subscriptions'     => false,
            'description'                => 'Pay securely via Paystack — cards, Instant EFT (Ozow), bank transfer, and more. South Africa\'s leading payment gateway.',
            'logo' => [
                // Flat filename resolved against library/Payment/Adapter/ or public/gateways/ —
                // matches every other adapter's convention (see Stripe.php: 'stripe.png').
                'logo'   => 'paystack.png',
                'height' => '30px',
                'width'  => '110px',
            ],
            'form' => [
                'secret_key' => [
                    'password',
                    [
                        'label' => 'Secret Key (sk_live_... or sk_test_... for sandbox):',
                    ],
                ],
                'public_key' => [
                    'text',
                    [
                        'label' => 'Public Key (pk_live_... or pk_test_... for sandbox):',
                    ],
                ],
                'test_mode' => [
                    'checkbox',
                    [
                        'label' => 'Sandbox / Test Mode (use sk_test_ and pk_test_ keys above)',
                        'value' => '1',
                    ],
                ],
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Step 1 — Build the payment button shown to the client
    // -------------------------------------------------------------------------

    public function getHtml($api_admin, $invoice_id, $subscription): string
    {
        $invoice = $api_admin->invoice_get(['id' => $invoice_id]);

        // Paystack requires amounts in the smallest currency unit.
        // ZAR: R1.00 = 100 cents. Multiply total by 100, cast to int.
        $amountInCents = (int) round((float) $invoice['total'] * 100);

        // Build a unique reference we can trace back to this invoice later.
        // Format: KZD-INV{invoice_id}-{timestamp}
        // The invoice_id is embedded so processTransaction() can recover it
        // even if Paystack's metadata doesn't come back (fallback path).
        $reference = 'KZD-INV' . $invoice['id'] . '-' . time();

        // Call Paystack's initialize endpoint server-side.
        // This returns an authorization_url we redirect the client to.
        $payload = json_encode([
            'email'        => $invoice['buyer']['email'],
            'amount'       => $amountInCents,
            'currency'     => $invoice['currency'],   // 'ZAR'
            'reference'    => $reference,
            // Must be redirect_url (ipn.php with redirect=1), not thankyou_url — this is the
            // URL FOSSBilling wires up to receive the browser callback as IPN data AND then
            // forward the client on to the invoice page. Pointing this at a plain content page
            // means Path B below never actually runs, and the only way a payment ever gets
            // confirmed is if a webhook is separately configured in the Paystack dashboard.
            'callback_url' => $this->config['redirect_url'],
            'metadata'     => [
                'invoice_id'    => $invoice['id'],
                'invoice_nr'    => $invoice['serie_nr'],
                'custom_fields' => [
                    [
                        'display_name'  => 'Invoice Number',
                        'variable_name' => 'invoice_nr',
                        'value'         => $invoice['serie_nr'],
                    ],
                    [
                        'display_name'  => 'Billing System',
                        'variable_name' => 'billing_system',
                        'value'         => 'KZDBilling',
                    ],
                ],
            ],
        ]);

        $response = $this->paystackPost('https://api.paystack.co/transaction/initialize', $payload);

        if (!$response || empty($response['status'])) {
            $error = $response['message'] ?? 'Unknown error from Paystack API';

            return '<div class="alert alert-danger">'
                . '<strong>Payment initialisation failed.</strong><br>'
                . htmlspecialchars($error)
                . '<br>Please contact support or try another payment method.'
                . '</div>';
        }

        $authUrl = $response['data']['authorization_url'];

        // Auto-redirect straight to Paystack, matching how FOSSBilling's own
        // banklink template (modules/Invoice/templates/client/mod_invoice_banklink.html.twig)
        // handles every other redirect-based gateway: submit immediately, and
        // only show the button as a fallback for clients with JS disabled.
        $form  = '<form name="payment_form" action="' . htmlspecialchars($authUrl) . '" method="get">' . PHP_EOL;
        $form .= '<input class="btn btn-primary btn-lg" type="submit" value="Pay with card" id="payment_button"/>' . PHP_EOL;
        $form .= '</form>' . PHP_EOL;
        $form .= sprintf('<h2>%s</h2>', __trans('Redirecting to secure payment...'));
        // Plain JS, not jQuery -- the kzd client theme doesn't load jQuery
        // anywhere, so a $(document).ready(...) call here silently throws
        // "$ is not defined" and never runs, leaving the button as the only
        // way through. This exact bug was invisible before because the
        // script used to be gated behind a setting that could never be true.
        $form .= "<script type='text/javascript'>"
              . "document.addEventListener('DOMContentLoaded', function(){"
              . "document.getElementById('payment_button').style.display = 'none';"
              . "document.forms['payment_form'].submit();"
              . "});</script>";

        return $form;
    }

    // -------------------------------------------------------------------------
    // Step 2 — Process the payment notification/callback
    // -------------------------------------------------------------------------

    /**
     * FOSSBilling calls this via ipn.php when Paystack contacts our notify_url,
     * and also when the client returns via callback_url.
     *
     * Two entry paths:
     *
     *   PATH A — Webhook (preferred, server-initiated by Paystack):
     *     Paystack POSTs a JSON body to our notify_url with the header
     *     x-paystack-signature. We validate the HMAC signature, then
     *     verify the transaction with Paystack's API before crediting.
     *
     *   PATH B — Callback redirect (client browser returns to thankyou_url):
     *     Paystack appends ?reference=KZD-INV...-... to the callback URL.
     *     We pick up the reference from $data['get'] and verify directly.
     *     Less reliable than webhook (client could close browser), but
     *     provides immediate feedback on the thank-you page.
     */
    public function processTransaction($api_admin, $id, $data, $gateway_id): void
    {
        // Detect which path we're on.
        // Webhooks always carry the Paystack signature header.
        $isWebhook = !empty($data['server']['HTTP_X_PAYSTACK_SIGNATURE'])
                  || !empty($_SERVER['HTTP_X_PAYSTACK_SIGNATURE']);

        if ($isWebhook) {
            $this->handleWebhook($api_admin, $id, $data);
        } else {
            $this->handleCallback($api_admin, $id, $data);
        }
    }

    // -------------------------------------------------------------------------
    // Path A — Webhook handler
    // -------------------------------------------------------------------------

    private function handleWebhook($api_admin, $id, array $data): void
    {
        // Paystack sends raw JSON — FOSSBilling stores it in http_raw_post_data
        $rawBody = $data['http_raw_post_data'] ?? file_get_contents('php://input');

        // Validate HMAC SHA512 signature
        $sigHeader   = $data['server']['HTTP_X_PAYSTACK_SIGNATURE']
                    ?? $_SERVER['HTTP_X_PAYSTACK_SIGNATURE']
                    ?? '';
        $expectedSig = hash_hmac('sha512', $rawBody, trim($this->config['secret_key']));

        if (!hash_equals($expectedSig, $sigHeader)) {
            $api_admin->invoice_transaction_update([
                'id'         => $id,
                'error'      => 'Paystack webhook HMAC signature validation failed',
                'error_code' => 'INVALID_SIGNATURE',
                'status'     => 'error',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
            http_response_code(400);

            return;
        }

        $event = json_decode($rawBody, true);

        // We only act on charge.success — acknowledge everything else with 200
        if (($event['event'] ?? '') !== 'charge.success') {
            http_response_code(200);

            return;
        }

        $reference = $event['data']['reference'] ?? null;
        if (!$reference) {
            $api_admin->invoice_transaction_update([
                'id'         => $id,
                'error'      => 'charge.success webhook missing transaction reference',
                'error_code' => 'MISSING_REFERENCE',
                'status'     => 'error',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return;
        }

        // Always verify server-to-server even after a valid webhook.
        // Never trust the webhook payload amount directly.
        $this->verifyAndApply($api_admin, $id, $reference);

        http_response_code(200);
    }

    // -------------------------------------------------------------------------
    // Path B — Browser callback handler
    // -------------------------------------------------------------------------

    private function handleCallback($api_admin, $id, array $data): void
    {
        // Paystack appends ?reference=... to the callback_url
        $reference = $data['get']['reference'] ?? $data['post']['reference'] ?? null;

        if (!$reference) {
            $api_admin->invoice_transaction_update([
                'id'         => $id,
                'error'      => 'No payment reference received from Paystack callback',
                'error_code' => 'MISSING_REFERENCE',
                'status'     => 'error',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return;
        }

        $this->verifyAndApply($api_admin, $id, $reference);
    }

    // -------------------------------------------------------------------------
    // Core: verify with Paystack API and credit the client
    // -------------------------------------------------------------------------

    /**
     * Calls Paystack's /transaction/verify/{reference} endpoint.
     * If the transaction is valid and complete, credits the client's balance
     * and marks the invoice as paid — exactly as the PayPal adapter does.
     */
    private function verifyAndApply($api_admin, $id, string $reference): void
    {
        // Prevent double-processing — check current transaction status first
        $tx = $api_admin->invoice_transaction_get(['id' => $id]);
        if ($tx['status'] === 'processed') {
            return;
        }

        // Server-to-server verification with Paystack
        $verification = $this->paystackGet(
            'https://api.paystack.co/transaction/verify/' . urlencode($reference)
        );

        if (!$verification || empty($verification['status'])) {
            $api_admin->invoice_transaction_update([
                'id'         => $id,
                'error'      => 'Paystack verification API call failed: '
                                . ($verification['message'] ?? 'no response'),
                'error_code' => 'VERIFY_FAILED',
                'status'     => 'error',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return;
        }

        $txData = $verification['data'];

        // Transaction must have status "success"
        if (($txData['status'] ?? '') !== 'success') {
            $api_admin->invoice_transaction_update([
                'id'         => $id,
                'error'      => 'Paystack transaction not successful. Status: '
                                . ($txData['status'] ?? 'unknown'),
                'error_code' => 'NOT_SUCCESSFUL',
                'status'     => 'error',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return;
        }

        // Resolve the invoice ID:
        // Primary: from metadata embedded during getHtml() initialization
        // Fallback: parse from our reference string (KZD-INV{id}-{timestamp})
        $invoiceId = $txData['metadata']['invoice_id']
                  ?? $this->invoiceIdFromReference($reference);

        if (!$invoiceId) {
            $api_admin->invoice_transaction_update([
                'id'         => $id,
                'error'      => 'Could not resolve invoice ID from Paystack transaction',
                'error_code' => 'NO_INVOICE_ID',
                'status'     => 'error',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return;
        }

        // Paystack returns amount in cents — convert back to rands for FOSSBilling
        $paidCents = (int)($txData['amount'] ?? 0);
        $paidRands = $paidCents / 100;
        $currency  = $txData['currency'] ?? 'ZAR';

        // Check for duplicate — same approach as PayPal adapter's isIpnDuplicate()
        if ($this->isTransactionDuplicate((string) ($txData['id'] ?? $reference))) {
            $api_admin->invoice_transaction_update([
                'id'         => $id,
                'error'      => 'Cannot process duplicate Paystack transaction',
                'error_code' => 'DUPLICATE',
                'status'     => 'error',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return;
        }

        // Store transaction details on the FOSSBilling transaction record
        $api_admin->invoice_transaction_update([
            'id'         => $id,
            'invoice_id' => $invoiceId,
            'txn_id'     => (string)($txData['id'] ?? $reference),
            'txn_status' => $txData['status'],
            'amount'     => $paidRands,
            'currency'   => $currency,
            'type'       => 'Paystack',
        ]);

        // Credit client balance — mirrors PayPal adapter exactly:
        // $api_admin->client_balance_add_funds() then invoice_pay_with_credits()
        $invoice   = $api_admin->invoice_get(['id' => $invoiceId]);
        $client_id = $invoice['client']['id'];

        $api_admin->client_balance_add_funds([
            'id'          => $client_id,
            'amount'      => $paidRands,
            'description' => 'Paystack transaction ' . ($txData['id'] ?? $reference),
            'type'        => 'Paystack',
            'rel_id'      => $txData['id'] ?? $reference,
        ]);

        $api_admin->invoice_pay_with_credits(['id' => $invoiceId]);

        // Mark transaction as fully processed
        $api_admin->invoice_transaction_update([
            'id'         => $id,
            'error'      => '',
            'error_code' => null,
            'status'     => 'processed',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        // One-click payment: if Paystack returned a reusable authorization
        // for this charge, save it so a future payment can skip the redirect
        // to Paystack's hosted checkout entirely.
        $this->saveReusableAuthorization($client_id, $txData);
    }

    // -------------------------------------------------------------------------
    // One-click payment (saved card)
    // -------------------------------------------------------------------------

    /**
     * Persist a reusable authorization_code for this client, if Paystack
     * returned one and flagged it reusable. One row per (client, gateway) --
     * a newer reusable authorization overwrites the previous saved card.
     */
    /**
     * One-click payment's client_saved_card table isn't part of FOSSBilling's
     * core schema, so there's no install/upgrade migration that creates it.
     * Creating it here (idempotent, CREATE TABLE IF NOT EXISTS) means a fresh
     * deploy or new environment just works on first use instead of 500ing
     * until someone remembers to run a one-off setup script.
     */
    public static function ensureSavedCardTableExists(\PDO $pdo): void
    {
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
    }

    private function saveReusableAuthorization(int $clientId, array $txData): void
    {
        $auth = $txData['authorization'] ?? null;
        if (!is_array($auth) || empty($auth['authorization_code']) || empty($auth['reusable'])) {
            return;
        }

        self::ensureSavedCardTableExists($this->di['pdo']);

        $now = date('Y-m-d H:i:s');
        $sql = 'INSERT INTO client_saved_card
                    (client_id, gateway, authorization_code, email, card_type, last4, exp_month, exp_year, bank, created_at, updated_at)
                VALUES
                    (:client_id, :gateway, :authorization_code, :email, :card_type, :last4, :exp_month, :exp_year, :bank, :now, :now)
                ON DUPLICATE KEY UPDATE
                    authorization_code = VALUES(authorization_code),
                    email = VALUES(email),
                    card_type = VALUES(card_type),
                    last4 = VALUES(last4),
                    exp_month = VALUES(exp_month),
                    exp_year = VALUES(exp_year),
                    bank = VALUES(bank),
                    updated_at = VALUES(updated_at)';

        $this->di['pdo']->prepare($sql)->execute([
            ':client_id'          => $clientId,
            ':gateway'            => 'Paystack',
            ':authorization_code' => $auth['authorization_code'],
            ':email'              => $txData['customer']['email'] ?? '',
            ':card_type'          => $auth['card_type'] ?? null,
            ':last4'              => $auth['last4'] ?? null,
            ':exp_month'          => $auth['exp_month'] ?? null,
            ':exp_year'           => $auth['exp_year'] ?? null,
            ':bank'               => $auth['bank'] ?? null,
            ':now'                => $now,
        ]);
    }

    /**
     * Charge a previously-saved reusable authorization directly, with no
     * redirect to Paystack's hosted checkout. Used for one-click payments.
     *
     * @param string $authorizationCode Paystack authorization_code (e.g. "AUTH_xxx")
     * @param string $email             must match the email the authorization was created under
     * @param int    $amountInCents     amount in the smallest currency unit (ZAR cents)
     * @param string $reference         our own reference, so the existing verify/credit
     *                                  pipeline (KZD-INV{id}-{time}) can resolve the invoice
     */
    public function chargeAuthorization(string $authorizationCode, string $email, int $amountInCents, string $reference): ?array
    {
        $payload = json_encode([
            'authorization_code' => $authorizationCode,
            'email'              => $email,
            'amount'             => $amountInCents,
            'reference'          => $reference,
        ]);

        return $this->paystackPost('https://api.paystack.co/transaction/charge_authorization', $payload);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Extract the invoice ID from our reference string.
     * Reference format: KZD-INV{invoice_id}-{timestamp}
     * e.g. KZD-INV42-1718123456 → 42
     */
    private function invoiceIdFromReference(string $reference): ?int
    {
        if (preg_match('/^KZD-INV(\d+)-\d+$/', $reference, $matches)) {
            return (int)$matches[1];
        }

        return null;
    }

    /**
     * Check whether we've already successfully processed a transaction
     * with this Paystack transaction ID. Prevents double-crediting.
     */
    private function isTransactionDuplicate(string $txnId): bool
    {
        $sql = 'SELECT id
                FROM transaction
                WHERE txn_id = :txn_id
                  AND txn_status = :status
                  AND type = :type
                LIMIT 2';

        $rows = $this->di['db']->getAll($sql, [
            ':txn_id' => $txnId,
            ':status' => 'success',
            ':type'   => 'Paystack',
        ]);

        return (is_countable($rows) ? count($rows) : 0) > 1;
    }

    /**
     * POST JSON to a Paystack API endpoint.
     * Uses FOSSBilling's built-in Symfony HttpClient (from Payment_AdapterAbstract)
     * — same approach as PayPal adapter's download() method.
     */
    private function paystackPost(string $url, string $jsonPayload): ?array
    {
        try {
            $client   = $this->getHttpClient()->withOptions(['timeout' => 30]);
            $response = $client->request('POST', $url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . trim($this->config['secret_key']),
                    'Content-Type'  => 'application/json',
                    'Cache-Control' => 'no-cache',
                ],
                'body' => $jsonPayload,
            ]);

            return json_decode($response->getContent(false), true);
        } catch (\Throwable $e) {
            error_log('Paystack API POST error: ' . $e->getMessage());

            return null;
        }
    }

    /**
     * GET from a Paystack API endpoint.
     */
    private function paystackGet(string $url): ?array
    {
        try {
            $client   = $this->getHttpClient()->withOptions(['timeout' => 30]);
            $response = $client->request('GET', $url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . trim($this->config['secret_key']),
                    'Cache-Control' => 'no-cache',
                ],
            ]);

            return json_decode($response->getContent(false), true);
        } catch (\Throwable $e) {
            error_log('Paystack API GET error: ' . $e->getMessage());

            return null;
        }
    }
}
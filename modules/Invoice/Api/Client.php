<?php

declare(strict_types=1);
/**
 * Copyright 2022-2025 FOSSBilling
 * SPDX-License-Identifier: Apache-2.0.
 *
 * @copyright FOSSBilling (https://www.fossbilling.org)
 * @license http://www.apache.org/licenses/LICENSE-2.0 Apache-2.0
 */

/**
 *Invoice management.
 */

namespace Box\Mod\Invoice\Api;

use FOSSBilling\PaginationOptions;
use FOSSBilling\Validation\Api\RequiredParams;

class Client extends \FOSSBilling\Api\AbstractApi
{
    /**
     * Get paginated list of invoices.
     *
     * @return array
     */
    public function get_list($data)
    {
        $data['client_id'] = $this->getIdentity()->id;
        $data['approved'] = true;

        [$sql, $params] = $this->getService()->getSearchQuery($data);
        $pager = $this->getDi()['pager']->getPaginatedResultSet($sql, $params, PaginationOptions::fromArray($data));

        foreach ($pager['list'] as $key => $item) {
            $invoice = $this->getDi()['db']->getExistingModelById('Invoice', $item['id'], 'Invoice not found');
            $pager['list'][$key] = $this->getService()->toApiArray($invoice);
        }

        return $pager;
    }

    /**
     * Get invoice details.
     *
     * @return array
     *
     * @throws \FOSSBilling\Exception
     */
    #[RequiredParams(['hash' => 'Invoice hash was not passed'])]
    public function get($data)
    {
        $identity = $this->getIdentity();
        $model = $this->getDi()['db']->findOne('Invoice', 'hash = :hash AND client_id = :client_id', ['hash' => $data['hash'], 'client_id' => $identity->id]);
        if (!$model) {
            throw new \FOSSBilling\InformationException('Invoice was not found');
        }

        return $this->getService()->toApiArray($model, true, $identity);
    }

    /**
     * Generates new invoice for selected order. If unpaid invoice for selected order
     * already exists, new invoice will not be generated, and old invoice hash
     * is returned.
     *
     * @return string - invoice hash
     *
     * @throws \FOSSBilling\Exception
     */
    #[RequiredParams(['order_id' => 'Order ID (order_id) was not passed'])]
    public function renewal_invoice($data)
    {
        $model = $this->getDi()['db']->findOne('ClientOrder', 'client_id = ? and id = ?', [$this->getIdentity()->id, $data['order_id']]);
        if (!$model instanceof \Model_ClientOrder) {
            throw new \FOSSBilling\InformationException('Order not found');
        }
        $service = $this->getService();
        $invoice = $service->generateForOrder($model);
        $service->approveInvoice($invoice, ['id' => $invoice->id, 'use_credits' => true]);
        $this->getDi()['logger']->info('Generated new renewal invoice #%s', $invoice->id);

        return $invoice->hash;
    }

    /**
     * Deposit money in advance. Generates new invoice for depositing money.
     * Clients currency must be defined.
     *
     * @return string - invoice hash
     */
    #[RequiredParams(['amount' => 'Amount is required'])]
    public function funds_invoice($data)
    {
        if (!is_numeric($data['amount'])) {
            throw new \FOSSBilling\InformationException('You need to enter numeric value');
        }

        $service = $this->getService();
        $invoice = $service->generateFundsInvoice($this->getIdentity(), $data['amount']);
        $service->approveInvoice($invoice, ['id' => $invoice->id]);
        $this->getDi()['logger']->info('Generated add funds invoice #%s', $invoice->id);

        return $invoice->hash;
    }

    /**
     * Get paginated list of transactions.
     *
     * @optional string $invoice_hash - filter transactions by invoice hash
     * @optional int $gateway_id - filter transactions by payment gateway id
     * @optional string $status - filter transactions by status
     * @optional string $currency - filter transactions by currency code
     * @optional string $date_from - filter transactions by date
     * @optional string $date_to - filter transactions by date
     *
     * @return array
     */
    public function transaction_get_list($data)
    {
        $data['client_id'] = $this->getIdentity()->id;
        $data['status'] = 'processed';
        $transactionService = $this->getDi()['mod_service']('Invoice', 'Transaction');
        [$sql, $params] = $transactionService->getSearchQuery($data);

        $pager = $this->getDi()['pager']->getPaginatedResultSet($sql, $params, PaginationOptions::fromArray($data));

        foreach ($pager['list'] as $key => $item) {
            $pager['list'][$key] = $transactionService->searchResultToApiArray($item);
        }

        return $pager;
    }

    public function get_tax_rate()
    {
        $service = $this->getDi()['mod_service']('Invoice', 'Tax');

        return $service->getTaxRateForClient($this->getIdentity());
    }

    /**
     * One-click payment: return the client's saved card summary for a
     * gateway (card_type/last4/exp only -- never the authorization_code
     * itself), or null if no reusable card is saved.
     *
     * @optional string $gateway - defaults to "Paystack"
     *
     * @return array|null
     */
    public function get_saved_card($data = [])
    {
        $gateway = $data['gateway'] ?? 'Paystack';
        $row = $this->getDi()['pdo']->prepare(
            'SELECT card_type, last4, exp_month, exp_year FROM client_saved_card WHERE client_id = :client_id AND gateway = :gateway'
        );
        $row->execute([':client_id' => $this->getIdentity()->id, ':gateway' => $gateway]);
        $card = $row->fetch(\PDO::FETCH_ASSOC);

        return $card ?: null;
    }

    /**
     * One-click payment: charge the client's saved card for an invoice
     * directly, with no redirect to the gateway's hosted checkout.
     *
     * @return bool
     */
    #[RequiredParams(['id' => 'Invoice ID was not passed'])]
    public function pay_with_saved_card($data)
    {
        $identity = $this->getIdentity();
        $invoice = $this->getDi()['db']->getExistingModelById('Invoice', $data['id'], 'Invoice not found');

        if ((int) $invoice->client_id !== (int) $identity->id) {
            throw new \FOSSBilling\InformationException('Invoice not found');
        }

        if ($invoice->status !== 'unpaid') {
            throw new \FOSSBilling\InformationException('Invoice is not awaiting payment');
        }

        $gateway = 'Paystack';

        $cardStmt = $this->getDi()['pdo']->prepare(
            'SELECT authorization_code, email FROM client_saved_card WHERE client_id = :client_id AND gateway = :gateway'
        );
        $cardStmt->execute([':client_id' => $identity->id, ':gateway' => $gateway]);
        $card = $cardStmt->fetch(\PDO::FETCH_ASSOC);

        if (!$card) {
            throw new \FOSSBilling\InformationException('No saved card found for one-click payment');
        }

        $pgModel = $this->getDi()['db']->findOne('PayGateway', 'gateway = :gateway AND enabled = 1', [':gateway' => $gateway]);
        if (!$pgModel) {
            throw new \FOSSBilling\InformationException('Paystack is not enabled');
        }

        $payGatewayService = $this->getDi()['mod_service']('Invoice', 'PayGateway');
        $adapter = $payGatewayService->getPaymentAdapter($pgModel, $invoice);

        // invoice.total isn't a raw DB column -- it's computed (subtotal + tax)
        // from the invoice's line items in toApiArray().
        $invoiceTotal = (float) $this->getService()->toApiArray($invoice)['total'];

        $reference = 'KZD-INV' . $invoice->id . '-' . time();
        $amountInCents = (int) round($invoiceTotal * 100);

        $chargeResult = $adapter->chargeAuthorization($card['authorization_code'], $card['email'], $amountInCents, $reference);

        if (!$chargeResult || empty($chargeResult['status'])) {
            throw new \FOSSBilling\Exception('One-click payment failed: :error', [':error' => $chargeResult['message'] ?? 'Unknown error from Paystack']);
        }

        // Feed the same reference into the existing verify/credit/pay-invoice
        // pipeline that the redirect and webhook flows already use --
        // Paystack.php::verifyAndApply() independently re-verifies with
        // Paystack's API before crediting anything.
        $ipn = [
            'invoice_id' => (int) $invoice->id,
            'gateway_id' => (int) $pgModel->id,
            'source' => 'one_click',
            'get' => ['reference' => $reference],
            'post' => [],
            'server' => [],
            'http_raw_post_data' => '',
        ];
        $this->getDi()['mod_service']('Invoice', 'Transaction')->createAndProcess($ipn);

        return true;
    }
}

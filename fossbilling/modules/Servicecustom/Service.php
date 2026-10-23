<?php

declare(strict_types=1);
/**
 * Copyright 2022-2025 FOSSBilling
 * SPDX-License-Identifier: Apache-2.0.
 *
 * @copyright FOSSBilling (https://www.fossbilling.org)
 * @license http://www.apache.org/licenses/LICENSE-2.0 Apache-2.0
 */

namespace Box\Mod\Servicecustom;

use Box\Mod\Product\Entity\Product;
use FOSSBilling\Environment;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Filesystem\Path;

class Service implements \FOSSBilling\InjectionAwareInterface
{
    protected ?\Pimple\Container $di = null;
    private Filesystem $filesystem;

    public function __construct()
    {
        $this->filesystem = new Filesystem();
    }

    public function setDi(\Pimple\Container $di): void
    {
        $this->di = $di;
        if (isset($di['filesystem'])) {
            $this->filesystem = $di['filesystem'];
        }
    }

    public function getDi(): ?\Pimple\Container
    {
        return $this->di;
    }

    public function getModulePermissions(): array
    {
        return [
            'manage' => [
                'type' => 'bool',
                'display_name' => __trans('Manage custom services'),
                'description' => __trans('Allows the staff member to update custom service configurations and call custom service methods.'),
            ],
        ];
    }

    public function validateCustomForm(array &$data, array $product): void
    {
        if ($product['form_id']) {
            $formbuilderService = $this->di['mod_service']('formbuilder');
            $form = $formbuilderService->getForm((int) $product['form_id']);
            foreach ($form['fields'] as $field) {
                if (($field['required'] ?? 0) == 1) {
                    $field_name = $field['name'];
                    if (!isset($data[$field_name]) || empty($data[$field_name])) {
                        throw new \FOSSBilling\InformationException('You must fill in all required fields. ' . $field['label'] . ' is missing', null, 9684);
                    }
                }

                if (($field['readonly'] ?? 0) == 1) {
                    $field_name = $field['name'];
                    if ($data[$field_name] != $field['default_value']) {
                        throw new \FOSSBilling\InformationException('Field ' . $field['label'] . ' is read only. You cannot change its value', null, 5468);
                    }
                }

                if (($field['type'] ?? null) === 'url') {
                    $field_name = $field['name'];
                    if (!empty($data[$field_name])) {
                        if (!is_string($data[$field_name])) {
                            throw new \FOSSBilling\InformationException('Field ' . $field['label'] . ' must be a valid URL with a TLD (e.g., https://example.com)', null, 1248);
                        }

                        $formbuilderService = $this->di['mod_service']('formbuilder');
                        if (!$formbuilderService->validateUrlField($data[$field_name])) {
                            throw new \FOSSBilling\InformationException('Field ' . $field['label'] . ' must be a valid URL with a TLD (e.g., https://example.com)', null, 1248);
                        }
                    }
                }
            }
        }
    }

    /**
     * @return \Model_ServiceCustom
     */
    public function action_create(\Model_ClientOrder $order)
    {
        $product = $this->di['mod_service']('product')->findProductById((int) $order->product_id);
        if (!$product instanceof Product) {
            throw new \FOSSBilling\InformationException('Product not found');
        }

        $model = $this->di['db']->dispense('ServiceCustom');
        $model->client_id = $order->client_id;
        $model->plugin = $product->getPlugin();
        $model->plugin_config = $product->getPluginConfig();

        $config = json_decode((string) $order->config, true) ?? [];
        $associatedDomain = $this->resolveAssociatedDomain($config);
        if ($associatedDomain !== null) {
            $config['associated_domain'] = $associatedDomain;

            $domainOrder = $this->findAssociatedDomainOrder($order);
            $config['associated_domain_order_id'] = $domainOrder?->id;

            $this->di['logger']->info('Domain "%s" associated with custom service order #%s', $associatedDomain, $order->id);
        }

        $model->config = json_encode($config);
        $model->created_at = date('Y-m-d H:i:s');
        $model->updated_at = date('Y-m-d H:i:s');
        $this->di['db']->store($model);

        return $model;
    }

    /* -----------------------------------------------------------------
     * Domain association (optional/required, per product.config) --
     * lets a `type=custom` product (hosting, Business Email) collect a
     * register/transfer/own-domain choice at checkout the same way
     * `Servicehosting` does, without inheriting its mandatory-domain
     * requirement or its real account-provisioning side effects. Reused
     * generically by Cart\Service::addItem() via getDomainProductFromConfig()
     * -- see modules/Servicecustom/Service.php's docblock references in
     * docs/CUSTOMIZATIONS.md.
     * --------------------------------------------------------------- */

    /**
     * 'off' (default -- untouched behaviour for any other type=custom
     * product), 'optional' (hosting -- customer may skip), or 'required'
     * (Business Email -- a domain must be chosen).
     */
    private function domainAssociationMode(array $data): string
    {
        return $data['domain_association'] ?? 'off';
    }

    public function attachOrderConfig(Product $product, array $data): array
    {
        $c = json_decode($product->getConfig() ?? '', true) ?? [];
        $data = array_merge($c, $data);

        $action = $data['domain']['action'] ?? null;
        if ($this->domainAssociationMode($data) !== 'off' && !empty($action)) {
            $this->assertDomainActionAllowed($action, $data);
        }

        return $data;
    }

    private function assertDomainActionAllowed(string $action, array $productConfig): void
    {
        $allowRegister = $productConfig['allow_domain_register'] ?? true;
        $allowTransfer = $productConfig['allow_domain_transfer'] ?? true;
        $allowOwn = $productConfig['allow_domain_own'] ?? true;

        match ($action) {
            'register' => $allowRegister || throw new \FOSSBilling\InformationException('Domain registration is not available for this product.'),
            'transfer' => $allowTransfer || throw new \FOSSBilling\InformationException('Domain transfer is not available for this product.'),
            'owndomain' => $allowOwn || throw new \FOSSBilling\InformationException('Using your own domain is not allowed for this product.'),
            default => throw new \FOSSBilling\InformationException('Invalid domain action specified.'),
        };
    }

    public function validateOrderData(array &$data): void
    {
        $mode = $this->domainAssociationMode($data);
        if ($mode === 'off') {
            return;
        }

        $action = $data['domain']['action'] ?? null;

        if (empty($action)) {
            if ($mode === 'required') {
                throw new \FOSSBilling\InformationException('Please choose a domain option to continue.');
            }

            // 'optional' and no domain chosen -- valid, customer skipped it.
            return;
        }

        $this->assertDomainActionAllowed($action, $data);

        [$sld, $tld] = $this->getDomainTuple($action, $data['domain']);
        if (empty($sld) || empty($tld)) {
            throw new \FOSSBilling\InformationException('Domain name is invalid.');
        }
    }

    private function getDomainTuple(string $action, array $domain): array
    {
        if ($action === 'owndomain') {
            $tld = (string) ($domain['owndomain_tld'] ?? '');

            return [$domain['owndomain_sld'] ?? null, $tld !== '' && !str_contains($tld, '.') ? '.' . $tld : $tld];
        }

        if ($action === 'register') {
            return [$domain['register_sld'] ?? null, $domain['register_tld'] ?? null];
        }

        if ($action === 'transfer') {
            return [$domain['transfer_sld'] ?? null, $domain['transfer_tld'] ?? null];
        }

        return [null, null];
    }

    /**
     * @return bool|array{product: Product, config: array}
     */
    public function getDomainProductFromConfig(Product $product, array &$data): bool|array
    {
        $data = $this->attachOrderConfig($product, $data);
        $this->validateOrderData($data);

        if ($this->domainAssociationMode($data) === 'off') {
            return false;
        }

        $action = $data['domain']['action'] ?? null;
        if (empty($action) || $action === 'owndomain') {
            // No domain chosen, or the customer already owns it elsewhere --
            // nothing to register/transfer, so no companion domain order.
            return false;
        }

        $dc = $data['domain'];
        $this->di['mod_service']('servicedomain')->validateOrderData($dc);

        $mainDomainProduct = $this->di['mod_service']('product')->getMainDomainProduct();
        if (!$mainDomainProduct instanceof Product) {
            throw new \FOSSBilling\Exception('Could not find main domain product');
        }

        return ['product' => $mainDomainProduct, 'config' => $dc];
    }

    /** Human-readable "example.co.za" for the domain chosen at checkout, if any. */
    private function resolveAssociatedDomain(array $orderConfig): ?string
    {
        $action = $orderConfig['domain']['action'] ?? null;
        if (empty($action)) {
            return null;
        }

        [$sld, $tld] = $this->getDomainTuple($action, $orderConfig['domain']);
        if (empty($sld) || empty($tld)) {
            return null;
        }

        return strtolower($sld . $tld);
    }

    /**
     * Finds the real domain order bundled into the same cart checkout as
     * this custom-service order (register/transfer only -- "owndomain"
     * never creates one). Same group_id + product-id matching pattern as
     * Servicedomain\Service::findProtectionAddonOrder().
     */
    private function findAssociatedDomainOrder(\Model_ClientOrder $order): ?\Model_ClientOrder
    {
        if (empty($order->group_id)) {
            return null;
        }

        $mainDomainProduct = $this->di['mod_service']('product')->getMainDomainProduct();
        if (!$mainDomainProduct instanceof Product) {
            return null;
        }

        $found = $this->di['db']->findOne(
            'ClientOrder',
            'group_id = ? AND client_id = ? AND id != ? AND product_id = ?',
            [$order->group_id, $order->client_id, $order->id, $mainDomainProduct->getId()]
        );

        return $found instanceof \Model_ClientOrder ? $found : null;
    }

    public function action_activate(\Model_ClientOrder $order): bool
    {
        $orderService = $this->di['mod_service']('order');
        $model = $orderService->getOrderService($order);
        if (!$model instanceof \RedBeanPHP\SimpleModel) {
            throw new \FOSSBilling\Exception('Could not activate order. Service was not created', null, 7456);
        }

        // @phpstan-ignore argument.type (Model is guaranteed to be Model_ServiceCustom by getOrderService)
        $this->callOnAdapter($model, 'activate');

        return true;
    }

    public function action_renew(\Model_ClientOrder $order): bool
    {
        // move expiration period to future
        $model = $this->_getOrderService($order);
        $this->callOnAdapter($model, 'renew');

        $model->updated_at = date('Y-m-d H:i:s');

        $this->di['db']->store($model);

        return true;
    }

    public function action_suspend(\Model_ClientOrder $order): bool
    {
        // move expiration period to future
        $model = $this->_getOrderService($order);

        $this->callOnAdapter($model, 'suspend');

        $model->updated_at = date('Y-m-d H:i:s');

        $this->di['db']->store($model);

        return true;
    }

    public function action_unsuspend(\Model_ClientOrder $order): bool
    {
        // move expiration period to future
        $model = $this->_getOrderService($order);

        $this->callOnAdapter($model, 'unsuspend');

        $model->updated_at = date('Y-m-d H:i:s');

        $this->di['db']->store($model);

        return true;
    }

    public function action_cancel(\Model_ClientOrder $order): bool
    {
        // move expiration period to future
        $model = $this->_getOrderService($order);

        $this->callOnAdapter($model, 'cancel');

        $model->updated_at = date('Y-m-d H:i:s');

        $this->di['db']->store($model);

        return true;
    }

    public function action_uncancel(\Model_ClientOrder $order): bool
    {
        // move expiration period to future
        $model = $this->_getOrderService($order);

        $this->callOnAdapter($model, 'uncancel');

        $model->updated_at = date('Y-m-d H:i:s');

        $this->di['db']->store($model);

        return true;
    }

    public function action_delete(\Model_ClientOrder $order): bool
    {
        try {
            $model = $this->_getOrderService($order);
        } catch (\Exception $e) {
            error_log($e->getMessage());

            return true;
        }

        $this->callOnAdapter($model, 'delete');
        $this->di['db']->trash($model);

        return true;
    }

    public function getConfig(\Model_ServiceCustom $model): array
    {
        return json_decode($model->config ?? '', true) ?? [];
    }

    public function toApiArray(\Model_ServiceCustom $model): array
    {
        $data = $this->getConfig($model);
        $data['id'] = $model->id;
        $data['client_id'] = $model->client_id;
        $data['plugin'] = $model->plugin;
        $data['updated_at'] = $model->updated_at;
        $data['created_at'] = $model->created_at;

        return $data;
    }

    public function customCall(\Model_ServiceCustom $model, $method, $params = [])
    {
        $forbidden_methods = [
            'delete',
            'cancel',
            'uncancel',
            'suspend',
            'unsuspend',
            'renew',
            'activate',
        ];
        if (in_array($method, $forbidden_methods)) {
            throw new \FOSSBilling\Exception('Custom plugin method :method is forbidden', [':method' => $method], 403);
        }

        return $this->callOnAdapter($model, $method, $params);
    }

    public function updateConfig($orderId, $config): void
    {
        if (!is_array($config)) {
            throw new \FOSSBilling\Exception('Config must be an array');
        }

        $model = $this->getServiceCustomByOrderId($orderId);
        $model->config = json_encode($config);
        $model->updated_at = date('Y-m-d H:i:s');

        $this->di['db']->store($model);

        $this->di['logger']->info('Custom service updated #%s', $model->id);
    }

    public function getServiceCustomByOrderId($orderId, $clientId = null)
    {
        $orderService = $this->di['mod_service']('order');

        if ($clientId !== null) {
            $order = $this->di['db']->findOne('ClientOrder', 'id = ? AND client_id = ?', [$orderId, $clientId]);
            if (!$order instanceof \Model_ClientOrder) {
                throw new \FOSSBilling\InformationException('Order not found');
            }

            $orderService->assertOrderUsable($order);

            if ($order->status !== \Model_ClientOrder::STATUS_ACTIVE) {
                throw new \FOSSBilling\InformationException('Order is not activated');
            }
        } else {
            $order = $this->di['db']->getExistingModelById('ClientOrder', $orderId, 'Order not found');
        }

        $s = $orderService->getOrderService($order);

        if (!$s instanceof \Model_ServiceCustom) {
            throw new \FOSSBilling\Exception('Order is not activated');
        }

        return $s;
    }

    private function callOnAdapter(\Model_ServiceCustom $model, $method, $params = [])
    {
        $plugin = $model->plugin;
        if (empty($plugin)) {
            // error_log('Plugin is not used for this custom service');
            return null;
        }

        // check if plugin exists. If plugin does not exist, do not throw error. Simply add to log
        $file = Path::join('Plugin', $plugin, "{$plugin}.php");
        if (!Environment::isTesting() && !$this->filesystem->exists(Path::join(PATH_LIBRARY, $file))) {
            $e = new \FOSSBilling\InformationException('Plugin class file :file was not found', [':file' => $file], 3124);
            // @phpstan-ignore if.alwaysFalse (DEBUG is a runtime constant that may be true during debugging)
            if (DEBUG) {
                error_log($e->getMessage());
            }

            return null;
        }

        require_once Path::normalize($file);

        $config = json_decode($model->plugin_config ?? '', true) ?? [];

        $adapter = new $plugin($config);

        if (!method_exists($adapter, $method)) {
            throw new \FOSSBilling\Exception('Plugin :plugin does not support action :action', [':plugin' => $plugin, ':action' => $method], 3125);
        }

        $orderService = $this->di['mod_service']('order');
        $order = $orderService->getServiceOrder($model);
        $order_data = $orderService->toApiArray($order);
        $data = $this->toApiArray($model);

        return $adapter->$method($data, $order_data, $params);
    }

    private function _getOrderService(\Model_ClientOrder $order)
    {
        $orderService = $this->di['mod_service']('order');
        $model = $orderService->getOrderService($order);
        if (!$model instanceof \RedBeanPHP\SimpleModel) {
            throw new \FOSSBilling\Exception('Order :id has no active service', [':id' => $order->id]);
        }

        return $model;
    }
}

<?php

declare(strict_types=1);

/**
 * HostAfrica Domain Reseller registrar adapter for FOSSBilling.
 *
 * Built for KZD Solutions against the HostAfrica Domain Reseller HTTP API:
 *   https://my.hostafrica.com/modules/addons/DomainsReseller/api/index.php
 *
 * NOTE: HostAfrica's published docs show request parameters but do not show
 * exact response JSON shapes for every endpoint (particularly /domains/lookup
 * and /domains/{domain}/information). The response parsing below is written
 * defensively (checks a few likely key names) but MUST be verified against
 * real API responses in your environment — see the "VERIFY" comments.
 *
 * Install:
 *   1. Copy this file to [FOSSBilling]/library/Registrar/Adapter/Hostafrica.php
 *   2. In FOSSBilling admin: System -> Domain registration -> New domain registrar
 *      -> select "Hostafrica" -> enter your reseller email + API key.
 *   3. Add TLDs under System -> Domain registration -> New TLD, and assign
 *      this registrar to them.
 */

use Symfony\Contracts\HttpClient\Exception\HttpExceptionInterface;

class Registrar_Adapter_Hostafrica extends Registrar_AdapterAbstract
{
    public $config = [
        'username' => null, // reseller's client email registered in HostAfrica's WHMCS
        'api-key' => null,  // API key issued by HostAfrica
    ];

    public function __construct($options)
    {
        if (isset($options['username']) && !empty($options['username'])) {
            $this->config['username'] = $options['username'];
            unset($options['username']);
        } else {
            throw new Registrar_Exception('The ":domain_registrar" domain registrar is not fully configured. Please configure the :missing', [':domain_registrar' => 'HostAfrica', ':missing' => 'HostAfrica reseller email/username'], 3001);
        }

        if (isset($options['api-key']) && !empty($options['api-key'])) {
            $this->config['api-key'] = $options['api-key'];
            unset($options['api-key']);
        } else {
            throw new Registrar_Exception('The ":domain_registrar" domain registrar is not fully configured. Please configure the :missing', [':domain_registrar' => 'HostAfrica', ':missing' => 'HostAfrica API Key'], 3001);
        }
    }

    public static function getConfig(): array
    {
        return [
            'label' => 'Manages domains on HostAfrica via their Domain Reseller API. You need an active HostAfrica reseller account. Get your API key from your HostAfrica reseller dashboard.',
            'form' => [
                'username' => [
                    'text',
                    [
                        'label' => 'HostAfrica reseller email (the email address of the reseller client registered in HostAfrica\'s WHMCS)',
                        'description' => 'Used as the "username" header for every API call',
                    ],
                ],
                'api-key' => [
                    'password',
                    [
                        'label' => 'HostAfrica API Key',
                        'description' => 'Used to derive the hourly auth token (HMAC-SHA256) for every API call',
                        'required' => true,
                    ],
                ],
            ],
        ];
    }

    /* -----------------------------------------------------------------
     * Availability / transfer eligibility
     * --------------------------------------------------------------- */

    public function isDomainAvailable(Registrar_Domain $domain): bool
    {
        $params = [
            'searchTerm' => $domain->getSld(),
            // getTld() defaults to returning the TLD WITH its leading dot (FOSSBilling
            // stores TLDs as e.g. ".com" — see library/Registrar/Domain.php::getTld()).
            // HostAfrica's reseller API (a WHMCS DomainsReseller addon) expects bare
            // TLDs, so this must be getTld(false) or every lookup silently returns
            // no matches for a TLD that doesn't exist.
            'tldsToInclude' => [$domain->getTld(false)],
            'isIdnDomain' => false,
            'premiumEnabled' => false,
        ];

        $result = $this->_makeRequest('domains/lookup', $params, 'POST');

        // Confirmed shape (tested against live API): a JSON array of result
        // objects, each with "domainName" and a boolean "isAvailable".
        if (is_array($result)) {
            foreach ($result as $row) {
                if (!is_array($row)) {
                    continue;
                }
                if (isset($row['domainName']) && strtolower((string) $row['domainName']) == strtolower($domain->getName())) {
                    return (bool) ($row['isAvailable'] ?? false);
                }
            }
            // Single-domain lookups return a one-element array; if there's
            // exactly one result and no name matched (e.g. punycode/case
            // differences), fall back to it rather than failing blind.
            if (count($result) === 1 && isset($result[0]['isAvailable'])) {
                return (bool) $result[0]['isAvailable'];
            }
        }

        $this->getLog()->warning('HostAfrica: could not parse availability response for ' . $domain->getName() . ', raw: ' . json_encode($result));

        return false;
    }

    public function isDomaincanBeTransferred(Registrar_Domain $domain): bool
    {
        // HostAfrica's docs don't expose a dedicated "validate transfer"
        // endpoint. We optimistically allow the transfer flow to proceed;
        // HostAfrica will reject at /order/domains/transfer if the domain
        // is genuinely not transferable.
        return true;
    }

    /* -----------------------------------------------------------------
     * Register / transfer / renew / delete
     * --------------------------------------------------------------- */

    public function registerDomain(Registrar_Domain $domain): bool
    {
        $params = [
            'domain' => $domain->getName(),
            'regperiod' => $domain->getRegistrationPeriod(),
            'nameservers' => $this->_buildNameservers($domain),
            'contacts' => $this->_buildContacts($domain),
            'addons' => $this->_buildAddons($domain),
            'idnLanguage' => '',
        ];

        $result = $this->_makeRequest('order/domains/register', $params, 'POST');

        return $this->_isSuccess($result);
    }

    public function transferDomain(Registrar_Domain $domain): bool
    {
        $params = [
            'domain' => $domain->getName(),
            'eppcode' => $domain->getEpp(),
            'regperiod' => $domain->getRegistrationPeriod(),
            'nameservers' => $this->_buildNameservers($domain),
            'contacts' => $this->_buildContacts($domain),
            'addons' => $this->_buildAddons($domain),
            'idnLanguage' => '',
        ];

        $result = $this->_makeRequest('order/domains/transfer', $params, 'POST');

        return $this->_isSuccess($result);
    }

    public function renewDomain(Registrar_Domain $domain): bool
    {
        $params = [
            'domain' => $domain->getName(),
            'regperiod' => $domain->getRegistrationPeriod(),
            'addons' => $this->_buildAddons($domain),
            'idnLanguage' => '',
        ];

        $result = $this->_makeRequest('order/domains/renew', $params, 'POST');

        return $this->_isSuccess($result);
    }

    public function deleteDomain(Registrar_Domain $domain): bool
    {
        $params = [
            'domain' => $domain->getName(),
        ];

        $result = $this->_makeRequest("domains/{$domain->getName()}/delete", $params, 'POST');

        return $this->_isSuccess($result);
    }

    /* -----------------------------------------------------------------
     * Domain details / nameservers / EPP / lock / privacy
     * --------------------------------------------------------------- */

    public function getDomainDetails(Registrar_Domain $domain)
    {
        // /sync is the only endpoint that returns expiry; /information does not.
        $sync = $this->_makeRequest("domains/{$domain->getName()}/sync", [], 'POST');
        if (is_array($sync) && isset($sync['expirydate'])) {
            $domain->setExpirationTime(strtotime((string) $sync['expirydate']));
        }

        $info = $this->_makeRequest("domains/{$domain->getName()}/information", [], 'GET');
        if (is_array($info) && isset($info['transferLock'])) {
            // transferLock is a bool here; surface it via privacy/lock if your
            // FOSSBilling version's Registrar_Domain exposes a lock setter.
        }
        if (is_array($info) && isset($info['nameservers']) && is_array($info['nameservers'])) {
            $ns = $info['nameservers'];
            if (isset($ns['ns1'])) {
                $domain->setNs1($ns['ns1']);
            }
            if (isset($ns['ns2'])) {
                $domain->setNs2($ns['ns2']);
            }
            if (isset($ns['ns3'])) {
                $domain->setNs3($ns['ns3']);
            }
            if (isset($ns['ns4'])) {
                $domain->setNs4($ns['ns4']);
            }
        }

        $contact = $this->_makeRequest("domains/{$domain->getName()}/contact", [], 'GET');
        if (is_array($contact) && isset($contact['Registrant'])) {
            $rc = $contact['Registrant'];
            $c = new Registrar_Domain_Contact();
            $c->setName($rc['Contact_Name'] ?? '')
                ->setEmail($rc['Email'] ?? '')
                ->setCompany(($rc['Organisation'] ?? '') ?: '')
                ->setTel($rc['Phone'] ?? '')
                ->setAddress1($rc['Address_line_1'] ?? '')
                ->setAddress2(($rc['Address_line_2'] ?? '') == '-' ? '' : ($rc['Address_line_2'] ?? ''))
                ->setCity($rc['TownCity'] ?? '')
                ->setState($rc['State'] ?? '')
                ->setZip($rc['Zip_code'] ?? '')
                ->setCountry($rc['Country_Code'] ?? '');
            $domain->setContactRegistrar($c);
        }

        return $domain;
    }

    public function modifyNs(Registrar_Domain $domain): bool
    {
        $params = ['domain' => $domain->getName()] + $this->_buildNameservers($domain);

        $result = $this->_makeRequest("domains/{$domain->getName()}/nameservers", $params, 'POST');

        return $this->_isSuccess($result);
    }

    public function modifyContact(Registrar_Domain $domain): bool
    {
        $params = [
            'domain' => $domain->getName(),
            'contactdetails' => $this->_buildContacts($domain),
        ];

        $result = $this->_makeRequest("domains/{$domain->getName()}/contact", $params, 'POST');

        return $this->_isSuccess($result);
    }

    public function getEpp(Registrar_Domain $domain)
    {
        $result = $this->_makeRequest("domains/{$domain->getName()}/eppcode", [], 'GET');

        // Confirmed shape: {"eppcode": "...", "status": "success", "message": ""}
        if (is_array($result) && array_key_exists('eppcode', $result)) {
            return $result['eppcode'];
        }

        if (is_string($result) && strlen($result) > 0) {
            return $result;
        }

        $placeholders = [':action:' => 'get the transfer code (EPP)', ':type:' => 'HostAfrica'];
        throw new Registrar_Exception('Failed to :action: with the :type: registrar, check the error logs for further details', $placeholders);
    }

    public function lock(Registrar_Domain $domain): bool
    {
        $params = [
            'domain' => $domain->getName(),
            'lockstatus' => 'locked',
        ];

        $result = $this->_makeRequest("domains/{$domain->getName()}/lock", $params, 'POST');

        return $this->_isSuccess($result);
    }

    public function unlock(Registrar_Domain $domain): bool
    {
        $params = [
            'domain' => $domain->getName(),
            'lockstatus' => 'unlocked',
        ];

        $result = $this->_makeRequest("domains/{$domain->getName()}/lock", $params, 'POST');

        return $this->_isSuccess($result);
    }

    public function enablePrivacyProtection(Registrar_Domain $domain): bool
    {
        $params = [
            'domain' => $domain->getName(),
            'status' => 1,
        ];

        $result = $this->_makeRequest("domains/{$domain->getName()}/protectid", $params, 'POST');

        return $this->_isSuccess($result);
    }

    public function disablePrivacyProtection(Registrar_Domain $domain): bool
    {
        $params = [
            'domain' => $domain->getName(),
            'status' => 0,
        ];

        $result = $this->_makeRequest("domains/{$domain->getName()}/protectid", $params, 'POST');

        return $this->_isSuccess($result);
    }

    /* -----------------------------------------------------------------
     * Helpers
     * --------------------------------------------------------------- */

    private function _buildNameservers(Registrar_Domain $domain): array
    {
        $ns = [
            'ns1' => $domain->getNs1(),
            'ns2' => $domain->getNs2(),
        ];
        if ($domain->getNs3()) {
            $ns['ns3'] = $domain->getNs3();
        }
        if ($domain->getNs4()) {
            $ns['ns4'] = $domain->getNs4();
        }

        return $ns;
    }

    private function _buildAddons(Registrar_Domain $domain): array
    {
        return [
            'dnsmanagement' => 0,
            'emailforwarding' => 0,
            // 0 = no privacy add-on at order time; use enablePrivacyProtection()
            // separately if/when the client opts in, since toggling this on
            // triggers a paid HostAfrica service per their docs.
            'idprotection' => $domain->getPrivacyEnabled() ? 1 : 0,
        ];
    }

    /**
     * HostAfrica's "Contacts" model wants registrant/tech/billing/admin,
     * each shaped like their "Contact" model (firstname, lastname, email,
     * companyname, address1/2, city, state, postcode, country, phonenumber).
     * FOSSBilling only stores a single registrar contact by default, so we
     * reuse it for all four roles unless your checkout collects more.
     */
    private function _buildContacts(Registrar_Domain $domain): array
    {
        $c = $domain->getContactRegistrar();

        $name = (string) $c->getName();
        $parts = explode(' ', trim($name), 2);
        $firstname = $parts[0] ?? $name;
        $lastname = $parts[1] ?? '';

        $contact = [
            'firstname' => $firstname,
            'lastname' => $lastname,
            'fullname' => $name,
            'companyname' => $c->getCompany() ?: 'N/A',
            'email' => $c->getEmail(),
            'address1' => $c->getAddress1(),
            'address2' => $c->getAddress2() ?: '',
            'city' => $c->getCity(),
            'state' => $c->getState(),
            'postcode' => $c->getZip(),
            'country' => $c->getCountry(),
            'phonenumber' => $this->_formatPhone($c->getTelCc(), $c->getTel()),
        ];

        return [
            'registrant' => $contact,
            'tech' => $contact,
            'billing' => $contact,
            'admin' => $contact,
        ];
    }

    private function _formatPhone($cc, $tel): string
    {
        $cc = preg_replace('/[^0-9]/', '', (string) $cc);
        $tel = preg_replace('/[^0-9]/', '', (string) $tel);

        return $cc ? "+{$cc}.{$tel}" : $tel;
    }

    /**
     * Confirmed envelope variants seen from live testing: {"status":"success",...}
     * on nameservers/eppcode calls, and bare strings like "unlocked" on others.
     * Kept the other defensive checks since not every endpoint has been
     * exercised yet (register/transfer/renew/delete/lock writes).
     */
    private function _isSuccess($result): bool
    {
        if ($result === true) {
            return true;
        }

        if (is_string($result)) {
            // e.g. lock/unlock endpoints may just echo back "locked"/"unlocked"
            return !str_contains(strtolower($result), 'error');
        }

        if (is_array($result)) {
            if (isset($result['status']) && in_array(strtolower((string) $result['status']), ['success', 'ok', 'completed'], true)) {
                return true;
            }
            if (isset($result['success']) && $result['success']) {
                return true;
            }
            if (isset($result['result']) && $result['result']) {
                return true;
            }
        }

        $this->getLog()->warning('HostAfrica: unrecognised response, treating as failure: ' . json_encode($result));

        return false;
    }

    public function isTestEnv()
    {
        return $this->_testMode;
    }

    private function _getApiUrl(): string
    {
        return 'https://my.hostafrica.com/modules/addons/DomainsReseller/api/index.php/';
    }

    /**
     * HostAfrica's auth token is an HMAC-SHA256 of the API key, keyed by
     * "email:YY-mm-dd HH" (UTC, truncated to the hour), base64-encoded.
     * Per their docs this means the token is only valid within the current
     * UTC hour, so it must be generated fresh on every request rather than
     * cached.
     */
    private function _buildAuthHeaders(): array
    {
        $username = $this->config['username'];
        $apiKey = $this->config['api-key'];

        $token = base64_encode(hash_hmac('sha256', $apiKey, $username . ':' . gmdate('y-m-d H')));

        return [
            'username: ' . $username,
            'token: ' . $token,
        ];
    }

    /**
     * @param string $action e.g. "order/domains/register" or "domains/{domain}/lock"
     * @param array  $params
     * @param string $method 'GET' or 'POST'
     */
    protected function _makeRequest($action, $params = [], $method = 'GET'): array|string|bool
    {
        $client = $this->getHttpClient()->withOptions([
            'timeout' => 60,
        ]);

        $callUrl = $this->_getApiUrl() . $action;
        $headers = $this->_buildAuthHeaders();

        try {
            if ($method == 'POST') {
                $result = $client->request('POST', $callUrl, [
                    'headers' => $headers,
                    'body' => http_build_query($params),
                ]);
            } else {
                $query = empty($params) ? '' : ('?' . http_build_query($params));
                $result = $client->request('GET', $callUrl . $query, [
                    'headers' => $headers,
                ]);
            }

            $this->getLog()->info('HostAfrica API ' . $method . ' ' . $callUrl . ' -> ' . $result->getContent(false));
        } catch (HttpExceptionInterface $error) {
            $e = new Registrar_Exception("HttpClientException: {$error->getMessage()}.");
            $this->getLog()->error($e->getMessage());

            throw $e;
        }

        $content = $result->getContent(false);

        if (in_array($content, ['true', 'false'], true)) {
            return $content === 'true';
        }

        $json = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // Not JSON — return the raw string (e.g. a plain EPP code).
            return $content;
        }

        // VERIFY: tighten this once you've seen HostAfrica's real error
        // envelope shape (their docs don't document error responses).
        if (is_array($json) && isset($json['error'])) {
            error_log('HostAfrica error: ' . json_encode($json['error']));
            $placeholders = [':action:' => $action, ':type:' => 'HostAfrica'];

            throw new Registrar_Exception('Failed to :action: with the :type: registrar, check the error logs for further details', $placeholders);
        }

        return $json;
    }
}

<?php

declare(strict_types=1);
/**
 * Google OAuth 2.0 (Sign in with Google) helper for client login/signup.
 * KZD Solutions (kzdsolutions.co.za / KZDBilling)
 *
 * No composer dependency — plain REST calls via the shared $di['http_client'],
 * matching how library/Payment/Adapter/Paystack.php talks to Paystack's API.
 *
 * Flow:
 *   1. buildAuthUrl() — client-facing "Sign in with Google" link, with a
 *      random `state` value stored in session for CSRF protection.
 *   2. Google redirects the browser back to client/google-callback with
 *      ?code=...&state=... (see Client\Controller\Client::get_google_callback()).
 *   3. exchangeCodeForTokens() + getUserInfo() turn that code into a verified
 *      email address — the only thing the rest of the login/signup flow
 *      actually trusts from Google.
 */

namespace FOSSBilling\Security;

use FOSSBilling\InjectionAwareInterface;
use Pimple\Container;

class GoogleOAuth implements InjectionAwareInterface
{
    private const string AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const string TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const string USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

    protected ?Container $di = null;

    public function setDi(Container $di): void
    {
        $this->di = $di;
    }

    public function getDi(): ?Container
    {
        return $this->di;
    }

    public function isConfigured(): bool
    {
        return $this->getClientId() !== '' && $this->getClientSecret() !== '';
    }

    public function getClientId(): string
    {
        return trim((string) $this->di['mod_service']('system')->getParamValue('google_oauth_client_id', ''));
    }

    private function getClientSecret(): string
    {
        return trim((string) $this->di['mod_service']('system')->getParamValue('google_oauth_client_secret', ''));
    }

    /**
     * Must match a redirect URI registered for this OAuth client in the
     * Google Cloud Console exactly, including scheme and trailing slash.
     */
    public function getRedirectUri(): string
    {
        return $this->di['tools']->url('client/google-callback');
    }

    public function buildAuthUrl(string $state): string
    {
        $params = [
            'client_id' => $this->getClientId(),
            'redirect_uri' => $this->getRedirectUri(),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'access_type' => 'online',
            'prompt' => 'select_account',
        ];

        return self::AUTH_URL . '?' . http_build_query($params);
    }

    /**
     * @throws \FOSSBilling\Exception if Google rejects the code or the
     *                                request fails outright
     */
    public function exchangeCodeForTokens(string $code): array
    {
        try {
            $response = $this->di['http_client']->request('POST', self::TOKEN_URL, [
                'body' => [
                    'code' => $code,
                    'client_id' => $this->getClientId(),
                    'client_secret' => $this->getClientSecret(),
                    'redirect_uri' => $this->getRedirectUri(),
                    'grant_type' => 'authorization_code',
                ],
            ]);
            $data = json_decode($response->getContent(false), true);
        } catch (\Throwable $e) {
            error_log('Google OAuth token exchange error: ' . $e->getMessage());
            $data = null;
        }

        if (!is_array($data) || empty($data['access_token'])) {
            throw new \FOSSBilling\Exception('Could not complete sign-in with Google. Please try again.');
        }

        return $data;
    }

    /**
     * @throws \FOSSBilling\Exception if the access token is rejected or the
     *                                account's email isn't verified
     */
    public function getUserInfo(string $accessToken): array
    {
        try {
            $response = $this->di['http_client']->request('GET', self::USERINFO_URL, [
                'headers' => ['Authorization' => 'Bearer ' . $accessToken],
            ]);
            $data = json_decode($response->getContent(false), true);
        } catch (\Throwable $e) {
            error_log('Google OAuth userinfo error: ' . $e->getMessage());
            $data = null;
        }

        if (!is_array($data) || empty($data['email'])) {
            throw new \FOSSBilling\Exception('Could not retrieve your Google account details. Please try again.');
        }

        // email_verified comes back as a bool from this endpoint, but Google's
        // docs note it can be a string on some responses -- normalize it.
        $verified = $data['email_verified'] ?? false;
        if ($verified === 'false' || $verified === false || $verified === 0 || $verified === '0') {
            throw new \FOSSBilling\Exception('Your Google account email is not verified. Please verify it with Google first.');
        }

        return $data;
    }
}

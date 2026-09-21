<?php

declare(strict_types=1);
/**
 * Copyright 2022-2025 FOSSBilling
 * SPDX-License-Identifier: Apache-2.0.
 *
 * @copyright FOSSBilling (https://www.fossbilling.org)
 * @license http://www.apache.org/licenses/LICENSE-2.0 Apache-2.0
 */

namespace Box\Mod\Client\Controller;

use FOSSBilling\Security\RandomizedTimeFloor;
use Symfony\Component\HttpFoundation\Response;

class Client implements \FOSSBilling\InjectionAwareInterface
{
    protected ?\Pimple\Container $di = null;

    public function setDi(\Pimple\Container $di): void
    {
        $this->di = $di;
    }

    public function getDi(): ?\Pimple\Container
    {
        return $this->di;
    }

    public function register(\Box_App &$app): void
    {
        $app->get('/client/reset-password-confirm/:hash', 'get_reset_password_confirm', ['hash' => '[a-z0-9]+'], static::class);
        $app->get('/client', 'get_client_index', [], static::class);
        $app->get('/client/logout', 'get_client_logout', [], static::class);
        $app->get('/client/oauth/google/start', 'get_oauth_google_start', [], static::class);
        $app->get('/client/oauth/google/callback', 'get_oauth_google_callback', [], static::class);
        $app->get('/client/oauth/google/link', 'get_oauth_google_link', [], static::class);
        $app->get('/client/:page', 'get_client_page', ['page' => '[a-z0-9-]+'], static::class);
        $app->get('/client/confirm-email/:hash', 'get_client_confirmation', ['page' => '[a-z0-9-]+'], static::class);
    }

    public function get_client_index(\Box_App $app): string
    {
        $this->di['is_client_logged'];

        return $app->render('mod_client_index');
    }

    public function get_client_confirmation(\Box_App $app, $hash): string|Response
    {
        if ($error = $this->checkPageRateLimit($app, 'client_email_confirm_ip')) {
            return $error;
        }

        $startedAt = microtime(true);
        $service = $this->di['mod_service']('client');

        try {
            $service->approveClientEmailByHash($hash);
        } finally {
            RandomizedTimeFloor::apply($startedAt);
        }

        $systemService = $this->di['mod_service']('System');
        $systemService->setPendingMessage(__trans('Email address was confirmed'));

        return $app->redirect('/');
    }

    public function get_client_logout(\Box_App $app): Response
    {
        $api = $this->di['api_client'];
        $api->profile_logout();

        return $app->redirect('/');
    }

    /**
     * Step 1 of Google Sign-In: redirect the browser to Google's own consent
     * screen. The `state` value is a self-contained, HMAC-signed token (see
     * buildOAuthState()/parseOAuthState()) rather than a session-stored one --
     * this app's session cookie is SameSite=Strict (security.mode: strict),
     * which browsers withhold on the cross-site top-level navigation Google's
     * redirect back to get_oauth_google_callback() is, so anything stored in
     * *this* request's session would already be gone by the time the callback
     * runs in a *different*, freshly-started session. Signing the state
     * itself sidesteps that entirely, without loosening the cookie policy
     * site-wide just for this one flow.
     */
    public function get_oauth_google_start(\Box_App $app): Response
    {
        if ($error = $this->checkPageRateLimit($app, 'client_oauth_google_start_ip')) {
            return $error;
        }

        $service = $this->di['mod_service']('client');
        if (!$service->isGoogleOAuthEnabled()) {
            return $app->redirect('login');
        }

        $requestedRedirect = (string) $this->di['request']->query->get('redirect_uri', '/');

        $state = $this->buildOAuthState([
            'redirect_uri' => $service->sanitizeInternalRedirect($requestedRedirect),
            'expires' => time() + 600,
            'nonce' => bin2hex(random_bytes(16)),
        ]);

        $callbackUrl = $this->di['url']->link('client/oauth/google/callback');
        $authUrl = $service->getGoogleClient()->getAuthorizationUrl($state, $callbackUrl);

        return $app->redirectUrl($authUrl);
    }

    /**
     * Step 2: Google redirects back here with ?code=&state= (or ?error=).
     * Resolves the FOSSBilling client this Google identity belongs to --
     * by existing google_sub link, by a password-confirmed link to a
     * matching-email account, or by creating a brand-new account -- see
     * Client\Service for the account-resolution rules and why matching by
     * email alone is never sufficient to authenticate.
     */
    public function get_oauth_google_callback(\Box_App $app): Response
    {
        if ($error = $this->checkPageRateLimit($app, 'client_oauth_google_callback_ip')) {
            return $error;
        }

        $service = $this->di['mod_service']('client');
        $systemService = $this->di['mod_service']('system');
        $query = $this->di['request']->query;

        if ($query->get('error')) {
            $systemService->setPendingMessage(__trans('Google sign-in was cancelled.'));

            return $this->interstitialRedirect($this->di['url']->link('login'));
        }

        $statePayload = $this->parseOAuthState((string) $query->get('state', ''));
        if (!$service->isGoogleOAuthEnabled() || $statePayload === null || ($statePayload['expires'] ?? 0) < time()) {
            $this->di['logger']->setChannel('security')->info('Google OAuth callback rejected from IP %s: invalid or expired state', $this->di['request']->getClientIp());
            $systemService->setPendingMessage(__trans('Your Google sign-in request expired or is invalid. Please try again.'));

            return $this->interstitialRedirect($this->di['url']->link('login'));
        }

        $redirectUri = $service->sanitizeInternalRedirect($statePayload['redirect_uri'] ?? '/');

        $code = (string) $query->get('code', '');
        if ($code === '') {
            $systemService->setPendingMessage(__trans('Google did not return an authorization code. Please try again.'));

            return $this->interstitialRedirect($this->di['url']->link('login'));
        }

        try {
            $callbackUrl = $this->di['url']->link('client/oauth/google/callback');
            $profile = $service->getGoogleClient()->exchangeCodeAndGetProfile($code, $callbackUrl);

            $existingBySub = $service->findClientByGoogleSub($profile['sub']);
            if ($existingBySub instanceof \Model_Client) {
                $service->establishClientLoginSession($existingBySub);

                return $this->interstitialRedirect($this->di['url']->link($redirectUri));
            }

            if (empty($profile['email']) || empty($profile['email_verified'])) {
                $systemService->setPendingMessage(__trans('Your Google account does not have a verified email address, so it cannot be used to sign in.'));

                return $this->interstitialRedirect($this->di['url']->link('login'));
            }

            $existingByEmail = $service->findClientByEmail($profile['email']);
            if ($existingByEmail instanceof \Model_Client) {
                $this->di['session']->set('oauth_google_pending_link', [
                    'sub' => $profile['sub'],
                    'email' => $profile['email'],
                    'expires' => time() + 600,
                ]);

                return $this->interstitialRedirect($this->di['url']->link('client/oauth/google/link'));
            }

            $client = $service->googleCreateClient($profile);
            $service->establishClientLoginSession($client);

            return $this->interstitialRedirect($this->di['url']->link($redirectUri));
        } catch (\Throwable $e) {
            $this->di['logger']->setChannel('security')->error('Google OAuth callback failed from IP %s: %s', $this->di['request']->getClientIp(), $e->getMessage());
            $systemService->setPendingMessage(__trans('We could not verify your Google account. Please try again or use your email and password.'));

            return $this->interstitialRedirect($this->di['url']->link('login'));
        }
    }

    /**
     * Redirects via a self-refreshing HTML page instead of a raw HTTP 3xx.
     *
     * Only needed for responses to get_oauth_google_callback() specifically:
     * that request arrives as part of a navigation that started cross-site
     * (Google's redirect to us), and a plain Location-header redirect issued
     * from within that same navigation can still be treated by the browser
     * as part of the original cross-site chain -- meaning a session cookie
     * this response just set (new login session, or oauth_google_pending_link
     * data) isn't reliably sent back on the very next hop, even though that
     * hop's target is our own domain. Rendering a normal 200 HTML page first
     * means the browser finishes loading a page on our own origin before any
     * further navigation happens, so the follow-up request (whether the user
     * clicks the fallback link or the meta-refresh fires) is unambiguously
     * same-site and carries the cookie normally.
     */
    private function interstitialRedirect(string $absoluteUrl): Response
    {
        $safeUrl = htmlspecialchars($absoluteUrl, ENT_QUOTES, 'UTF-8');
        $html = '<!doctype html><html><head><meta charset="utf-8">'
            . '<meta http-equiv="refresh" content="0;url=' . $safeUrl . '">'
            . '<title>' . __trans('Redirecting…') . '</title></head><body>'
            . '<p>' . __trans('Redirecting…') . ' <a href="' . $safeUrl . '">' . __trans('Click here if you are not redirected automatically.') . '</a></p>'
            . '</body></html>';

        return new Response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    /**
     * Shown when a Google sign-in's verified email matches an existing,
     * not-yet-linked FOSSBilling account. Renders a password-confirmation
     * form; the actual link+login happens in
     * Api\Guest::oauth_google_link_confirm() once that's submitted.
     */
    public function get_oauth_google_link(\Box_App $app): string|Response
    {
        $pending = $this->di['session']->get('oauth_google_pending_link');
        if (!is_array($pending) || empty($pending['email']) || ($pending['expires'] ?? 0) < time()) {
            $this->di['session']->delete('oauth_google_pending_link');

            return $app->redirect('login');
        }

        return $app->render('mod_client_oauth_google_link', ['google_link_email' => $pending['email']]);
    }

    /**
     * Signs an OAuth `state` payload so get_oauth_google_callback() can
     * verify it came from this app and hasn't been tampered with or replayed
     * past its own embedded expiry -- with no session lookup involved (see
     * get_oauth_google_start()'s docblock for why session-based state doesn't
     * survive the round trip through Google).
     */
    private function buildOAuthState(array $payload): string
    {
        $encoded = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
        $signature = hash_hmac('sha256', $encoded, $this->getOAuthStateKey());

        return $encoded . '.' . $signature;
    }

    /**
     * Verifies and decodes a state token built by buildOAuthState(). Returns
     * null on any signature mismatch or malformed input -- callers still
     * check the payload's own `expires` value themselves.
     */
    private function parseOAuthState(string $state): ?array
    {
        $parts = explode('.', $state, 2);
        if (count($parts) !== 2) {
            return null;
        }

        [$encoded, $signature] = $parts;
        $expectedSignature = hash_hmac('sha256', $encoded, $this->getOAuthStateKey());
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $decoded = base64_decode(strtr($encoded, '-_', '+/'), true);
        if ($decoded === false || !json_validate($decoded)) {
            return null;
        }

        $payload = json_decode($decoded, true);

        return is_array($payload) ? $payload : null;
    }

    private function getOAuthStateKey(): string
    {
        return (string) \FOSSBilling\Config::getProperty('info.salt');
    }

    public function get_client_page(\Box_App $app, $page): string
    {
        $this->di['is_client_logged'];
        $template = 'mod_client_' . $page;

        return $app->render($template);
    }

    public function get_reset_password_confirm(\Box_App $app, $hash): string|Response
    {
        if ($error = $this->checkPageRateLimit($app, 'client_password_reset_confirm_ip')) {
            return $error;
        }

        $service = $this->di['mod_service']('client');
        $this->di['events_manager']->fire(['event' => 'onBeforePasswordResetClient']);
        $data = [
            'hash' => $hash,
        ];

        $startedAt = microtime(true);

        try {
            $result = $service->password_reset_valid($data);
        } finally {
            RandomizedTimeFloor::apply($startedAt);
        }

        if ($result !== false) {
            return $app->render('mod_client_set_new_password');
        }

        return $app->redirect('/');
    }

    private function checkPageRateLimit(\Box_App $app, string $policy): ?Response
    {
        $result = $this->di['rate_limiter']->consume($policy, (string) $this->di['request']->getClientIp());
        if (!$result->isLimited()) {
            return null;
        }

        $headers = [];
        if ($result->hasRetryAfter()) {
            $headers['Retry-After'] = (string) $result->getRetryAfterSeconds();
        }

        return $app->errorResponse(new \FOSSBilling\Security\RateLimitException($result), 429, $headers);
    }
}

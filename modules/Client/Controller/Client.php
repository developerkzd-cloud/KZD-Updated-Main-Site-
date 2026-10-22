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
        $app->get('/client/google-start', 'get_google_start', [], static::class);
        $app->get('/client/google-callback', 'get_google_callback', [], static::class);
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
     * Entry point for the "Continue with Google" link on the login/signup
     * pages. Stores a random `state` (CSRF protection for the OAuth
     * round-trip) and the page to return to, then sends the browser to
     * Google's consent screen.
     */
    public function get_google_start(\Box_App $app): Response
    {
        if ($error = $this->checkPageRateLimit($app, 'client_google_oauth_ip')) {
            return $error;
        }

        $googleOAuth = $this->di['google_oauth'];
        if (!$googleOAuth->isConfigured()) {
            $this->di['mod_service']('System')->setPendingMessage(__trans('Sign in with Google is not available right now.'));

            return $app->redirect('/login');
        }

        $state = bin2hex(random_bytes(16));
        $this->di['session']->set('google_oauth_state', $state);

        $redirectUri = (string) $this->di['request']->query->get('redirect_uri', '/');
        $this->di['session']->set('google_oauth_redirect_uri', $redirectUri !== '' ? $redirectUri : '/');

        return $app->redirectUrl($googleOAuth->buildAuthUrl($state));
    }

    /**
     * Google sends the browser back here with ?code=...&state=... after the
     * client approves (or cancels) the consent screen. Any failure here --
     * wrong state, exchange error, account not active -- falls back to the
     * login page with an explanatory message rather than a hard error page,
     * since this is a normal, recoverable outcome (e.g. client clicked
     * "Cancel" on Google's screen).
     */
    public function get_google_callback(\Box_App $app): Response
    {
        if ($error = $this->checkPageRateLimit($app, 'client_google_oauth_ip')) {
            return $error;
        }

        $systemService = $this->di['mod_service']('System');
        $redirectUri = (string) ($this->di['session']->get('google_oauth_redirect_uri') ?: '/');

        $fail = function (string $message) use ($app, $systemService): Response {
            $systemService->setPendingMessage($message);
            $this->di['session']->delete('google_oauth_state');
            $this->di['session']->delete('google_oauth_redirect_uri');

            return $app->redirect('/login');
        };

        $expectedState = $this->di['session']->get('google_oauth_state');
        $state = (string) $this->di['request']->query->get('state', '');
        $code = (string) $this->di['request']->query->get('code', '');

        if ($code === '' || $expectedState === null || !hash_equals((string) $expectedState, $state)) {
            return $fail(__trans('Google sign-in could not be verified. Please try again.'));
        }

        $startedAt = microtime(true);

        try {
            $googleOAuth = $this->di['google_oauth'];
            $tokens = $googleOAuth->exchangeCodeForTokens($code);
            $profile = $googleOAuth->getUserInfo((string) $tokens['access_token']);

            $service = $this->di['mod_service']('client');
            $client = $service->findOrCreateClientFromGoogleProfile($profile);
        } catch (\Throwable $e) {
            RandomizedTimeFloor::apply($startedAt);

            return $fail($e->getMessage());
        }

        RandomizedTimeFloor::apply($startedAt);

        $oldSession = $this->di['session']->getId();
        $this->di['session']->regenerateId();
        $this->di['session']->set('client_id', $client->id);
        $this->di['session']->delete('redirect_uri');
        $this->di['session']->delete('google_oauth_state');
        $this->di['session']->delete('google_oauth_redirect_uri');

        $this->di['logger']->info('Client #%s logged in via Google', $client->id);
        $this->di['events_manager']->fire(['event' => 'onAfterClientLogin', 'params' => ['id' => $client->id, 'ip' => (string) $this->di['request']->getClientIp()]]);

        if (!empty($client->lang)) {
            $this->di['cookie_queue']->queue('fb_locale', (string) $client->lang, strtotime('+1 month'), '/');
        }

        $this->di['mod_service']('cart')->transferFromOtherSession($oldSession);

        return $app->redirect($redirectUri !== '' ? $redirectUri : '/');
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

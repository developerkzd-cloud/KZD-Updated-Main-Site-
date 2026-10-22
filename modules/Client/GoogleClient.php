<?php

declare(strict_types=1);
/**
 * Google Sign-In (OAuth 2.0 Authorization Code flow) for FOSSBilling
 * KZD Solutions (kzdsolutions.co.za / KZDBilling)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Deliberately does NOT verify Google's ID token locally (no JWT/JWKS
 * dependency needed for that, which this project doesn't otherwise vendor).
 * Instead, the access token returned by the code exchange is used to call
 * Google's own userinfo endpoint -- the profile data returned is only ever
 * trusted because Google itself served it back over HTTPS in response to
 * a token Google just issued, never because of anything supplied by the
 * browser/client.
 */

namespace Box\Mod\Client;

use Symfony\Contracts\HttpClient\HttpClientInterface;

final class GoogleClient
{
    private const string AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const string TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
    private const string USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $clientId,
        private readonly string $clientSecret,
    ) {
    }

    public function getAuthorizationUrl(string $state, string $redirectUri): string
    {
        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'access_type' => 'online',
            'prompt' => 'select_account',
        ];

        return self::AUTH_ENDPOINT . '?' . http_build_query($params);
    }

    /**
     * Exchanges the authorization code for a token, then fetches the verified
     * profile from Google's userinfo endpoint using that token.
     *
     * @return array{sub: string, email: ?string, email_verified: bool, given_name: ?string, family_name: ?string, name: ?string}
     *
     * @throws \RuntimeException on any transport, HTTP-status, or malformed-response failure
     */
    public function exchangeCodeAndGetProfile(string $code, string $redirectUri): array
    {
        $tokenResponse = $this->httpClient->request('POST', self::TOKEN_ENDPOINT, [
            'body' => [
                'code' => $code,
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code',
            ],
        ]);

        if ($tokenResponse->getStatusCode() !== 200) {
            throw new \RuntimeException('Google token exchange failed with HTTP status ' . $tokenResponse->getStatusCode());
        }

        $tokenData = $tokenResponse->toArray(false);
        $accessToken = $tokenData['access_token'] ?? null;
        if (!is_string($accessToken) || $accessToken === '') {
            throw new \RuntimeException('Google token exchange response did not include an access token.');
        }

        $userInfoResponse = $this->httpClient->request('GET', self::USERINFO_ENDPOINT, [
            'headers' => ['Authorization' => 'Bearer ' . $accessToken],
        ]);

        if ($userInfoResponse->getStatusCode() !== 200) {
            throw new \RuntimeException('Google userinfo request failed with HTTP status ' . $userInfoResponse->getStatusCode());
        }

        $profile = $userInfoResponse->toArray(false);

        if (empty($profile['sub'])) {
            throw new \RuntimeException('Google userinfo response did not include a subject identifier.');
        }

        return [
            'sub' => (string) $profile['sub'],
            'email' => isset($profile['email']) ? strtolower(trim((string) $profile['email'])) : null,
            'email_verified' => (bool) ($profile['email_verified'] ?? false),
            'given_name' => isset($profile['given_name']) ? (string) $profile['given_name'] : null,
            'family_name' => isset($profile['family_name']) ? (string) $profile['family_name'] : null,
            'name' => isset($profile['name']) ? (string) $profile['name'] : null,
        ];
    }
}

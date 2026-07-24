<?php

/** phpcs:ignoreFile */


/**
 * Class OpenProvider_API
 */
class OpenProvider_API
{
    public $loginusername = null;
    public $loginpassword = null;
    public $loginapiurl = null;
    public $endpoint = null;
    public $output = null;
    public $loginAuthToken = null;

    public $debug = false;


    /**
     * Set API login credentials
     *
     * @param $username
     * @param $password
     * @param $apiUrl
     */
    function setApi_Login($username, $password, $apiUrl)
    {
        $this->loginusername = $username;
        $this->loginpassword = $password;
        $this->loginapiurl = rtrim($apiUrl, '/');
        $this->endpoint = $this->loginapiurl . '/v1beta';
    }

    /**
     * Set API to debug mode
     */
    function setApi_debug()
    {
        $this->debug = true;
    }

    /**
     * Set the API output result
     *
     * @param $outputresult
     */
    function setApi_output($outputresult)
    {
        $this->output = $outputresult;
    }

    /**
     * Request an API token
     *
     * @return mixed
     */
    function requestAccessToken()
    {
        if (!isset($this->loginAuthToken) || empty($this->loginAuthToken)) {
            $data = array(
                'username' => $this->loginusername,
                'password' => $this->loginpassword,
            );

            $url        = $this->endpoint . '/auth/login';

            $ch = curl_init($url);

            // CURLOPT_HTTPHEADER needs a list of "Header: value" strings, not an
            // associative array -- passing the latter silently sends no header
            // at all, which made the login request fail against a strict API.
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
            ]);

            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, "OpenProvider api agent at " . gethostname());
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);

            $response = curl_exec($ch);

            if ($response === false) {
                $curlError = curl_error($ch);
                curl_close($ch);
                throw new Exception('OpenProvider API connection error during login: ' . $curlError);
            }

            curl_close($ch);

            $responseData = json_decode((string)$response, true);

            if (!empty($responseData)) {
                $this->loginAuthToken = $responseData['data']['token'] ?? null;
            }
        }

        return $this->loginAuthToken;
    }

    /**
     * Do API request
     *
     * @param $requesttype
     * @param $request
     * @param array $data
     * @param string $version
     * @return array|mixed|string
     */
    function request($requestMethod, $request, $data = array())
    {
        $accessToken = $this->requestAccessToken();

        if (empty($accessToken)) {
            $error = array();
            $error['error']['message']  = 'Request failed';

            return $error;
        }

        $url        = $this->endpoint . $request;
        if ($requestMethod  === 'GET') {
            $url .= '?' . http_build_query($data);
        }

        $ch         = curl_init($url);

        $headers = [
            "Authorization: Bearer {$accessToken}",
        ];

        // array_merge() returns a new array -- the original code discarded the
        // result instead of assigning it back, so Content-Type was never sent
        // on POST/PUT/DELETE requests. It also passed an associative array to
        // CURLOPT_HTTPHEADER, which curl ignores; it needs "Header: value" strings.
        if ($requestMethod !== 'GET') {
            $headers[] = 'Content-Type: application/json';
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $requestMethod);
        if ($requestMethod !== 'GET') {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, "OpenProvider api agent at " . gethostname());
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        $result     = curl_exec($ch);

        if ($result === false) {
            $curlError = curl_error($ch);
            curl_close($ch);
            throw new Exception("OpenProvider API connection error on {$requestMethod} {$request}: {$curlError}");
        }

        $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        $debugData      = array(
            'request_method'   => $requestMethod,
            'url'           => $url,
            'post_data'      => $data,
            'result'        => $result,
            'http_code'      => $httpCode
        );

        if ($this->debug) {
            var_dump($debugData);
        }

        $result = json_decode($result, 1);
        return $result;
    }
}

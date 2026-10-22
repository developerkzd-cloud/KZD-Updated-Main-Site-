<?php
$root = __DIR__;
$path = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// The AI Website Builder (/build) is a separate Node/Express process
// (kzd-ai-website-builder-app/server) that serves its own static files
// AND proxies /build/api/* to Groq/Pexels with the real keys attached
// server-side. It listens on 127.0.0.1:3001. In production this is an
// nginx `location /build { proxy_pass ... }` block (see that project's
// deploy/DEPLOY.md); here PHP's built-in server plays the same role.
if ($path === '/build' || str_starts_with($path, '/build/')) {
    $target = 'http://127.0.0.1:3001' . $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    $headers = [];
    foreach (getallheaders() as $name => $value) {
        if (in_array(strtolower($name), ['host', 'connection', 'content-length'], true)) {
            continue;
        }
        $headers[] = "$name: $value";
    }

    $ch = curl_init($target);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 30,
    ]);

    if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }

    $response = curl_exec($ch);

    if ($response === false) {
        http_response_code(502);
        header('Content-Type: application/json');
        echo json_encode(['error' => ['message' => 'The website builder service is not running. Start server/index.js in kzd-ai-website-builder-app.']]);
        curl_close($ch);
        exit;
    }

    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $rawHeaders = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    curl_close($ch);

    http_response_code($statusCode);
    foreach (explode("\r\n", $rawHeaders) as $headerLine) {
        $headerLine = trim($headerLine);
        if ($headerLine === '' || !str_contains($headerLine, ':')) {
            continue;
        }
        [$name] = explode(':', $headerLine, 2);
        if (in_array(strtolower($name), ['transfer-encoding', 'connection', 'content-length'], true)) {
            continue;
        }
        header($headerLine, false);
    }
    echo $body;
    exit;
}

$file = $root . $path;

// Flow-mapping screenshots need to be fetch()-able from the Penpot plugin
// iframe (design.penpot.app), a different origin. Headers set before
// `return false` do NOT survive into PHP's own static-file response on
// the built-in dev server, so this path is served explicitly instead.
if (str_starts_with($path, '/public/_flowcaps/') && is_file($file)) {
    header('Access-Control-Allow-Origin: *');
    header('Content-Type: image/png');
    readfile($file);
    exit;
}

if ($path !== '/' && is_file($file)) {
    return false;
}

require $root . '/index.php';

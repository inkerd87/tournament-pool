<?php
/**
 * FreeKassa Payment Creation Endpoint for NightByte
 * Незаблокированное в РФ зеркало (DDoS-Guard / duckgo.io / fmt.me)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

@require_once __DIR__ . '/freekassa-config.php';

$shop_id = defined('FK_SHOP_ID') ? FK_SHOP_ID : (getenv('FREEKASSA_SHOP_ID') ?: '75872');
$api_key = defined('FK_API_KEY') ? FK_API_KEY : (getenv('FREEKASSA_API_KEY') ?: 'bc33c022a82f116ee612de14ea5f8e40');
$secret_1 = defined('FK_SECRET_1') ? FK_SECRET_1 : (getenv('FREEKASSA_SECRET_1') ?: 'владимир');

$raw_input = file_get_contents('php://input');
$data = json_decode($raw_input, true) ?: $_POST;

$amount = isset($data['amount']) ? floatval($data['amount']) : 100.0;
$email = isset($data['email']) ? trim($data['email']) : 'player@nightbyteonline.ru';
$phone = isset($data['phone']) ? preg_replace('/[^\d+]/', '', trim($data['phone'])) : '';
$tournament_id = isset($data['tournamentId']) ? trim($data['tournamentId']) : '';
$tournament_title = isset($data['tournamentTitle']) ? trim($data['tournamentTitle']) : '';
$nickname = isset($data['nickname']) ? trim($data['nickname']) : '';
$game_account = isset($data['gameAccount']) ? trim($data['gameAccount']) : '';
$user_id = isset($data['userId']) ? trim($data['userId']) : '';
$type = isset($data['type']) ? trim($data['type']) : 'topup';
$order_id = 'nb_' . time() . '_' . mt_rand(1000, 9999);

// 42 = СБП (QR код), 36 = Card RUB (Банковские карты МИР/Visa/MasterCard)
$method_code = (isset($data['method']) && $data['method'] === 'card') ? 36 : 42;

// 1. Создание заказа через официальное зеркало FreeKassa API (без VPN)
$nonce = round(microtime(true) * 1000);
$api_payload = [
    'shopId' => intval($shop_id),
    'nonce' => $nonce,
    'paymentId' => $order_id,
    'i' => $method_code,
    'email' => $email ?: 'player@nightbyteonline.ru',
    'ip' => !empty($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '127.0.0.1',
    'amount' => $amount,
    'currency' => 'RUB'
];

if (!empty($phone)) {
    $api_payload['tel'] = $phone;
}

// HMAC-SHA256 подпись FreeKassa API
ksort($api_payload);
$sign_string = implode('|', $api_payload);
$api_payload['signature'] = hash_hmac('sha256', $sign_string, $api_key);

// Пробуем сначала через api.duckgo.io (не заблокировано РКН, DDoS-Guard), затем api.freekassa.net
$api_endpoints = [
    'https://api.duckgo.io/v1/orders/create',
    'https://api.freekassa.net/v1/orders/create'
];

$api_json = null;

foreach ($api_endpoints as $endpoint) {
    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($api_payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $api_res = curl_exec($ch);
    curl_close($ch);

    if ($api_res) {
        $parsed = json_decode($api_res, true);
        if ($parsed && isset($parsed['type']) && $parsed['type'] === 'success' && !empty($parsed['location'])) {
            $api_json = $parsed;
            break;
        }
    }
}

if ($api_json && !empty($api_json['location'])) {
    $checkout_url = $api_json['location'];
    // Заменяем заблокированные домены на незаблокированное зеркало pay.duckgo.io
    $checkout_url = str_replace('https://pay.freekassa.net', 'https://pay.duckgo.io', $checkout_url);
    $checkout_url = str_replace('https://pay.freekassa.ru', 'https://pay.duckgo.io', $checkout_url);

    echo json_encode([
        'success' => true,
        'confirmationUrl' => $checkout_url,
        'orderId' => $order_id,
        'fkOrderId' => $api_json['orderId'] ?? null
    ]);
    exit;
}

// 2. Fallback при сбое связи с API — прямое зеркало pay.duckgo.io
$oa = (floor($amount) == $amount) ? (string)intval($amount) : number_format($amount, 2, '.', '');
$fallback_sign = md5($shop_id . ':' . $oa . ':' . $secret_1 . ':RUB:' . $order_id);
$fallback_url = 'https://pay.duckgo.io/?' . http_build_query([
    'm' => $shop_id,
    'oa' => $oa,
    'o' => $order_id,
    's' => $fallback_sign,
    'currency' => 'RUB',
    'em' => $email,
    'phone' => $phone,
    'lang' => 'ru'
]);

echo json_encode([
    'success' => true,
    'confirmationUrl' => $fallback_url,
    'orderId' => $order_id
]);

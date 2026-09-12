<?php
/**
 * YooKassa Payment Creation Endpoint for NightByte (Sprinthost / Apache PHP)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Конфигурация ЮKassa (ООО НКО «ЮМани»)
// Укажите ваши боевые Shop ID и Секретный ключ или настройте через переменные окружения
$yoo_shop_id = getenv('YOOKASSA_SHOP_ID') ?: '';
$yoo_secret_key = getenv('YOOKASSA_SECRET_KEY') ?: '';

// 2. Получение входных параметров (из JSON или POST)
$raw_input = file_get_contents('php://input');
$data = json_decode($raw_input, true) ?: $_POST;

$amount = isset($data['amount']) ? floatval($data['amount']) : 100.0;
$email = isset($data['email']) ? trim($data['email']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$tournament_id = isset($data['tournamentId']) ? trim($data['tournamentId']) : '';
$tournament_title = isset($data['tournamentTitle']) ? trim($data['tournamentTitle']) : '';
$nickname = isset($data['nickname']) ? trim($data['nickname']) : '';
$game_account = isset($data['gameAccount']) ? trim($data['gameAccount']) : '';
$type = isset($data['type']) ? trim($data['type']) : 'topup';
$return_url = isset($data['returnUrl']) && !empty($data['returnUrl']) 
    ? trim($data['returnUrl']) 
    : 'https://nightbyteonline.ru/payment/return';

$description = isset($data['description']) && !empty($data['description'])
    ? trim($data['description'])
    : ($type === 'registration' 
        ? "Оплата орг. услуг: " . ($tournament_title ?: $tournament_id) . " ({$amount} ₽)"
        : "Пополнение баланса NightByte ({$amount} ₽)");

// 3. Если заданы Shop ID и Secret Key — вызываем официальный API v3 ЮKassa
if (!empty($yoo_shop_id) && !empty($yoo_secret_key)) {
    // Генерация Idempotence-Key UUID
    $idempotence_key = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    $payload = [
        'amount' => [
            'value' => number_format($amount, 2, '.', ''),
            'currency' => 'RUB'
        ],
        'capture' => true,
        'confirmation' => [
            'type' => 'redirect',
            'return_url' => $return_url
        ],
        'description' => mb_substr($description, 0, 128),
        'metadata' => [
            'email' => $email,
            'phone' => $phone,
            'tournamentId' => $tournament_id,
            'tournamentTitle' => $tournament_title,
            'nickname' => $nickname,
            'gameAccount' => $game_account,
            'type' => $type
        ]
    ];

    $ch = curl_init('https://api.yookassa.ru/v3/payments');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Idempotence-Key: ' . $idempotence_key,
        'Authorization: Basic ' . base64_encode($yoo_shop_id . ':' . $yoo_secret_key)
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $res_json = json_decode($response, true);

    if ($http_code === 200 && isset($res_json['confirmation']['confirmation_url'])) {
        echo json_encode([
            'success' => true,
            'confirmationUrl' => $res_json['confirmation']['confirmation_url'],
            'paymentId' => $res_json['id'] ?? ''
        ]);
        exit;
    }

    // Логируем ошибку, если ЮKassa вернула статус отличный от 200
    @file_put_contents(
        __DIR__ . '/yookassa.log',
        "[" . date('Y-m-d H:i:s') . "] API ERROR HTTP {$http_code}: " . $response . "\n",
        FILE_APPEND
    );
}

// 4. Демо/тестовый режим (до внесения боевых ключей в ЛК ЮKassa)
$demo_id = 'test_' . time() . '_' . substr(md5(uniqid()), 0, 6);
$query_parts = [
    'orderId=' . urlencode($demo_id),
    'amount=' . urlencode($amount),
    'status=success',
    'gateway=yookassa',
    'tId=' . urlencode($tournament_id),
    'nick=' . urlencode($nickname),
    'acc=' . urlencode($game_account),
    'email=' . urlencode($email),
    'phone=' . urlencode($phone)
];
$demo_url = $return_url . (strpos($return_url, '?') !== false ? '&' : '?') . implode('&', $query_parts);

echo json_encode([
    'success' => true,
    'confirmationUrl' => $demo_url,
    'paymentId' => $demo_id,
    'isTestMode' => true
]);

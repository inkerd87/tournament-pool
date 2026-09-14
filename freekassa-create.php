<?php
/**
 * FreeKassa Payment Creation Endpoint for NightByte
 * Sprinthost / Apache PHP
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

$shop_id = defined('FK_SHOP_ID') ? FK_SHOP_ID : (getenv('FREEKASSA_SHOP_ID') ?: '');
$secret_1 = defined('FK_SECRET_1') ? FK_SECRET_1 : (getenv('FREEKASSA_SECRET_1') ?: 'владимир');

$raw_input = file_get_contents('php://input');
$data = json_decode($raw_input, true) ?: $_POST;

$amount = isset($data['amount']) ? floatval($data['amount']) : 100.0;
$email = isset($data['email']) ? trim($data['email']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$tournament_id = isset($data['tournamentId']) ? trim($data['tournamentId']) : '';
$tournament_title = isset($data['tournamentTitle']) ? trim($data['tournamentTitle']) : '';
$nickname = isset($data['nickname']) ? trim($data['nickname']) : '';
$game_account = isset($data['gameAccount']) ? trim($data['gameAccount']) : '';
$user_id = isset($data['userId']) ? trim($data['userId']) : '';
$type = isset($data['type']) ? trim($data['type']) : 'topup';

// Форматирование суммы: 100 или 100.50
$oa = (floor($amount) == $amount) ? (string)intval($amount) : number_format($amount, 2, '.', '');
$order_id = 'nb_' . time() . '_' . mt_rand(1000, 9999);
$currency = 'RUB';

// Формула подписи формы оплаты SCI FreeKassa:
// md5(merchant_id:order_amount:secret_word:currency:order_id)
$sign = md5($shop_id . ':' . $oa . ':' . $secret_1 . ':' . $currency . ':' . $order_id);

$query_params = [
    'm' => $shop_id,
    'oa' => $oa,
    'o' => $order_id,
    's' => $sign,
    'currency' => $currency,
    'em' => $email,
    'phone' => $phone,
    'lang' => 'ru',
    'us_userId' => $user_id,
    'us_type' => $type,
    'us_tournamentId' => $tournament_id,
    'us_nickname' => $nickname,
    'us_gameAccount' => $game_account,
];

$payment_url = 'https://pay.freekassa.ru/?' . http_build_query($query_params);

echo json_encode([
    'success' => true,
    'confirmationUrl' => $payment_url,
    'orderId' => $order_id,
    'amount' => $amount,
    'shopId' => $shop_id
]);

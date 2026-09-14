<?php
/**
 * FreeKassa Webhook Notification Handler for NightByte
 * Приём оповещений о платежах (Result URL) на Sprinthost (Apache/PHP)
 */

$timestamp = date('Y-m-d H:i:s');
$raw_input = file_get_contents('php://input');

@require_once __DIR__ . '/freekassa-config.php';

$shop_id = defined('FK_SHOP_ID') ? FK_SHOP_ID : (getenv('FREEKASSA_SHOP_ID') ?: '');
$secret_2 = defined('FK_SECRET_2') ? FK_SECRET_2 : (getenv('FREEKASSA_SECRET_2') ?: 'данила');

// Логируем все входящие уведомления в freekassa.log для диагностики
@file_put_contents(
    __DIR__ . '/freekassa.log',
    "[{$timestamp}] NOTIFICATION {$_SERVER['REQUEST_METHOD']}\nGET: " . json_encode($_GET, JSON_UNESCAPED_UNICODE) . "\nPOST: " . json_encode($_POST, JSON_UNESCAPED_UNICODE) . "\nRAW: {$raw_input}\n\n",
    FILE_APPEND
);

$req = !empty($_POST) ? $_POST : $_GET;

$merchant_id = isset($req['MERCHANT_ID']) ? trim($req['MERCHANT_ID']) : '';
$amount = isset($req['AMOUNT']) ? floatval($req['AMOUNT']) : 0.0;
$order_id = isset($req['MERCHANT_ORDER_ID']) ? trim($req['MERCHANT_ORDER_ID']) : '';
$sign = isset($req['SIGN']) ? trim($req['SIGN']) : '';

// 1. Проверка подписи Result URL:
// md5(MERCHANT_ID:AMOUNT:secret_word_2:MERCHANT_ORDER_ID)
$expected_sign = md5($merchant_id . ':' . $req['AMOUNT'] . ':' . $secret_2 . ':' . $order_id);

if (empty($sign) || strcasecmp($sign, $expected_sign) !== 0) {
    @file_put_contents(
        __DIR__ . '/freekassa.log',
        "[{$timestamp}] ERROR: Invalid signature! Received: {$sign}, Expected: {$expected_sign}\n\n",
        FILE_APPEND
    );
    http_response_code(400);
    die('wrong sign');
}

// 2. Защита от повторной обработки (идемпотентность)
if (!empty($order_id)) {
    $processed_file = __DIR__ . '/processed_ops.txt';
    $processed = @file_exists($processed_file) ? (string)@file_get_contents($processed_file) : '';
    if (strpos($processed, $order_id) !== false) {
        @file_put_contents(
            __DIR__ . '/freekassa.log',
            "[{$timestamp}] SKIP: Order ID {$order_id} already processed\n\n",
            FILE_APPEND
        );
        die('YES');
    }
    @file_put_contents($processed_file, $order_id . "\n", FILE_APPEND);
}

// 3. Получение метаданных платежа
$email = isset($req['P_EMAIL']) ? trim($req['P_EMAIL']) : '';
$phone = isset($req['P_PHONE']) ? trim($req['P_PHONE']) : '';
$user_id = isset($req['us_userId']) ? trim($req['us_userId']) : '';
$type = isset($req['us_type']) ? trim($req['us_type']) : 'topup';
$tournament_id = isset($req['us_tournamentId']) ? trim($req['us_tournamentId']) : '';
$nickname = isset($req['us_nickname']) ? trim($req['us_nickname']) : 'Player';
$game_account = isset($req['us_gameAccount']) ? trim($req['us_gameAccount']) : '';

// 4. Зачисление баланса или регистрация в Supabase
if ($amount > 0) {
    $supabase_url = 'https://qblybjpioynwgheqhxyo.supabase.co/rest/v1';
    $api_key = 'sb_publishable_CAbgrdUXWUeP6squgk98Bg_Ul0oE6BV';

    // Если передан userId
    if (!empty($user_id)) {
        $ch = curl_init($supabase_url . '/users?id=eq.' . urlencode($user_id));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $api_key,
            'Authorization: Bearer ' . $api_key
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        $users = json_decode($res, true);
    } else if (!empty($email)) {
        $clean_email = strtolower($email);
        $ch = curl_init($supabase_url . '/users?email=ilike.' . urlencode($clean_email));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $api_key,
            'Authorization: Bearer ' . $api_key
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        $users = json_decode($res, true);
    } else {
        $users = [];
    }

    if (!empty($users) && isset($users[0]['id'])) {
        $found_user_id = $users[0]['id'];
        $curr_bal = floatval($users[0]['balance_rub'] ?? 0);

        // Если это пополнение баланса
        if (empty($tournament_id) || $type === 'topup') {
            $new_bal = $curr_bal + $amount;
            $ch = curl_init($supabase_url . '/users?id=eq.' . urlencode($found_user_id));
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['balance_rub' => $new_bal]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'apikey: ' . $api_key,
                'Authorization: Bearer ' . $api_key,
                'Prefer: return=minimal'
            ]);
            curl_exec($ch);
            curl_close($ch);

            @file_put_contents(
                __DIR__ . '/freekassa.log',
                "[{$timestamp}] SUCCESS: Credited {$amount} RUB to user {$found_user_id}. New balance: {$new_bal}\n\n",
                FILE_APPEND
            );
        }
    }

    // Если это прямая оплата регистрации на соревнование
    if (!empty($tournament_id)) {
        $reg_data = [
            'tournament_id' => $tournament_id,
            'nickname' => $nickname,
            'game_account' => $game_account,
            'email' => $email ?: ($users[0]['email'] ?? ''),
            'phone' => $phone ?: ($users[0]['phone'] ?? ''),
            'paid_at' => date('c')
        ];

        $ch = curl_init($supabase_url . '/registrations');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($reg_data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'apikey: ' . $api_key,
            'Authorization: Bearer ' . $api_key,
            'Prefer: return=minimal'
        ]);
        curl_exec($ch);
        curl_close($ch);

        @file_put_contents(
            __DIR__ . '/freekassa.log',
            "[{$timestamp}] SUCCESS: Registered {$nickname} for tournament {$tournament_id}\n\n",
            FILE_APPEND
        );
    }
}

// 5. Обязательный ответ для FreeKassa
echo 'YES';
exit;

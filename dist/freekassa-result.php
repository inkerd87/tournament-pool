<?php
/**
 * FreeKassa Result URL Handler for NightByte
 * Merchant ID: 75872
 * Secret 2: данила
 */

// Разрешаем запросы оповещения от FreeKassa
header('Content-Type: text/plain; charset=UTF-8');

$merchant_id = '75872';
$secret_word_2 = 'данила';

// Получаем параметры из $_REQUEST / $_POST
$req_merchant_id = isset($_REQUEST['MERCHANT_ID']) ? trim($_REQUEST['MERCHANT_ID']) : '';
$amount = isset($_REQUEST['AMOUNT']) ? trim($_REQUEST['AMOUNT']) : '';
$order_id = isset($_REQUEST['MERCHANT_ORDER_ID']) ? trim($_REQUEST['MERCHANT_ORDER_ID']) : '';
$sign = isset($_REQUEST['SIGN']) ? trim($_REQUEST['SIGN']) : '';
$intid = isset($_REQUEST['intid']) ? trim($_REQUEST['intid']) : '';

// Пользовательские параметры
$user_type = isset($_REQUEST['us_type']) ? trim($_REQUEST['us_type']) : '';
$user_email = isset($_REQUEST['us_email']) ? trim($_REQUEST['us_email']) : (isset($_REQUEST['P_EMAIL']) ? trim($_REQUEST['P_EMAIL']) : '');
$user_tournament = isset($_REQUEST['us_tournamentid']) ? trim($_REQUEST['us_tournamentid']) : '';
$user_nickname = isset($_REQUEST['us_nickname']) ? trim($_REQUEST['us_nickname']) : '';
$user_gameaccount = isset($_REQUEST['us_gameaccount']) ? trim($_REQUEST['us_gameaccount']) : '';
$user_phone = isset($_REQUEST['us_phone']) ? trim($_REQUEST['us_phone']) : (isset($_REQUEST['P_PHONE']) ? trim($_REQUEST['P_PHONE']) : '');

// Функция логирования платежей
function log_payment($msg) {
    $logfile = __DIR__ . '/freekassa_payments.log';
    $date = date('Y-m-d H:i:s');
    @file_put_contents($logfile, "[$date] " . $msg . "\n", FILE_APPEND);
}

// 1. Проверка обязательных полей
if (empty($req_merchant_id) || empty($amount) || empty($order_id) || empty($sign)) {
    log_payment("ERROR: Missing required fields. Data: " . json_encode($_REQUEST, JSON_UNESCAPED_UNICODE));
    http_response_code(400);
    echo "ERROR: Missing parameters";
    exit;
}

// 2. Проверка ID магазина
if ($req_merchant_id !== $merchant_id) {
    log_payment("ERROR: Invalid merchant ID: $req_merchant_id (expected $merchant_id)");
    http_response_code(400);
    echo "ERROR: Invalid merchant ID";
    exit;
}

// 3. Проверка подписи с Secret Word 2
$expected_sign = md5($merchant_id . ':' . $amount . ':' . $secret_word_2 . ':' . $order_id);

if (strtolower($expected_sign) !== strtolower($sign)) {
    log_payment("ERROR: Bad signature! Expected: $expected_sign, got: $sign. String: {$merchant_id}:{$amount}:***:{$order_id}");
    http_response_code(400);
    echo "bad sign";
    exit;
}

// Подпись верна!
log_payment("SUCCESS: Valid payment order={$order_id}, amount={$amount} RUB, intid={$intid}, email={$user_email}, type={$user_type}");

// 4. Синхронизация с базой данных Supabase через REST API
$supabase_url = 'https://qblybjpioynwgheqhxyo.supabase.co';
$supabase_key = 'sb_publishable_CAbgrdUXWUeP6squgk98Bg_Ul0oE6BV';

try {
    if ($user_type === 'topup' && !empty($user_email)) {
        // 4.1. Получение текущего баланса
        $ch = curl_init("{$supabase_url}/rest/v1/users?email=eq." . urlencode(strtolower($user_email)) . "&select=balance_rub");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: {$supabase_key}",
            "Authorization: Bearer {$supabase_key}"
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        $resp = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $current_balance = 0;
        if ($http_code === 200 && $resp) {
            $users = json_decode($resp, true);
            if (!empty($users) && isset($users[0]['balance_rub'])) {
                $current_balance = floatval($users[0]['balance_rub']);
            }
        }

        $new_balance = $current_balance + floatval($amount);

        // 4.2. Запись нового баланса
        $ch = curl_init("{$supabase_url}/rest/v1/users?email=eq." . urlencode(strtolower($user_email)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['balance_rub' => $new_balance]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: {$supabase_key}",
            "Authorization: Bearer {$supabase_key}",
            "Content-Type: application/json",
            "Prefer: return=minimal"
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_exec($ch);
        curl_close($ch);

        log_payment("BALANCE UPDATED: {$user_email} +{$amount} RUB -> {$new_balance} RUB");
    } elseif ($user_type === 'tournament' && !empty($user_tournament) && !empty($user_email)) {
        // 4.3. Регистрация на турнир
        $reg_id = 'reg_' . time() . '_' . substr(md5($order_id), 0, 6);
        $reg_data = [
            'id' => $reg_id,
            'tournament_id' => $user_tournament,
            'nickname' => $user_nickname ?: 'Player',
            'game_account' => $user_gameaccount ?: '',
            'email' => strtolower($user_email),
            'paid_at' => date('c'),
            'phone' => $user_phone
        ];

        $ch = curl_init("{$supabase_url}/rest/v1/registrations");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($reg_data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: {$supabase_key}",
            "Authorization: Bearer {$supabase_key}",
            "Content-Type: application/json",
            "Prefer: return=minimal"
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_exec($ch);
        curl_close($ch);

        log_payment("REGISTRATION CREATED: {$user_email} on tournament {$user_tournament}");
    }
} catch (Exception $e) {
    log_payment("EXCEPTION during Supabase sync: " . $e->getMessage());
}

// 5. Обязательный ответ для FreeKassa
echo "YES";

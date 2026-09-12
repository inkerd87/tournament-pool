<?php
/**
 * YooKassa Webhook Notification Handler for NightByte
 * Приём уведомлений о платежах от ЮKassa (payment.succeeded) на Sprinthost (Apache/PHP)
 */

header('Content-Type: application/json; charset=utf-8');

$timestamp = date('Y-m-d H:i:s');
$raw_input = file_get_contents('php://input');

// Логируем все входящие уведомления в yookassa.log для диагностики
@file_put_contents(
    __DIR__ . '/yookassa.log',
    "[{$timestamp}] WEBHOOK {$_SERVER['REQUEST_METHOD']} {$_SERVER['REQUEST_URI']}\nPAYLOAD: {$raw_input}\n\n",
    FILE_APPEND
);

$notification = json_decode($raw_input, true);

if (!$notification || !isset($notification['object'])) {
    http_response_code(200);
    echo json_encode(['status' => 'ignored']);
    exit;
}

$event = $notification['event'] ?? '';
$payment = $notification['object'];

// Обрабатываем только успешную оплату (payment.succeeded)
if ($event !== 'payment.succeeded' || ($payment['status'] ?? '') !== 'succeeded') {
    http_response_code(200);
    echo json_encode(['status' => 'ignored_event', 'event' => $event]);
    exit;
}

$payment_id = trim($payment['id'] ?? '');
$amount = floatval($payment['amount']['value'] ?? 0);
$metadata = $payment['metadata'] ?? [];

$email = trim($metadata['email'] ?? ($metadata['client_email'] ?? ''));
$tournament_id = trim($metadata['tournamentId'] ?? '');
$nickname = trim($metadata['nickname'] ?? 'Player');
$game_account = trim($metadata['gameAccount'] ?? '');
$phone = trim($metadata['phone'] ?? '');

// Защита от повторной обработки (идемпотентность)
if (!empty($payment_id)) {
    $processed_file = __DIR__ . '/processed_ops.txt';
    $processed = @file_exists($processed_file) ? (string)@file_get_contents($processed_file) : '';
    if (strpos($processed, $payment_id) !== false) {
        @file_put_contents(
            __DIR__ . '/yookassa.log',
            "[{$timestamp}] SKIP: Payment ID {$payment_id} already processed\n\n",
            FILE_APPEND
        );
        http_response_code(200);
        echo json_encode(['status' => 'already_processed']);
        exit;
    }
    @file_put_contents($processed_file, $payment_id . "\n", FILE_APPEND);
}

// Зачисление баланса или регистрация в Supabase
if ($amount > 0 && !empty($email)) {
    $supabase_url = 'https://qblybjpioynwgheqhxyo.supabase.co/rest/v1';
    $api_key = 'sb_publishable_CAbgrdUXWUeP6squgk98Bg_Ul0oE6BV';

    $clean_email = strtolower($email);
    $is_email = strpos($clean_email, '@') !== false;

    // 1. Поиск пользователя в базе
    $query_param = $is_email 
        ? 'email=ilike.' . urlencode($clean_email) 
        : 'phone=ilike.*' . urlencode(preg_replace('/[^0-9]/', '', $clean_email)) . '*';

    $ch = curl_init($supabase_url . '/users?' . $query_param);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $api_key,
        'Authorization: Bearer ' . $api_key
    ]);
    $res = curl_exec($ch);
    curl_close($ch);

    $users = json_decode($res, true);
    $user_id = null;

    if (!empty($users) && isset($users[0]['id'])) {
        $user_id = $users[0]['id'];
        $curr_bal = floatval($users[0]['balance_rub'] ?? 0);

        // При обычном пополнении увеличиваем баланс
        if (empty($tournament_id)) {
            $new_bal = $curr_bal + $amount;
            $ch = curl_init($supabase_url . '/users?id=eq.' . urlencode($user_id));
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['balance_rub' => $new_bal]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'apikey: ' . $api_key,
                'Authorization: Bearer ' . $api_key,
                'Content-Type: application/json',
                'Prefer: return=minimal'
            ]);
            curl_exec($ch);
            curl_close($ch);

            @file_put_contents(
                __DIR__ . '/yookassa.log',
                "[{$timestamp}] SUPABASE BALANCE UPDATED: {$clean_email} +{$amount} => {$new_bal} RUB\n\n",
                FILE_APPEND
            );
        }
    } else {
        // Создаем нового пользователя
        $new_user_data = [
            'nickname' => $nickname ?: 'Player',
            'balance_rub' => empty($tournament_id) ? $amount : 0
        ];
        if ($is_email) {
            $new_user_data['email'] = $clean_email;
        } else {
            $new_user_data['email'] = $clean_email . '@nightbyte.local';
            $new_user_data['phone'] = $clean_email;
        }

        $ch = curl_init($supabase_url . '/users');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($new_user_data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $api_key,
            'Authorization: Bearer ' . $api_key,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ]);
        $created_res = curl_exec($ch);
        curl_close($ch);

        $created_users = json_decode($created_res, true);
        if (!empty($created_users) && isset($created_users[0]['id'])) {
            $user_id = $created_users[0]['id'];
        }

        @file_put_contents(
            __DIR__ . '/yookassa.log',
            "[{$timestamp}] SUPABASE USER CREATED: {$clean_email}\n\n",
            FILE_APPEND
        );
    }

    // 2. Если была оплата участия в соревновании — записываем регистрацию
    if (!empty($tournament_id)) {
        $reg_data = [
            'tournament_id' => $tournament_id,
            'email' => $clean_email,
            'nickname' => $nickname ?: 'Player',
            'game_account' => $game_account,
            'phone' => $phone,
            'payment_status' => 'paid',
            'payment_id' => $payment_id
        ];

        $ch = curl_init($supabase_url . '/registrations');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($reg_data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $api_key,
            'Authorization: Bearer ' . $api_key,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]);
        curl_exec($ch);
        curl_close($ch);

        @file_put_contents(
            __DIR__ . '/yookassa.log',
            "[{$timestamp}] SUPABASE REGISTRATION SAVED: {$clean_email} -> {$tournament_id}\n\n",
            FILE_APPEND
        );
    }
}

// Ответ 200 OK обязателен для ЮKassa
http_response_code(200);
echo json_encode(['status' => 'ok']);

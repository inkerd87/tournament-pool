<?php
// PayAnyWay / Moneta.ru Notification & Check Handler
header("Content-Type: text/plain; charset=utf-8");

// Log all incoming requests to payanyway.log for diagnostics
$timestamp = date('Y-m-d H:i:s');
$method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';

// Read raw body in case of JSON or webhook payload
$rawInput = file_get_contents('php://input');
$jsonData = json_decode($rawInput, true) ?: [];

$logEntry = "[{$timestamp}] {$method} " . ($_SERVER['REQUEST_URI'] ?? '') . "\n"
    . "POST: " . json_encode($_POST, JSON_UNESCAPED_UNICODE) . "\n"
    . "GET: " . json_encode($_GET, JSON_UNESCAPED_UNICODE) . "\n"
    . "RAW: " . $rawInput . "\n";
@file_put_contents(__DIR__ . '/payanyway.log', $logEntry, FILE_APPEND);

// Extract payment amount (supporting both dot and comma notation, and multiple parameter variants)
$rawAmount = $_POST['MNT_AMOUNT'] 
    ?? $_GET['MNT_AMOUNT'] 
    ?? $jsonData['MNT_AMOUNT'] 
    ?? $_POST['mnt_amount'] 
    ?? $_GET['mnt_amount'] 
    ?? $jsonData['mnt_amount'] 
    ?? $_POST['amount'] 
    ?? $_GET['amount'] 
    ?? $jsonData['amount'] 
    ?? $_POST['AMOUNT'] 
    ?? $_GET['AMOUNT'] 
    ?? $_POST['sum'] 
    ?? $_GET['sum'] 
    ?? $_POST['SUM'] 
    ?? $_POST['OutSum'] 
    ?? $_GET['OutSum'] 
    ?? 0;

$mntAmount = floatval(str_replace(',', '.', trim((string)$rawAmount)));

// Extract payer email / subscriber id
$mntEmail = trim(
    $_POST['MNT_SUBSCRIBER_ID'] ?? 
    $_GET['MNT_SUBSCRIBER_ID'] ?? 
    $jsonData['MNT_SUBSCRIBER_ID'] ?? 
    $_POST['mnt_subscriber_id'] ?? 
    $_GET['mnt_subscriber_id'] ?? 
    $_POST['paw_email'] ?? 
    $_POST['MNT_USER'] ?? 
    $_POST['mnt_user'] ?? 
    $_POST['email'] ?? 
    $_GET['email'] ?? 
    $jsonData['email'] ?? 
    $_POST['EMAIL'] ?? 
    $_POST['payer_email'] ?? 
    $_POST['client_email'] ?? 
    $_POST['MNT_CUSTOM1'] ?? 
    ''
);

// Operation ID for deduplication
$opId = trim(
    $_POST['MNT_OPERATION_ID'] ?? 
    $_GET['MNT_OPERATION_ID'] ?? 
    $jsonData['MNT_OPERATION_ID'] ?? 
    $_POST['mnt_operation_id'] ?? 
    $_GET['mnt_operation_id'] ?? 
    $_POST['MNT_TRANSACTION_ID'] ?? 
    $_POST['mnt_transaction_id'] ?? 
    ''
);

if (!empty($opId)) {
    $processedFile = __DIR__ . '/processed_ops.txt';
    $processed = @file_exists($processedFile) ? (string)@file_get_contents($processedFile) : '';
    if (strpos($processed, $opId) !== false) {
        @file_put_contents(__DIR__ . '/payanyway.log', "[{$timestamp}] SKIP: OpID {$opId} already processed\n\n", FILE_APPEND);
        http_response_code(200);
        echo "SUCCESS";
        exit;
    }
    @file_put_contents($processedFile, $opId . "\n", FILE_APPEND);
}

if ($mntAmount > 0 && !empty($mntEmail)) {
    $supabaseUrl = 'https://qblybjpioynwgheqhxyo.supabase.co/rest/v1';
    $apiKey = 'sb_publishable_CAbgrdUXWUeP6squgk98Bg_Ul0oE6BV';

    $cleanEmail = strtolower($mntEmail);
    $isEmail = strpos($cleanEmail, '@') !== false;

    // 1. Fetch current user balance from Supabase (email or phone)
    $queryParam = $isEmail 
        ? 'email=ilike.' . urlencode($cleanEmail) 
        : 'phone=ilike.*' . urlencode(preg_replace('/[^0-9]/', '', $cleanEmail)) . '*';

    $ch = curl_init($supabaseUrl . '/users?' . $queryParam);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $apiKey,
        'Authorization: Bearer ' . $apiKey
    ]);
    $res = curl_exec($ch);
    curl_close($ch);

    $users = json_decode($res, true);
    if (!empty($users) && isset($users[0]['id'])) {
        $userId = $users[0]['id'];
        $currBal = floatval($users[0]['balance_rub'] ?? 0);
        $newBal = $currBal + $mntAmount;

        // 2. Update user balance in Supabase
        $ch = curl_init($supabaseUrl . '/users?id=eq.' . urlencode($userId));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['balance_rub' => $newBal]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $apiKey,
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]);
        curl_exec($ch);
        curl_close($ch);

        @file_put_contents(
            __DIR__ . '/payanyway.log',
            "[{$timestamp}] SUPABASE UPDATED: {$cleanEmail} +{$mntAmount} => {$newBal} RUB\n\n",
            FILE_APPEND
        );
    } else {
        // User not found in DB - insert new user with the credited balance!
        $ch = curl_init($supabaseUrl . '/users');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $newUserData = [
            'nickname' => 'Player',
            'balance_rub' => $mntAmount
        ];
        if ($isEmail) {
            $newUserData['email'] = $cleanEmail;
        } else {
            $newUserData['email'] = $cleanEmail . '@nightbyte.local';
            $newUserData['phone'] = $cleanEmail;
        }

        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($newUserData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $apiKey,
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]);
        curl_exec($ch);
        curl_close($ch);

        @file_put_contents(
            __DIR__ . '/payanyway.log',
            "[{$timestamp}] SUPABASE USER CREATED: {$cleanEmail} balance={$mntAmount} RUB\n\n",
            FILE_APPEND
        );
    }
}

// Always respond with SUCCESS for Moneta / PayAnyWay protocol
http_response_code(200);
echo "SUCCESS";

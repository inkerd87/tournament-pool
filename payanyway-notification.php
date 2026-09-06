<?php
// PayAnyWay / Moneta.ru Notification & Check Handler
header("Content-Type: text/plain; charset=utf-8");

// Log all incoming requests to payanyway.log for diagnostics
$timestamp = date('Y-m-d H:i:s');
$method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
$logEntry = "[{$timestamp}] {$method} " . ($_SERVER['REQUEST_URI'] ?? '') . "\n"
    . "POST: " . json_encode($_POST, JSON_UNESCAPED_UNICODE) . "\n"
    . "GET: " . json_encode($_GET, JSON_UNESCAPED_UNICODE) . "\n";
@file_put_contents(__DIR__ . '/payanyway.log', $logEntry, FILE_APPEND);

// Extract payment parameters (Moneta / PayAnyWay assistant format)
$mntAmount = floatval($_POST['MNT_AMOUNT'] ?? $_GET['MNT_AMOUNT'] ?? 0);
$mntEmail = trim(
    $_POST['MNT_SUBSCRIBER_ID'] ?? 
    $_POST['paw_email'] ?? 
    $_POST['MNT_USER'] ?? 
    $_POST['email'] ?? 
    $_GET['email'] ?? 
    $_POST['MNT_CUSTOM1'] ?? 
    ''
);

if ($mntAmount > 0 && !empty($mntEmail)) {
    $supabaseUrl = 'https://qblybjpioynwgheqhxyo.supabase.co/rest/v1';
    $apiKey = 'sb_publishable_CAbgrdUXWUeP6squgk98Bg_Ul0oE6BV';

    // 1. Fetch current user balance from Supabase
    $cleanEmail = strtolower($mntEmail);
    $ch = curl_init($supabaseUrl . '/users?email=eq.' . urlencode($cleanEmail));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $apiKey,
        'Authorization: Bearer ' . $apiKey
    ]);
    $res = curl_exec($ch);
    curl_close($ch);

    $users = json_decode($res, true);
    if (!empty($users) && isset($users[0]['id'])) {
        $currBal = floatval($users[0]['balance_rub'] ?? 0);
        $newBal = $currBal + $mntAmount;

        // 2. Update user balance in Supabase
        $ch = curl_init($supabaseUrl . '/users?email=eq.' . urlencode($cleanEmail));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['balance_rub' => $newBal]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $apiKey,
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        curl_exec($ch);
        curl_close($ch);

        @file_put_contents(
            __DIR__ . '/payanyway.log',
            "[{$timestamp}] SUPABASE UPDATED: {$cleanEmail} +{$mntAmount} => {$newBal} RUB\n\n",
            FILE_APPEND
        );
    }
}

// Always respond with SUCCESS for Moneta / PayAnyWay protocol
http_response_code(200);
echo "SUCCESS";


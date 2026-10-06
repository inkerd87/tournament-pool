<?php
// T-Bank P2P SMS / Push Webhook Receiver for iOS Shortcuts and Android MacroDroid
header("Content-Type: application/json; charset=utf-8");

$timestamp = date('Y-m-d H:i:s');
$method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';

// Read raw body
$rawInput = file_get_contents('php://input');
$jsonData = json_decode($rawInput, true) ?: [];

// Get the text from any possible source (JSON, POST, raw)
$text = '';
if (!empty($jsonData['message'])) {
    $text = (string)$jsonData['message'];
} elseif (!empty($jsonData['text'])) {
    $text = (string)$jsonData['text'];
} elseif (!empty($_POST['message'])) {
    $text = (string)$_POST['message'];
} elseif (!empty($_POST['text'])) {
    $text = (string)$_POST['text'];
} elseif (!empty($_GET['message'])) {
    $text = (string)$_GET['message'];
} else {
    $text = $rawInput;
}

// Log incoming request
$logFile = __DIR__ . '/p2p.log';
$logEntry = "[{$timestamp}] {$method} Request Received:\n"
    . "TEXT: " . trim($text) . "\n"
    . "RAW: " . $rawInput . "\n"
    . "POST: " . json_encode($_POST, JSON_UNESCAPED_UNICODE) . "\n";

// Parse amount from SMS text
// Examples from T-Bank:
// "Пополнение +500.34 ₽. Баланс..."
// "Пополнение +1000 ₽"
// "Перевод 250,50 р от Иван И."
// "Перевод +500 RUB"
$amount = 0.0;
if (preg_match('/(?:пополнени[ея]|перевод|\+|поступил[оа]?)\s*:?\s*\+?\s*([\d\s]+(?:[.,]\d{1,2})?)\s*(?:₽|р|руб|rub)/iu', $text, $matches)) {
    $cleanAmountStr = str_replace([' ', ','], ['', '.'], $matches[1]);
    $amount = floatval($cleanAmountStr);
} elseif (preg_match('/\+([\d]+(?:[.,]\d{1,2})?)\s*(?:₽|р|руб|rub)/iu', $text, $matches)) {
    $cleanAmountStr = str_replace([' ', ','], ['', '.'], $matches[1]);
    $amount = floatval($cleanAmountStr);
} elseif (preg_match('/([\d]+(?:[.,]\d{1,2})?)\s*(?:₽|р|руб|rub)/iu', $text, $matches)) {
    $cleanAmountStr = str_replace([' ', ','], ['', '.'], $matches[1]);
    $amount = floatval($cleanAmountStr);
}

$logEntry .= "PARSED AMOUNT: {$amount} RUB\n";

if ($amount <= 0) {
    $logEntry .= "STATUS: No valid amount extracted from message\n\n";
    @file_put_contents($logFile, $logEntry, FILE_APPEND);
    echo json_encode([
        'status' => 'received',
        'parsed_amount' => 0,
        'message' => 'No amount detected in SMS text',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Supabase REST connection
$supabaseUrl = 'https://qblybjpioynwgheqhxyo.supabase.co/rest/v1';
$apiKey = 'sb_publishable_CAbgrdUXWUeP6squgk98Bg_Ul0oE6BV';

// 1. Look for a pending transaction matching this exact amount (within last 30 minutes)
$ch = curl_init($supabaseUrl . '/transactions?amount_rub=eq.' . urlencode((string)$amount) . '&status=eq.pending&order=created_at.desc&limit=1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $apiKey,
    'Authorization: Bearer ' . $apiKey
]);
$txRes = curl_exec($ch);
curl_close($ch);

$txData = json_decode($txRes, true);
$creditedUserId = null;

if (!empty($txData) && isset($txData[0]['id']) && isset($txData[0]['user_id'])) {
    $txId = $txData[0]['id'];
    $creditedUserId = $txData[0]['user_id'];

    // Mark transaction completed
    $ch = curl_init($supabaseUrl . '/transactions?id=eq.' . urlencode($txId));
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['status' => 'completed']));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $apiKey,
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    curl_exec($ch);
    curl_close($ch);

    // Fetch user and add balance
    $ch = curl_init($supabaseUrl . '/users?id=eq.' . urlencode($creditedUserId));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $apiKey,
        'Authorization: Bearer ' . $apiKey
    ]);
    $uRes = curl_exec($ch);
    curl_close($ch);

    $uData = json_decode($uRes, true);
    if (!empty($uData) && isset($uData[0]['balance_rub'])) {
        $currBal = floatval($uData[0]['balance_rub']);
        $newBal = $currBal + $amount;

        $ch = curl_init($supabaseUrl . '/users?id=eq.' . urlencode($creditedUserId));
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

        $logEntry .= "SUCCESS: User {$creditedUserId} credited +{$amount} RUB -> New Balance: {$newBal}\n";
    }
} else {
    $logEntry .= "NOTICE: Amount {$amount} RUB recognized, but no pending transaction with this exact amount found in queue.\n";
}

$logEntry .= "\n";
@file_put_contents($logFile, $logEntry, FILE_APPEND);

echo json_encode([
    'status' => 'ok',
    'amount' => $amount,
    'credited_user' => $creditedUserId,
    'message' => 'Processed successfully'
], JSON_UNESCAPED_UNICODE);

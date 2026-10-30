<?php
/**
 * NightByte Storage API Backend
 * Обеспечивает мгновенное (< 10 мс) сохранение и чтение данных турниров,
 * настроек игр, кастомных игр, матчей и регистраций.
 */

// Заголовки CORS и отключение кэширования для всегда свежих данных
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Обработка Preflight OPTIONS запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Определение директории хранения данных
$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0775, true);
}

// Определение ключа из параметров или URI
$key = isset($_GET['key']) ? trim($_GET['key']) : '';
if (!$key) {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (preg_match('#/api/storage(?:\.php)?/([a-zA-Z0-9_-]+)#', $uri, $matches)) {
        $key = $matches[1];
    }
}
$key = preg_replace('/[^a-zA-Z0-9_-]/', '', $key);

// Разрешенные ключи
$allowedKeys = [
    'bundle',
    'all',
    'tournaments',
    'game_overrides',
    'custom_games',
    'matches',
    'registrations',
    'deleted_tournaments',
    'status',
];

// 1. Пакетный эндпоинт BUNDLE: отдает всё за один сетевой запрос (< 15 мс)
if ($key === 'bundle' || $key === 'all') {
    $readFile = function ($name, $default) use ($dataDir) {
        $f = $dataDir . '/' . $name . '.json';
        if (file_exists($f)) {
            $c = @file_get_contents($f);
            if ($c !== false && trim($c) !== '') {
                $decoded = json_decode($c, true);
                if ($decoded !== null) {
                    return $decoded;
                }
            }
        }
        return $default;
    };

    $bundle = [
        'ok' => true,
        'tournaments' => $readFile('tournaments', null),
        'game_overrides' => $readFile('game_overrides', null),
        'custom_games' => $readFile('custom_games', null),
        'matches' => $readFile('matches', null),
        'registrations' => $readFile('registrations', null),
        'deleted_tournaments' => $readFile('deleted_tournaments', null),
        'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
    ];

    echo json_encode($bundle, JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Информационный эндпоинт статуса
if ($key === 'status' || $key === '') {
    echo json_encode([
        'ok' => true,
        'service' => 'nightbyte-storage-php',
        'time' => gmdate('Y-m-d\TH:i:s\Z'),
        'availableKeys' => $allowedKeys,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$filePath = $dataDir . '/' . $key . '.json';

// 3. Обработка GET запроса
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($filePath)) {
        $content = @file_get_contents($filePath);
        if ($content !== false && trim($content) !== '') {
            echo $content;
            exit;
        }
    }

    // Дефолтные значения при первом запросе
    if (in_array($key, ['tournaments', 'custom_games', 'registrations', 'deleted_tournaments'], true)) {
        echo '[]';
        exit;
    }
    if (in_array($key, ['game_overrides', 'matches'], true)) {
        echo '{}';
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Not found', 'key' => $key]);
    exit;
}

// 4. Обработка POST запроса: сохранение с блокировкой
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    if ($rawInput === false || trim($rawInput) === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Empty request body']);
        exit;
    }

    // Проверка корректности JSON
    $decoded = json_decode($rawInput, true);
    if ($decoded === null && trim($rawInput) !== 'null') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    // Атомарная запись через временный файл с блокировкой LOCK_EX
    $tmpPath = $filePath . '.tmp.' . uniqid('', true);
    $written = @file_put_contents($tmpPath, $rawInput, LOCK_EX);
    if ($written === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write data file']);
        exit;
    }

    if (!@rename($tmpPath, $filePath)) {
        // Fallback если rename не сработал
        @file_put_contents($filePath, $rawInput, LOCK_EX);
        @unlink($tmpPath);
    }

    echo json_encode([
        'ok' => true,
        'key' => $key,
        'bytes' => $written,
        'savedAt' => gmdate('Y-m-d\TH:i:s\Z'),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);

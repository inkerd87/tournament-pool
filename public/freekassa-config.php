<?php
/**
 * Конфигурация мерчанта FreeKassa для NightByte
 * https://merchant.freekassa.net
 */

// 1. ID вашего магазина в FreeKassa (число в панели управления)
define('FK_SHOP_ID', getenv('FREEKASSA_SHOP_ID') ?: '75872');

// 2. Секретное слово 1 (для подписи формы оплаты SCI)
define('FK_SECRET_1', getenv('FREEKASSA_SECRET_1') ?: 'владимир');

// 3. Секретное слово 2 (для проверки оповещений Result URL)
define('FK_SECRET_2', getenv('FREEKASSA_SECRET_2') ?: 'данила');

// 4. API Ключ FreeKassa
define('FK_API_KEY', getenv('FREEKASSA_API_KEY') ?: 'bc33c022a82f116ee612de14ea5f8e40');

// Базовый URL возврата покупателя
define('FK_RETURN_URL', 'https://nightbyteonline.ru/payment/return');

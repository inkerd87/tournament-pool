<?php
// PayAnyWay / Moneta.ru Notification & Check Handler
// Responds with "SUCCESS" for simplified response mode / HTTP 200 OK
header("Content-Type: text/plain; charset=utf-8");
http_response_code(200);
echo "SUCCESS";

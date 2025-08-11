<?php
declare(strict_types=1);

/*
 * Parámetros (GET):
 *   categoria   -> texto, comparado sin distinción de mayúsculas
 *   desde       -> fecha mínima (dd/mm/YYYY)
 *   hasta       -> fecha máxima (dd/mm/YYYY)
 *   q           -> texto a buscar en lugar o título 
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$DB = __DIR__ . '/eventos.json';
if (!file_exists($DB)) {
    http_response_code(500);
    echo json_encode(['error' => 'Archivo eventos.json no existe.']);
    exit;
}

function parse_ddmmyyyy(?string $s): ?DateTimeImmutable {
    if ($s === null || trim($s) === '') return null;
    $parts = explode('/', trim($s));
    if (count($parts) !== 3) return null;
    [$d,$m,$y] = $parts;
    if (!checkdate((int)$m, (int)$d, (int)$y)) return null;
    return DateTimeImmutable::createFromFormat('!d/m/Y', sprintf('%02d/%02d/%04d',(int)$d,(int)$m,(int)$y));
}

$categoria = isset($_GET['categoria']) ? trim((string)$_GET['categoria']) : null;
$desde = parse_ddmmyyyy($_GET['desde'] ?? null);
$hasta = parse_ddmmyyyy($_GET['hasta'] ?? null);
$q = isset($_GET['q']) ? trim((string)$_GET['q']) : null;

// Leer
$raw = file_get_contents($DB);
$events = json_decode($raw, true);
if (!is_array($events)) $events = [];

$out = [];
foreach ($events as $e) {
    $ok = true;

    if ($categoria) {
        $ok = $ok && (strtolower((string)($e['categoria'] ?? '')) === strtolower($categoria));
    }

    if ($desde || $hasta) {
        $f = (string)($e['fecha'] ?? '');
        $df = parse_ddmmyyyy($f);
        if (!$df) { $ok = false; }
        if ($desde && $df && $df < $desde) $ok = false;
        if ($hasta && $df && $df > $hasta) $ok = false;
    }

    if ($q) {
        $needle = strtolower($q);
        $hay1 = strtolower((string)($e['lugar'] ?? ''));
        $hay2 = strtolower((string)($e['titulo'] ?? ''));
        if (strpos($hay1, $needle) === false && strpos($hay2, $needle) === false) {
            $ok = false;
        }
    }

    if ($ok) $out[] = $e;
}

http_response_code(200);
echo json_encode(array_values($out), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

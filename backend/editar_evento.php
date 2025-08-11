<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$DB = __DIR__ . '/eventos.json';
if (!file_exists($DB)) {
    http_response_code(500);
    echo json_encode(['error' => 'Archivo eventos.json no existe.']);
    exit;
}

function read_json_input(): array {
    $ctype = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ctype, 'application/json') !== false) {
        $raw = file_get_contents('php://input') ?: '';
        $data = json_decode($raw, true);
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'JSON inválido', 'detalle' => json_last_error_msg()], JSON_UNESCAPED_UNICODE);
            exit;
        }
        return $data ?? [];
    }
    return $_POST ?? [];
}

$payload = read_json_input();
$id = trim((string)($payload['id'] ?? ''));
if ($id === '') {
    http_response_code(400);
    echo json_encode(['error' => 'El campo id es obligatorio.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Campos permitidos
$allowed = ['titulo','categoria','fecha','hora_inicio','hora_fin','lugar','descripcion'];
$updates = [];
foreach ($allowed as $k) {
    if (array_key_exists($k, $payload)) {
        $v = is_string($payload[$k]) ? trim((string)$payload[$k]) : $payload[$k];
        // Validaciones básicas
        if ($k === 'titulo' && $v !== '' && (strlen($v) < 3 || strlen($v) > 120)) {
            http_response_code(400);
            echo json_encode(['error' => 'titulo debe tener entre 3 y 120 caracteres.']);
            exit;
        }
        if ($k === 'fecha' && $v !== '') {
            $parts = explode('/', $v);
            if (count($parts) !== 3 || !checkdate((int)$parts[1], (int)$parts[0], (int)$parts[2])) {
                http_response_code(400);
                echo json_encode(['error' => 'fecha debe tener formato dd/mm/YYYY.']);
                exit;
            }
        }
        $updates[$k] = $v;
    }
}

$fp = fopen($DB, 'c+');
if (!$fp) { 
    http_response_code(500); 
    echo json_encode(['error'=>'No se pudo abrir eventos.json']); 
    exit; }
flock($fp, LOCK_EX);
$size = filesize($DB);
$raw = $size > 0 ? fread($fp, $size) : '[]';
$events = json_decode($raw, true);
if (!is_array($events)) $events = [];

$found = false;
foreach ($events as &$e) {
    if (($e['id'] ?? '') === $id) {
        foreach ($updates as $k => $v) {
            $e[$k] = $v;
        }
        $e['actualizado_en'] = date(DATE_ATOM); // agrega/actualiza timestamp
        $found = true;
        break;
    }
}

if (!$found) {
    flock($fp, LOCK_UN);
    fclose($fp);
    http_response_code(404);
    echo json_encode(['error' => 'No encontrado']);
    exit;
}

// Escribir de vuelta
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($events, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

http_response_code(200);
echo json_encode(['actualizado' => true, 'evento' => $e], JSON_UNESCAPED_UNICODE);

?>
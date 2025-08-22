<?php
/**
 * API para EcoEventos (recurso: eventos)
 *   - GET    /api.php?resource=eventos            → lista (array)
 *   - GET    /api.php?resource=eventos&id=...     → detalle (objeto)
 *   - DELETE /api.php?resource=eventos&id=...     → eliminar
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS'); // (se mantiene tal cual)
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$file = __DIR__ . '/eventos.json';

function loadEventos(string $file): array {
  if (!file_exists($file)) {
    file_put_contents($file, json_encode([]));
    return [];
  }
  $raw = file_get_contents($file);
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function saveEventos(string $file, array $eventos): bool {
  $json = json_encode($eventos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $fp = @fopen($file, 'c+');
  if (!$fp) return false;
  if (!flock($fp, LOCK_EX)) { fclose($fp); return false; }
  ftruncate($fp, 0);
  $bytes = fwrite($fp, $json);
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  return $bytes !== false;
}

function findById(array $items, string $id): array {
  foreach ($items as $i => $ev) {
    if (isset($ev['id']) && $ev['id'] === $id) return [$ev, $i];
  }
  return [null, -1];
}

///// Ruteo básico por recurso y método /////
$resource = $_GET['resource'] ?? '';
$method   = $_SERVER['REQUEST_METHOD'];

if ($resource !== 'eventos') {
  http_response_code(400);
  echo json_encode(['error' => 'resource inválido (use resource=eventos)'], JSON_UNESCAPED_UNICODE);
  exit;
}

$items = loadEventos($file);

switch ($method) {

  case 'GET':
    // Si viene ?id=... → detalle; si no, lista completa
    if (isset($_GET['id']) && $_GET['id'] !== '') {
      $id = (string) $_GET['id'];
      [$found, ] = findById($items, $id);
      if (!$found) {
        http_response_code(404);
        echo json_encode(['error' => 'no encontrado'], JSON_UNESCAPED_UNICODE);
        exit;
      }
      echo json_encode($found, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      exit;
    }
    // LISTA (array puro, compatible con front existente)
    echo json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;

  case 'DELETE':
    // Eliminar por id
    if (!isset($_GET['id']) || $_GET['id'] === '') {
      http_response_code(400);
      echo json_encode(['error' => 'id requerido'], JSON_UNESCAPED_UNICODE);
      exit;
    }
    $id = (string) $_GET['id'];
    [, $idx] = findById($items, $id);
    if ($idx < 0) {
      http_response_code(404);
      echo json_encode(['ok' => false, 'error' => 'no encontrado'], JSON_UNESCAPED_UNICODE);
      exit;
    }
    array_splice($items, $idx, 1);
    if (!saveEventos($file, $items)) {
      http_response_code(500);
      echo json_encode(['error' => 'No se pudo guardar'], JSON_UNESCAPED_UNICODE);
      exit;
    }
    echo json_encode(['ok' => true]);
    exit;

  default:
    http_response_code(405);
    echo json_encode(['error' => 'método no permitido'], JSON_UNESCAPED_UNICODE);
    exit;
}
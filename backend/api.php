<?php
/**
 * API unificada para EcoEventos
 * Endpoints (recurso: eventos):
 *   - GET    /api.php?resource=eventos            → lista (array)
 *   - GET    /api.php?resource=eventos&id=...     → detalle (objeto)
 *   - POST   /api.php?resource=eventos            → crear (JSON en body)
 *   - DELETE /api.php?resource=eventos&id=...     → eliminar
 *
 * Notas:
 * - Respuestas en JSON UTF-8.
 * - Almacén local: eventos.json (sin BD).
 * - Compatible con frontend que espera que la LISTA sea un ARRAY puro.
 */

///// Encabezados CORS y tipo de contenido /////
header('Access-Control-Allow-Origin: *');                 // Permitir peticiones desde cualquier dominio (CORS)
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS'); // Métodos permitidos
header('Access-Control-Allow-Headers: Content-Type');     // Permitir cabecera Content-Type
header('Content-Type: application/json; charset=UTF-8');  // Respuesta en JSON (UTF-8)

// Manejo de preflight (para navegadores)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit; // Responder sin cuerpo
}

///// Constantes y utilidades de archivo /////
$file = __DIR__ . '/eventos.json';

/**
 * Carga la lista de eventos desde el archivo JSON.
 * Garantiza que siempre retorne un array.
 */
function loadEventos(string $file): array {
  if (!file_exists($file)) {
    // Si no existe, crear un JSON vacío
    file_put_contents($file, json_encode([]));
    return [];
  }
  $raw = file_get_contents($file);
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

/**
 * Guarda la lista de eventos con lock para evitar corrupción en escritura.
 * Retorna true en éxito, false si falla.
 */
function saveEventos(string $file, array $eventos): bool {
  $json = json_encode($eventos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $fp = @fopen($file, 'c+'); // crear si no existe
  if (!$fp) return false;
  // Bloqueo exclusivo para escritura segura
  if (!flock($fp, LOCK_EX)) { fclose($fp); return false; }
  // Truncar y escribir
  ftruncate($fp, 0);
  $bytes = fwrite($fp, $json);
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  return $bytes !== false;
}

/**
 * Busca un evento por id; retorna [evento, índice] ó [null, -1]
 */
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

  case 'POST':
    // Crear evento: admite body JSON o form-data
    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);
    if (!is_array($data)) {
      // fallback por si envían form-data
      $data = $_POST;
    }

    // Campos requeridos 
    $req = ['titulo', 'categoria', 'fecha', 'hora_inicio', 'hora_fin', 'lugar', 'descripcion'];
    foreach ($req as $k) {
      if (!isset($data[$k]) || trim((string)$data[$k]) === '') {
        http_response_code(400);
        echo json_encode(['error' => "Falta $k"], JSON_UNESCAPED_UNICODE);
        exit;
      }
    }

    // Normalización básica
    $nuevo = [
      'id'          => uniqid('ev_', true),
      'titulo'      => trim((string)$data['titulo']),
      'categoria'   => trim((string)$data['categoria']),
      'fecha'       => trim((string)$data['fecha']),             // DD/MM/AAAA ó YYYY-MM-DD (texto)
      'hora_inicio' => trim((string)$data['hora_inicio']),       // "08:00 AM"
      'hora_fin'    => trim((string)$data['hora_fin']), 
      'lugar'       => trim((string)$data['lugar']),
      'descripcion' => trim((string)$data['descripcion']),
      'creado_en'   => date('c'),
    ];

    $items[] = $nuevo;
    if (!saveEventos($file, $items)) {
      http_response_code(500);
      echo json_encode(['error' => 'No se pudo guardar'], JSON_UNESCAPED_UNICODE);
      exit;
    }

    echo json_encode(['ok' => true, 'evento' => $nuevo], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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

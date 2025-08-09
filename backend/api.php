<?php
// backend/api.php
declare(strict_types=1);

// (Opcional) CORS para que el frontend pueda pegarle sin drama.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

header('Content-Type: application/json; charset=utf-8');

const DATA_FILE = __DIR__ . '/backend/eventos.json';

function loadEventos(): array {
    if (!file_exists(DATA_FILE)) return [];
    $raw = file_get_contents(DATA_FILE);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function saveEventos(array $items): bool {
    // Escribe bonito + lock para evitar corrupciones si dos procesos escriben
    $json = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $fp = fopen(DATA_FILE, 'c+');
    if (!$fp) return false;
    // Lock exclusivo
    if (!flock($fp, LOCK_EX)) { fclose($fp); return false; }
    ftruncate($fp, 0);
    $ok = fwrite($fp, $json) !== false;
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $ok;
}

function findById(array $items, string $id): ?array {
    foreach ($items as $it) {
        if (isset($it['id']) && $it['id'] === $id) return $it;
    }
    return null;
}

function deleteById(array $items, string $id): array {
    $found = false;
    $out = [];
    foreach ($items as $it) {
        if (isset($it['id']) && $it['id'] === $id) {
            $found = true;
            continue;
        }
        $out[] = $it;
    }
    return [$out, $found];
}

// Permitir override de método: POST + _method=DELETE
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_POST['_method']) && strtoupper($_POST['_method']) === 'DELETE') {
    $method = 'DELETE';
}

$resource = $_GET['resource'] ?? '';
$id = $_GET['id'] ?? '';

if ($resource !== 'eventos') {
    http_response_code(400);
    echo json_encode(['error' => 'Recurso inválido. Use resource=eventos']);
    exit;
}

$items = loadEventos();

switch ($method) {
    case 'GET':
        if ($id === '') {
            // Devolvemos todos para facilitar pruebas, aunque tu parte es “detalle”
            echo json_encode($items, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } else {
            $item = findById($items, $id);
            if ($item === null) {
                http_response_code(404);
                echo json_encode(['error' => 'Evento no encontrado', 'id' => $id], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode($item, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            }
        }
        break;

    case 'DELETE':
        if ($id === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Falta parámetro id']);
            break;
        }
        [$newList, $found] = deleteById($items, $id);
        if (!$found) {
            http_response_code(404);
            echo json_encode(['error' => 'Evento no encontrado', 'id' => $id], JSON_UNESCAPED_UNICODE);
            break;
        }
        if (!saveEventos($newList)) {
            http_response_code(500);
            echo json_encode(['error' => 'No se pudo guardar cambios']);
            break;
        }
        echo json_encode(['ok' => true, 'eliminado' => $id], JSON_UNESCAPED_UNICODE);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido. Use GET o DELETE']);
}

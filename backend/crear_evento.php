<?php
header('Access-Control-Allow-Origin: *'); // Permitir peticiones desde cualquier dominio (CORS)
header('Access-Control-Allow-Methods: POST, OPTIONS'); // Métodos HTTP permitidos
header('Access-Control-Allow-Headers: Content-Type'); // Permitir cabecera Content-Type en la petición
header('Content-Type: application/json; charset=UTF-8'); // Respuesta en JSON con codificación UTF-8

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["mensaje" => "Método no permitido. Use POST."], JSON_UNESCAPED_UNICODE);
  exit;
}

// Leer JSON de la petición
$data = json_decode(file_get_contents("php://input"), true);

// Helpers
function val($arr, $k) { return isset($arr[$k]) ? trim($arr[$k]) : ""; }

$titulo      = val($data, 'titulo');
$categoria   = val($data, 'categoria');
$fecha       = val($data, 'fecha');
$horaInicio  = val($data, 'hora_inicio');
$lugar       = val($data, 'lugar');
$descripcion = val($data, 'descripcion');
$horaFin     = val($data, 'hora_fin');

// Validar campos
if ($titulo === "" || $categoria === "" || $fecha === "" || $horaInicio === "" || $lugar === "" || $descripcion === "") {
  echo json_encode(["mensaje" => "Faltan campos requeridos"], JSON_UNESCAPED_UNICODE);
  exit;
}

// Validar categoría 
$categoriasPermitidas = ["Minga", "Sembratón", "Charla", "Taller", "Reciclaje", "Reforestación", "Otro"];
if (!in_array($categoria, $categoriasPermitidas)) {
  $categoria = $categoria === "" ? "Otro" : $categoria;
}

$archivo = __DIR__ . "/eventos.json";
if (!file_exists($archivo)) file_put_contents($archivo, json_encode([]));

$eventos = json_decode(file_get_contents($archivo), true);
if (!is_array($eventos)) $eventos = [];

// Crear evento
$nuevo = [
  "id"           => uniqid("ev_", true),
  "titulo"       => $titulo,
  "categoria"    => $categoria,
  "fecha"        => $fecha,        
  "hora_inicio"  => $horaInicio,  
  "hora_fin"     => $horaFin !== "" ? $horaFin : null,
  "lugar"        => $lugar,
  "descripcion"  => $descripcion,
  "creado_en"    => date('c')
];

$eventos[] = $nuevo;

// Guardar evento
file_put_contents($archivo, json_encode($eventos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

// Mensaje de respuesta
echo json_encode([
  "mensaje" => "Evento creado correctamente",
  "evento"  => $nuevo
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

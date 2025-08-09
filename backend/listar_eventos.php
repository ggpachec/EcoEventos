<?php
header('Access-Control-Allow-Origin: *'); // Permitir peticiones desde cualquier dominio (CORS)
header('Content-Type: application/json; charset=UTF-8'); // Respuesta en JSON con codificación UTF-8

$archivo = __DIR__ . "/eventos.json";


if (!file_exists($archivo)) {
    file_put_contents($archivo, json_encode([]));
}

// Leer el contenido del archivo
$contenido = file_get_contents($archivo);

// Decodificar el JSON
$eventos = json_decode($contenido, true);

// Mensaje si hay un error en el JSON
if (!is_array($eventos)) {
    echo json_encode([
        "mensaje" => "Error al leer los eventos",
        "eventos" => []
    ]);
    exit;
}

// Respuesta si sale todo bien
echo json_encode([
    "mensaje" => "Lista de eventos obtenida correctamente",
    "total" => count($eventos),
    "eventos" => $eventos
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>

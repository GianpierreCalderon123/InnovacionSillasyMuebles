<?php
header("Content-Type: application/json; charset=utf-8");

// ====== CONFIG ======
$ADMIN_KEY = "CAMBIAESTO"; // <-- CAMBIA esta clave
// ====================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["ok" => false, "error" => "Method not allowed"]);
  exit;
}

// Lee clave desde header
$clientKey = "";
if (isset($_SERVER["HTTP_X_ADMIN_KEY"])) {
  $clientKey = $_SERVER["HTTP_X_ADMIN_KEY"];
}

if (!$clientKey || $clientKey !== $ADMIN_KEY) {
  http_response_code(401);
  echo json_encode(["ok" => false, "error" => "Invalid admin key"]);
  exit;
}

// Lee body
$raw = file_get_contents("php://input");
if (!$raw) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Empty body"]);
  exit;
}

// Valida JSON
$data = json_decode($raw, true);
if ($data === null) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Invalid JSON"]);
  exit;
}

// Validación mínima
if (!isset($data["categories"]) || !is_array($data["categories"]) || !isset($data["products"]) || !is_array($data["products"])) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Missing categories/products"]);
  exit;
}

// Ruta destino
$dest = __DIR__ . "/../data/products.json";

// Intenta guardar
$ok = file_put_contents($dest, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

if ($ok === false) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "Could not write file. Check permissions of /data/products.json"]);
  exit;
}

echo json_encode(["ok" => true]);

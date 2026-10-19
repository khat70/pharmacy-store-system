<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Please log in first.']);
    exit;
}

if (!in_array($_SESSION['role'] ?? '', ['admin', 'pharmacist'], true)) {
    http_response_code(403);
    echo json_encode(['error' => 'You do not have permission to view suppliers.']);
    exit;
}

require __DIR__ . '/db.php';

try {
    $statement = $pdo->query(
        'SELECT id, supplier_name, phone, email, address
         FROM suppliers
         ORDER BY supplier_name'
    );

    echo json_encode($statement->fetchAll());
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load suppliers.']);
}
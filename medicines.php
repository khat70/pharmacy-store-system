<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Please log in first.']);
    exit;
}

require __DIR__ . '/db.php';

try {
    $statement = $pdo->query(
        'SELECT id, medicine_name, category, quantity, unit_price, expiry_date, supplier_id
         FROM medicines
         ORDER BY medicine_name'
    );

    echo json_encode($statement->fetchAll());
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load medicines.']);
}
<?php
header('Content-Type: application/json');
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
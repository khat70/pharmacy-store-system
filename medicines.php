<?php
header('Content-Type: application/json');

require __DIR__ . '/db.php';

try {
    $statement = $pdo->query(
        'SELECT id, medicine_name, category, quantity, unit_price, expiry_date
         FROM medicines
         ORDER BY medicine_name'
    );

    echo json_encode($statement->fetchAll());
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load medicines.']);
}
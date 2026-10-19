<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Please log in first.']);
    exit;
}

if (!in_array($_SESSION['role'] ?? '', ['admin', 'cashier'], true)) {
    http_response_code(403);
    echo json_encode(['error' => 'You do not have permission to view sales.']);
    exit;
}

require __DIR__ . '/db.php';

try {
    $statement = $pdo->query(
        "SELECT
            s.id,
            COALESCE(s.sale_number, CONCAT('SAL-', LPAD(s.id, 3, '0'))) AS sale_number,
            s.total,
            s.sold_at,
            COALESCE(SUM(si.quantity), 0) AS quantity,
            COALESCE(
                GROUP_CONCAT(
                    DISTINCT COALESCE(si.medicine_name, m.medicine_name)
                    ORDER BY COALESCE(si.medicine_name, m.medicine_name)
                    SEPARATOR ', '
                ),
                ''
            ) AS items
         FROM sales s
         LEFT JOIN sale_items si ON si.sale_id = s.id
         LEFT JOIN medicines m ON m.id = si.medicine_id
         GROUP BY s.id, s.sale_number, s.total, s.sold_at
         ORDER BY s.sold_at DESC"
    );

    echo json_encode($statement->fetchAll());
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load sales.']);
}
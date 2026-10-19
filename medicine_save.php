<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (empty($_SESSION['user_id'])) {
    respond(401, ['error' => 'Please log in first.']);
}

if (!in_array($_SESSION['role'] ?? '', ['admin', 'pharmacist'], true)) {
    respond(403, ['error' => 'Only admins and pharmacists can manage medicines.']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Use POST to save a medicine.']);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    respond(400, ['error' => 'Invalid request data.']);
}

$name = trim($data['name'] ?? '');
$category = trim($data['category'] ?? '');
$quantity = filter_var($data['quantity'] ?? null, FILTER_VALIDATE_INT);
$price = $data['price'] ?? null;

$id = null;
if (isset($data['id']) && $data['id'] !== '') {
    $id = filter_var($data['id'], FILTER_VALIDATE_INT);
    if ($id === false || $id < 1) {
        respond(400, ['error' => 'Invalid medicine ID.']);
    }
}

if ($name === '' || strlen($name) > 100 || strlen($category) > 50) {
    respond(400, ['error' => 'Enter a medicine name and a category of 50 characters or fewer.']);
}

if ($quantity === false || $quantity < 0 || !is_numeric($price) || (float) $price < 0) {
    respond(400, ['error' => 'Quantity and price must be zero or greater.']);
}

$supplierId = null;
if (isset($data['supplierId']) && $data['supplierId'] !== '') {
    $supplierId = filter_var($data['supplierId'], FILTER_VALIDATE_INT);
    if ($supplierId === false || $supplierId < 1) {
        respond(400, ['error' => 'Choose a valid supplier.']);
    }
}

require __DIR__ . '/db.php';

try {
    $supplierName = null;

    if ($supplierId !== null) {
        $supplierQuery = $pdo->prepare(
            'SELECT supplier_name FROM suppliers WHERE id = ?'
        );
        $supplierQuery->execute([$supplierId]);
        $supplierName = $supplierQuery->fetchColumn();

        if ($supplierName === false) {
            respond(400, ['error' => 'The selected supplier was not found.']);
        }
    }

    if ($id === null) {
        $statement = $pdo->prepare(
            'INSERT INTO medicines
                (medicine_name, category, quantity, unit_price, supplier, supplier_id)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([
            $name,
            $category,
            $quantity,
            number_format((float) $price, 2, '.', ''),
            $supplierName,
            $supplierId,
        ]);
        $id = (int) $pdo->lastInsertId();
    } else {
        $statement = $pdo->prepare(
            'UPDATE medicines
             SET medicine_name = ?, category = ?, quantity = ?, unit_price = ?,
                 supplier = ?, supplier_id = ?
             WHERE id = ?'
        );
        $statement->execute([
            $name,
            $category,
            $quantity,
            number_format((float) $price, 2, '.', ''),
            $supplierName,
            $supplierId,
            $id,
        ]);

        if ($statement->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT id FROM medicines WHERE id = ?');
            $exists->execute([$id]);
            if (!$exists->fetchColumn()) {
                respond(404, ['error' => 'Medicine not found.']);
            }
        }
    }

    respond(200, ['message' => 'Medicine saved.', 'id' => $id]);
} catch (PDOException $e) {
    respond(500, ['error' => 'not save the medicine.']);
}
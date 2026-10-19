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

if (!in_array($_SESSION['role'] ?? '', ['admin', 'cashier'], true)) {
    respond(403, ['error' => 'You do not have permission to record sales.']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Use POST to record a sale.']);
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload) || empty($payload['items']) || !is_array($payload['items'])) {
    respond(400, ['error' => 'Add at least one medicine to the sale.']);
}

// Combine repeated medicine IDs so stock is checked against the full quantity.
$quantities = [];
foreach ($payload['items'] as $item) {
    $medicineId = filter_var($item['medicineId'] ?? null, FILTER_VALIDATE_INT);
    $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);

    if (!$medicineId || !$quantity || $quantity < 1) {
        respond(400, ['error' => 'Each item needs a valid medicine and quantity.']);
    }

    $quantities[$medicineId] = ($quantities[$medicineId] ?? 0) + $quantity;
}

require __DIR__ . '/db.php';

try {
    $pdo->beginTransaction();

    $findMedicine = $pdo->prepare(
        'SELECT id, medicine_name, quantity, unit_price, expiry_date
         FROM medicines
         WHERE id = ?
         FOR UPDATE'
    );

    $updateStock = $pdo->prepare(
        'UPDATE medicines
         SET quantity = quantity - ?
         WHERE id = ? AND quantity >= ?'
    );

    $products = [];
    $totalCents = 0;

    foreach ($quantities as $medicineId => $quantity) {
        $findMedicine->execute([$medicineId]);
        $medicine = $findMedicine->fetch();

        if (!$medicine) {
            throw new RuntimeException('A selected medicine was not found.');
        }
        if (!empty($medicine['expiry_date']) && $medicine['expiry_date'] < date('Y-m-d')) {
    throw new RuntimeException(
        $medicine['medicine_name'] . ' is expired and cannot be sold.'
    );
}

        if ($quantity > (int) $medicine['quantity']) {
            throw new RuntimeException(
                $medicine['medicine_name'] . ' does not have enough stock.'
            );
        }

        $unitCents = (int) round((float) $medicine['unit_price'] * 100);
        $lineCents = $unitCents * $quantity;
        $totalCents += $lineCents;

        $products[] = [
            'id' => (int) $medicine['id'],
            'name' => $medicine['medicine_name'],
            'quantity' => $quantity,
            'unit_cents' => $unitCents,
            'line_cents' => $lineCents,
        ];
    }

    $saleNumber = 'SAL-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

    $insertSale = $pdo->prepare(
        'INSERT INTO sales (sale_number, user_id, total)
         VALUES (?, ?, ?)'
    );
    $insertSale->execute([
        $saleNumber,
        (int) $_SESSION['user_id'],
        number_format($totalCents / 100, 2, '.', ''),
    ]);

    $saleId = (int) $pdo->lastInsertId();

    $insertItem = $pdo->prepare(
        'INSERT INTO sale_items
            (sale_id, medicine_id, medicine_name, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)'
    );

    foreach ($products as $product) {
        $updateStock->execute([
            $product['quantity'],
            $product['id'],
            $product['quantity'],
        ]);

        if ($updateStock->rowCount() !== 1) {
            throw new RuntimeException(
                $product['name'] . ' does not have enough stock.'
            );
        }

        $insertItem->execute([
            $saleId,
            $product['id'],
            $product['name'],
            $product['quantity'],
            number_format($product['unit_cents'] / 100, 2, '.', ''),
            number_format($product['line_cents'] / 100, 2, '.', ''),
        ]);
    }

    $pdo->commit();

    respond(201, [
        'message' => 'Sale recorded.',
        'saleNumber' => $saleNumber,
        'total' => number_format($totalCents / 100, 2, '.', ''),
    ]);
} catch (RuntimeException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respond(409, ['error' => $e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respond(500, ['error' => 'Could not record the sale. Check the database setup.']);
}
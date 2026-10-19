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
    respond(403, ['error' => 'Only admins and pharmacists can manage suppliers.']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Use POST to save a supplier.']);
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    respond(400, ['error' => 'Invalid request data.']);
}

$id = null;
if (isset($data['id']) && $data['id'] !== '') {
    $id = filter_var($data['id'], FILTER_VALIDATE_INT);
    if ($id === false || $id < 1) {
        respond(400, ['error' => 'Invalid supplier ID.']);
    }
}

$name = trim($data['name'] ?? '');
$phone = trim($data['phone'] ?? '');
$email = trim($data['email'] ?? '');
$address = trim($data['address'] ?? '');

if ($name === '' || strlen($name) > 150) {
    respond(400, ['error' => 'Enter a supplier name of 150 characters or fewer.']);
}
if (strlen($phone) > 30 || strlen($email) > 150 || strlen($address) > 255) {
    respond(400, ['error' => 'One of the supplier details is too long.']);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, ['error' => 'Enter a valid email address.']);
}

require __DIR__ . '/db.php';

try {
    $phone = $phone === '' ? null : $phone;
    $email = $email === '' ? null : $email;
    $address = $address === '' ? null : $address;

    if ($id === null) {
        $statement = $pdo->prepare(
            'INSERT INTO suppliers (supplier_name, phone, email, address)
             VALUES (?, ?, ?, ?)'
        );
        $statement->execute([$name, $phone, $email, $address]);
        $id = (int) $pdo->lastInsertId();
    } else {
        $statement = $pdo->prepare(
            'UPDATE suppliers
             SET supplier_name = ?, phone = ?, email = ?, address = ?
             WHERE id = ?'
        );
        $statement->execute([$name, $phone, $email, $address, $id]);

        if ($statement->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT id FROM suppliers WHERE id = ?');
            $exists->execute([$id]);
            if (!$exists->fetchColumn()) {
                respond(404, ['error' => 'Supplier not found.']);
            }
        }
    }

    respond(200, ['message' => 'Supplier saved.', 'id' => $id]);
} catch (PDOException $e) {
    respond(500, ['error' => 'Could not save the supplier.']);
}
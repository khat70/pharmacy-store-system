<?php
session_start();

if (empty($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    exit('Only an admin can create accounts.');
}

require __DIR__ . '/db.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($_POST['full_name'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? '';

    if ($fullName === '' || $username === '' || strlen($password) < 8) {
        $message = 'Enter a name and username, and use a password of at least 8 characters.';
    } elseif (!in_array($role, ['admin', 'pharmacist', 'cashier'], true)) {
        $message = 'Choose a valid role.';
    } else {
        try {
            $statement = $pdo->prepare(
                'INSERT INTO users (full_name, username, password_hash, role)
                 VALUES (?, ?, ?, ?)'
            );
            $statement->execute([
                $fullName,
                $username,
                password_hash($password, PASSWORD_DEFAULT),
                $role,
            ]);

            $message = 'Account created successfully.';
        } catch (PDOException $e) {
            $message = $e->getCode() === '23000'
                ? 'That username is already in use. Choose another.'
                : 'Could not create the account. Check the database connection.';
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create Staff Account</title>
</head>
<body>
    <h1>Create Staff Account</h1>

    <?php if ($message !== ''): ?>
        <p><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <form method="post">
        <label>
            Full name
            <input name="full_name" required>
        </label>
        <br><br>

        <label>
            Username
            <input name="username" required>
        </label>
        <br><br>

        <label>
            Password (at least 8 characters)
            <input type="password" name="password" minlength="8" required>
        </label>
        <br><br>

        <label>
            Role
            <select name="role" required>
                <option value="pharmacist">Pharmacist</option>
                <option value="cashier">Cashier</option>
                <option value="admin">Admin</option>
            </select>
        </label>
        <br><br>

        <button type="submit">Create account</button>
    </form>

    <p><a href="index.php">Back to dashboard</a></p>
</body>
</html>
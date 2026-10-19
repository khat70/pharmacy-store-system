<?php
require __DIR__ . '/db.php';

$message = '';
$usersExist = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$usersExist) {
    $fullName = trim($_POST['full_name'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($fullName === '' || $username === '' || strlen($password) < 8) {
        $message = 'Enter your name and username. Use a password with at least 8 characters.';
    } else {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $statement = $pdo->prepare(
            "INSERT INTO users (full_name, username, password_hash, role)
             VALUES (?, ?, ?, 'admin')"
        );
        $statement->execute([$fullName, $username, $passwordHash]);

        $usersExist = true;
        $message = 'Admin account created. You can now log in.';
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create First Admin</title>
</head>
<body>
    <h1>Create First Admin Account</h1>

    <?php if ($message !== ''): ?>
        <p><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <?php if ($usersExist): ?>
        <p>An account already exists. First-admin setup is closed.</p>
        <p><a href="login.php">Go to login</a></p>
    <?php else: ?>
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

            <button type="submit">Create Admin</button>
        </form>
    <?php endif; ?>
</body>
</html>
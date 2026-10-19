<?php
session_start();
require __DIR__ . '/db.php';

if (isset($_GET['logout'])) {
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $cookie = session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            time() - 42000,
            $cookie['path'],
            $cookie['domain'],
            $cookie['secure'],
            $cookie['httponly']
        );
    }

    session_destroy();
    header('Location: login.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    $statement = $pdo->prepare(
        'SELECT id, full_name, username, password_hash, role
         FROM users
         WHERE username = ? AND is_active = 1
         LIMIT 1'
    );
    $statement->execute([$username]);
    $user = $statement->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['role'] = $user['role'];
        header('Location: index.php');
exit;

        $roleName = ucfirst($user['role']);
    } else {
        $error = 'Incorrect username or password.';
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pharmacy store Login</title>
</head>
<body>
    <h1>Pharmacy Store System</h1>

    <?php if (!empty($_SESSION['user_id'])): ?>
        <p>
            You are logged in as
            <?= htmlspecialchars($_SESSION['full_name'], ENT_QUOTES, 'UTF-8') ?>
            (<?= htmlspecialchars(ucfirst($_SESSION['role']), ENT_QUOTES, 'UTF-8') ?>).
        </p>
        <p><a href="login.php?logout=1">Log out</a></p>
    <?php else: ?>
        <?php if ($error !== ''): ?>
            <p><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
        <?php endif; ?>

        <form method="post">
            <label>
                Username
                <input name="username" required>
            </label>
            <br><br>

            <label>
                Password
                <input type="password" name="password" required>
            </label>
            <br><br>

            <button type="submit">Log in</button>
        </form>
    <?php endif; ?>
</body>
</html>
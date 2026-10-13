<?php
$host = '127.0.0.1';
$dbname = 'pharmacystore_db';
$username = 'root';
$password = ''; // Leave blank if you logged into phpMyAdmin with a blank password.

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    exit('Database connection failed. Check the database name and WAMP settings.');
}
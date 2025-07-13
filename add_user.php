<?php
require_once '../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Require authentication and admin role
requireAuth();
requireRole(['admin']);

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required_fields = ['username', 'full_name', 'email', 'role', 'password'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        sendResponse(['success' => false, 'message' => ucfirst($field) . ' is required']);
    }
}

// Validate email format
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    sendResponse(['success' => false, 'message' => 'Invalid email format']);
}

// Validate role
$valid_roles = ['admin', 'pharmacist', 'cashier'];
if (!in_array($input['role'], $valid_roles)) {
    sendResponse(['success' => false, 'message' => 'Invalid role']);
}

// Validate password strength
if (strlen($input['password']) < 6) {
    sendResponse(['success' => false, 'message' => 'Password must be at least 6 characters long']);
}

try {
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if username already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$input['username']]);
    if ($stmt->fetch()) {
        sendResponse(['success' => false, 'message' => 'Username already exists']);
    }
    
    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$input['email']]);
    if ($stmt->fetch()) {
        sendResponse(['success' => false, 'message' => 'Email already exists']);
    }
    
    // Hash password
    $hashed_password = password_hash($input['password'], PASSWORD_DEFAULT);
    
    // Insert new user
    $stmt = $db->prepare("
        INSERT INTO users (username, full_name, email, role, password, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())
    ");
    
    $stmt->execute([
        $input['username'],
        $input['full_name'],
        $input['email'],
        $input['role'],
        $hashed_password
    ]);
    
    $user_id = $db->lastInsertId();
    
    // Log activity
    logActivity($db, $_SESSION['user_id'], 'User Added', "User: {$input['username']} ({$input['role']})");
    
    sendResponse([
        'success' => true,
        'message' => 'User added successfully',
        'user_id' => $user_id
    ]);
    
} catch (PDOException $e) {
    error_log("Add user error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
<?php
require_once '../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Require authentication and admin role
requireAuth();
requireRole(['admin']);

// Get input data - handle both JSON and form data
$input = [];
$content_type = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($content_type, 'application/json') !== false) {
    // Handle JSON input
    $json_input = json_decode(file_get_contents('php://input'), true);
    if ($json_input) {
        $input = $json_input;
    }
} else {
    // Handle form data
    $input = $_POST;
}

// Validate required fields
$required_fields = ['username', 'full_name', 'email', 'role', 'password'];
foreach ($required_fields as $field) {
    if (empty(trim($input[$field] ?? ''))) {
        sendResponse(['success' => false, 'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
    }
}

// Clean data
$username = trim($input['username']);
$full_name = trim($input['full_name']);
$email = trim($input['email']);
$role = trim($input['role']);
$password = trim($input['password']);

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['success' => false, 'message' => 'Invalid email format']);
}

// Validate role
$valid_roles = ['admin', 'pharmacist', 'cashier'];
if (!in_array($role, $valid_roles)) {
    sendResponse(['success' => false, 'message' => 'Invalid role']);
}

// Validate password strength
if (strlen($password) < 6) {
    sendResponse(['success' => false, 'message' => 'Password must be at least 6 characters long']);
}

try {
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if username already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        sendResponse(['success' => false, 'message' => 'Username already exists']);
    }
    
    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse(['success' => false, 'message' => 'Email already exists']);
    }
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user
    $stmt = $db->prepare("
        INSERT INTO users (username, full_name, email, role, password, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())
    ");
    
    $stmt->execute([
        $username,
        $full_name,
        $email,
        $role,
        $hashed_password
    ]);
    
    $user_id = $db->lastInsertId();
    
    // Log activity
    logActivity($db, $_SESSION['user_id'], 'User Added', "User: {$username} ({$role})");
    
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
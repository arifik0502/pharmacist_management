<?php
require_once '../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['username']) || !isset($input['password'])) {
    sendResponse(['success' => false, 'message' => 'Username and password required'], 400);
}

$username = trim($input['username']);
$password = $input['password'];
$role = isset($input['role']) ? $input['role'] : null;

// Validate inputs
if (empty($username) || empty($password)) {
    sendResponse(['success' => false, 'message' => 'Username and password cannot be empty'], 400);
}

try {
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Prepare query
    $query = "SELECT id, username, password, full_name, email, role, status FROM users WHERE username = ? AND status = 'active'";
    
    // Add role filter if specified
    if ($role) {
        $query .= " AND role = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$username, $role]);
    } else {
        $stmt = $db->prepare($query);
        $stmt->execute([$username]);
    }
    
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        // Start session
        startSession();
        
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['login_time'] = time();
        
        // Log the login activity
        logActivity($db, $user['id'], 'User logged in', 'Role: ' . $user['role']);
        
        // Return user data (excluding password)
        unset($user['password']);
        sendResponse([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user
        ]);
    } else {
        // Log failed login attempt
        error_log("Failed login attempt for username: $username");
        sendResponse(['success' => false, 'message' => 'Invalid username or password'], 401);
    }
    
} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
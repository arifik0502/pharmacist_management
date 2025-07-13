<?php
require_once '../config/database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Require authentication and admin role
requireAuth();
requireRole(['admin']);

try {
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get all users
    $stmt = $db->prepare("
        SELECT 
            id,
            username,
            full_name,
            email,
            role,
            status,
            created_at,
            updated_at
        FROM users
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    // Format dates and remove current user from list
    $filteredUsers = [];
    foreach ($users as $user) {
        if ($user['id'] != $_SESSION['user_id']) { // Don't show current user
            $user['created_at'] = date('Y-m-d H:i:s', strtotime($user['created_at']));
            $user['updated_at'] = date('Y-m-d H:i:s', strtotime($user['updated_at']));
            $filteredUsers[] = $user;
        }
    }
    
    sendResponse([
        'success' => true,
        'users' => $filteredUsers
    ]);
    
} catch (PDOException $e) {
    error_log("Users error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
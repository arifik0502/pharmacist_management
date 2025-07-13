<?php
require_once '../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    startSession();
    
    if (isset($_SESSION['user_id'])) {
        // Log the logout activity
        $database = new Database();
        $db = $database->getConnection();
        logActivity($db, $_SESSION['user_id'], 'User logged out', '');
    }
    
    // Destroy session
    session_destroy();
    
    sendResponse(['success' => true, 'message' => 'Logout successful']);
    
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Logout failed'], 500);
}
?>
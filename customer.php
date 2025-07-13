<?php
require_once '../config/database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Require authentication
requireAuth();

try {
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get all customers
    $stmt = $db->prepare("
        SELECT 
            id,
            name,
            phone,
            email,
            address,
            insurance_provider,
            created_at,
            updated_at
        FROM customers
        ORDER BY name
    ");
    $stmt->execute();
    $customers = $stmt->fetchAll();
    
    // Format dates
    foreach ($customers as &$customer) {
        $customer['created_at'] = date('Y-m-d H:i:s', strtotime($customer['created_at']));
        $customer['updated_at'] = date('Y-m-d H:i:s', strtotime($customer['updated_at']));
    }
    
    sendResponse([
        'success' => true,
        'customers' => $customers
    ]);
    
} catch (PDOException $e) {
    error_log("Customers error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
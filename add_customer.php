<?php
require_once '../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Require authentication
requireAuth();

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['name']) || !isset($input['phone'])) {
    sendResponse(['success' => false, 'message' => 'Name and phone are required']);
}

try {
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if customer with same phone already exists
    $stmt = $db->prepare("SELECT id FROM customers WHERE phone = ?");
    $stmt->execute([$input['phone']]);
    if ($stmt->fetch()) {
        sendResponse(['success' => false, 'message' => 'Customer with this phone number already exists']);
    }
    
    // Insert new customer
    $stmt = $db->prepare("
        INSERT INTO customers (name, phone, email, address, insurance_provider, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $stmt->execute([
        $input['name'],
        $input['phone'],
        $input['email'] ?? null,
        $input['address'] ?? null,
        $input['insurance_provider'] ?? null
    ]);
    
    $customer_id = $db->lastInsertId();
    
    // Log activity
    logActivity($db, $_SESSION['user_id'], 'Customer Added', "Customer: {$input['name']} (ID: {$customer_id})");
    
    sendResponse([
        'success' => true, 
        'message' => 'Customer added successfully',
        'customer_id' => $customer_id
    ]);
    
} catch (PDOException $e) {
    error_log("Add customer error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>  
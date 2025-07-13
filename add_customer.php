<?php
require_once '../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Require authentication
requireAuth();

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
if (empty(trim($input['name'] ?? ''))) {
    sendResponse(['success' => false, 'message' => 'Name is required']);
}

if (empty(trim($input['phone'] ?? ''))) {
    sendResponse(['success' => false, 'message' => 'Phone number is required']);
}

try {
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Clean and prepare data
    $name = trim($input['name']);
    $phone = trim($input['phone']);
    $email = !empty($input['email']) ? trim($input['email']) : null;
    $address = !empty($input['address']) ? trim($input['address']) : null;
    $insurance_provider = !empty($input['insurance_provider']) ? trim($input['insurance_provider']) : null;
    
    // Check if customer with same phone already exists
    $stmt = $db->prepare("SELECT id FROM customers WHERE phone = ?");
    $stmt->execute([$phone]);
    if ($stmt->fetch()) {
        sendResponse(['success' => false, 'message' => 'Customer with this phone number already exists']);
    }
    
    // Insert new customer
    $stmt = $db->prepare("
        INSERT INTO customers (name, phone, email, address, insurance_provider, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $stmt->execute([
        $name,
        $phone,
        $email,
        $address,
        $insurance_provider
    ]);
    
    $customer_id = $db->lastInsertId();
    
    // Log activity
    logActivity($db, $_SESSION['user_id'], 'Customer Added', "Customer: {$name} (ID: {$customer_id})");
    
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
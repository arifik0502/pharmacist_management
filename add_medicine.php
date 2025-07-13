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

// Required fields validation
$required_fields = ['name', 'batch_number', 'quantity', 'price', 'expiry_date'];
foreach ($required_fields as $field) {
    if (empty(trim($input[$field] ?? ''))) {
        sendResponse(['success' => false, 'message' => "Field '$field' is required"], 400);
    }
}

// Validate data types
$quantity = filter_var($input['quantity'], FILTER_VALIDATE_INT);
if ($quantity === false || $quantity < 0) {
    sendResponse(['success' => false, 'message' => 'Quantity must be a positive number'], 400);
}

$price = filter_var($input['price'], FILTER_VALIDATE_FLOAT);
if ($price === false || $price <= 0) {
    sendResponse(['success' => false, 'message' => 'Price must be a positive number'], 400);
}

// Validate expiry date
$expiry_date = DateTime::createFromFormat('Y-m-d', trim($input['expiry_date']));
if (!$expiry_date || $expiry_date->format('Y-m-d') !== trim($input['expiry_date'])) {
    sendResponse(['success' => false, 'message' => 'Invalid expiry date format'], 400);
}

try {
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Clean and prepare data
    $name = trim($input['name']);
    $batch_number = trim($input['batch_number']);
    $cost_price = !empty($input['cost_price']) ? floatval($input['cost_price']) : null;
    $min_stock = !empty($input['min_stock']) ? intval($input['min_stock']) : 10;
    $expiry_date_str = trim($input['expiry_date']);
    $supplier_id = !empty($input['supplier_id']) ? intval($input['supplier_id']) : null;
    
    // Check if medicine with same name and batch number already exists
    $stmt = $db->prepare("SELECT id FROM medicines WHERE name = ? AND batch_number = ?");
    $stmt->execute([$name, $batch_number]);
    
    if ($stmt->fetch()) {
        sendResponse(['success' => false, 'message' => 'Medicine with this name and batch number already exists'], 409);
    }
    
    // Insert medicine
    $stmt = $db->prepare("
        INSERT INTO medicines (name, batch_number, quantity, price, cost_price, min_stock, expiry_date, supplier_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $name,
        $batch_number,
        $quantity,
        $price,
        $cost_price,
        $min_stock,
        $expiry_date_str,
        $supplier_id
    ]);
    
    $medicine_id = $db->lastInsertId();
    
    // Log activity
    logActivity($db, $_SESSION['user_id'], 'Added new medicine', "Medicine: $name, Batch: $batch_number");
    
    sendResponse([
        'success' => true,
        'message' => 'Medicine added successfully',
        'medicine_id' => $medicine_id
    ]);
    
} catch (PDOException $e) {
    error_log("Add medicine error: " . $e->getMessage());
    
    if ($e->getCode() == 23000) {
        sendResponse(['success' => false, 'message' => 'Medicine with this name and batch number already exists'], 409);
    }
    
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
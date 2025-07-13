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
    
    // Get recent sales
    $stmt = $db->prepare("
        SELECT 
            s.id,
            s.quantity,
            s.total_amount as total,
            s.payment_method,
            s.created_at as date,
            c.name as customer_name,
            m.name as medicine_name,
            m.price as unit_price
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        JOIN medicines m ON s.medicine_id = m.id
        ORDER BY s.created_at DESC
        LIMIT 100
    ");
    $stmt->execute();
    $sales = $stmt->fetchAll();
    
    // Format dates
    foreach ($sales as &$sale) {
        $sale['date'] = date('Y-m-d H:i:s', strtotime($sale['date']));
        $sale['total'] = number_format($sale['total'], 2);
    }
    
    // Get customers for dropdown
    $stmt = $db->prepare("SELECT id, name FROM customers ORDER BY name");
    $stmt->execute();
    $customers = $stmt->fetchAll();
    
    // Get medicines for dropdown (only available stock)
    $stmt = $db->prepare("
        SELECT 
            id, 
            name, 
            price, 
            quantity 
        FROM medicines 
        WHERE quantity > 0 
        AND expiry_date > CURDATE()
        ORDER BY name
    ");
    $stmt->execute();
    $medicines = $stmt->fetchAll();
    
    sendResponse([
        'success' => true,
        'sales' => $sales,
        'customers' => $customers,
        'medicines' => $medicines
    ]);
    
} catch (PDOException $e) {
    error_log("Sales error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
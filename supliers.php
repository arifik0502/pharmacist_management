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
    
    // Get all suppliers with product count
    $stmt = $db->prepare("
        SELECT 
            s.id,
            s.name,
            s.contact_person,
            s.phone,
            s.email,
            s.address,
            s.created_at,
            s.updated_at,
            COUNT(m.id) as product_count
        FROM suppliers s
        LEFT JOIN medicines m ON s.id = m.supplier_id
        GROUP BY s.id
        ORDER BY s.name
    ");
    $stmt->execute();
    $suppliers = $stmt->fetchAll();
    
    // Format data
    foreach ($suppliers as &$supplier) {
        $supplier['products'] = $supplier['product_count'] . ' products';
        $supplier['created_at'] = date('Y-m-d H:i:s', strtotime($supplier['created_at']));
        $supplier['updated_at'] = date('Y-m-d H:i:s', strtotime($supplier['updated_at']));
        unset($supplier['product_count']);
    }
    
    sendResponse([
        'success' => true,
        'suppliers' => $suppliers
    ]);
    
} catch (PDOException $e) {
    error_log("Suppliers error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
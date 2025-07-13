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
    
    // Get all medicines with supplier information
    $stmt = $db->prepare("
        SELECT 
            m.id,
            m.name,
            m.batch_number,
            m.quantity,
            m.price,
            m.cost_price,
            m.min_stock,
            m.expiry_date,
            s.name as supplier_name,
            m.created_at,
            m.updated_at
        FROM medicines m
        LEFT JOIN suppliers s ON m.supplier_id = s.id
        ORDER BY m.name, m.expiry_date
    ");
    $stmt->execute();
    $medicines = $stmt->fetchAll();
    
    // Process each medicine to add status information
    foreach ($medicines as &$medicine) {
        // Calculate stock status
        if ($medicine['quantity'] <= 0) {
            $medicine['stock_status'] = 'out_of_stock';
        } elseif ($medicine['quantity'] <= $medicine['min_stock']) {
            $medicine['stock_status'] = 'low';
        } else {
            $medicine['stock_status'] = 'normal';
        }
        
        // Calculate expiry status
        $today = new DateTime();
        $expiry = new DateTime($medicine['expiry_date']);
        $interval = $today->diff($expiry);
        $days_to_expiry = $interval->invert ? -$interval->days : $interval->days;
        
        if ($days_to_expiry < 0) {
            $medicine['expiry_status'] = 'expired';
        } elseif ($days_to_expiry <= 30) {
            $medicine['expiry_status'] = 'expiring_soon';
        } else {
            $medicine['expiry_status'] = 'normal';
        }
        
        $medicine['days_to_expiry'] = $days_to_expiry;
        
        // Format dates
        $medicine['expiry_date'] = date('Y-m-d', strtotime($medicine['expiry_date']));
        $medicine['created_at'] = date('Y-m-d H:i:s', strtotime($medicine['created_at']));
        $medicine['updated_at'] = date('Y-m-d H:i:s', strtotime($medicine['updated_at']));
    }
    
    sendResponse([
        'success' => true,
        'medicines' => $medicines
    ]);
    
} catch (PDOException $e) {
    error_log("Inventory error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
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
    
    // Get today's date
    $today = date('Y-m-d');
    
    // Get total sales for today
    $stmt = $db->prepare("SELECT COALESCE(SUM(total), 0) as total_sales FROM sales WHERE sale_date = ?");
    $stmt->execute([$today]);
    $totalSales = $stmt->fetch()['total_sales'];
    
    // Get total products in stock
    $stmt = $db->prepare("SELECT COUNT(*) as total_products FROM medicines WHERE quantity > 0");
    $stmt->execute();
    $totalProducts = $stmt->fetch()['total_products'];
    
    // Get low stock items
    $stmt = $db->prepare("SELECT COUNT(*) as low_stock_items FROM medicines WHERE quantity <= min_stock");
    $stmt->execute();
    $lowStockItems = $stmt->fetch()['low_stock_items'];
    
    // Get prescriptions for today
    $stmt = $db->prepare("SELECT COUNT(*) as prescriptions_today FROM prescriptions WHERE prescription_date = ?");
    $stmt->execute([$today]);
    $prescriptionsToday = $stmt->fetch()['prescriptions_today'];
    
    // Get recent activities
    $stmt = $db->prepare("
        SELECT 
            DATE_FORMAT(al.created_at, '%H:%i') as time,
            al.activity,
            u.full_name as user,
            'completed' as status
        FROM activity_log al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
    ");
    $stmt->execute();
    $recentActivities = $stmt->fetchAll();
    
    // Prepare response
    $response = [
        'success' => true,
        'totalSales' => number_format($totalSales, 2),
        'totalProducts' => $totalProducts,
        'lowStockItems' => $lowStockItems,
        'prescriptionsToday' => $prescriptionsToday,
        'recentActivities' => $recentActivities
    ];
    
    sendResponse($response);
    
} catch (PDOException $e) {
    error_log("Dashboard error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
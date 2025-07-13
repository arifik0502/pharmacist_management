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
    
    // Get all prescriptions
    $stmt = $db->prepare("
        SELECT 
            p.id,
            p.prescription_id,
            p.dosage,
            p.instructions,
            p.status,
            p.created_at,
            p.updated_at,
            c.name as patient_name,
            p.doctor_name,
            m.name as medicine_name
        FROM prescriptions p
        JOIN customers c ON p.customer_id = c.id
        JOIN medicines m ON p.medicine_id = m.id
        ORDER BY p.created_at DESC
    ");
    $stmt->execute();
    $prescriptions = $stmt->fetchAll();
    
    // Format dates
    foreach ($prescriptions as &$prescription) {
        $prescription['date'] = date('Y-m-d', strtotime($prescription['created_at']));
        $prescription['created_at'] = date('Y-m-d H:i:s', strtotime($prescription['created_at']));
        $prescription['updated_at'] = date('Y-m-d H:i:s', strtotime($prescription['updated_at']));
    }
    
    sendResponse([
        'success' => true,
        'prescriptions' => $prescriptions
    ]);
    
} catch (PDOException $e) {
    error_log("Prescriptions error: " . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);
}
?>
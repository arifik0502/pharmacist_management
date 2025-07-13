<?php
// Database configuration
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'pharmacy_management');
define('DB_USER', 'root');
define('DB_PASS', 'toor');

// Database connection class
class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
                )
            );
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}

// Session management
function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

// Response helper function
function sendResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

// Authentication check
function requireAuth() {
    startSession();
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['success' => false, 'message' => 'Authentication required'], 401);
    }
}

// Role check
function requireRole($roles) {
    startSession();
    if (!isset($_SESSION['user_role']) || !in_array($_SESSION['user_role'], $roles)) {
        sendResponse(['success' => false, 'message' => 'Insufficient permissions'], 403);
    }
}

// Log activity
function logActivity($db, $user_id, $activity, $details = '') {
    try {
        $stmt = $db->prepare("INSERT INTO activity_log (user_id, activity, details) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $activity, $details]);
    } catch(PDOException $e) {
        error_log("Activity log error: " . $e->getMessage());
    }
}
?>
<?php
// Prevent CORS issues for the frontend if on a different domain (optional, mostly for dev)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Authorization, Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get the Authorization header
$headers = getallheaders();
$token = isset($headers['Authorization']) ? $headers['Authorization'] : '';

// Fallback to query param or env if needed, but header is standard
if (!$token && isset($_GET['token'])) {
    $token = $_GET['token'];
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'No Authorization token provided']);
    exit;
}

$path = isset($_GET['path']) ? $_GET['path'] : '';
$apiUrl = '';

// Map paths to ClickUp API URLs
if ($path === 'sprint') {
    $folderId = isset($_GET['folderId']) ? $_GET['folderId'] : '';
    if (!$folderId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing folderId']);
        exit;
    }
    $apiUrl = "https://api.clickup.com/api/v2/folder/$folderId/list?archived=false";

} else if ($path === 'list') {
    $listId = isset($_GET['listId']) ? $_GET['listId'] : '';
    $apiUrl = "https://api.clickup.com/api/v2/list/$listId";

} else if ($path === 'tasks') {
    $listId = isset($_GET['listId']) ? $_GET['listId'] : '';
    $apiUrl = "https://api.clickup.com/api/v2/list/$listId/task?include_closed=true&subtasks=true";

} else if ($path === 'folder_tasks') {
    $teamId = getenv('VITE_CLICKUP_TEAM_ID'); // Verify if env vars are accessible or passed via query
    // Since PHP might not have access to .env easily without a library, better to expect teamId in query if possible.
    // However, DashboardPage doesn't send teamId for some of these. 
    // Let's rely on query params as much as possible or fail gracefully.
    // vite.config.js used env.VITE_CLICKUP_TEAM_ID.
    
    // For 'folder_tasks', vite config used env.VITE_CLICKUP_TEAM_ID.
    // We should fallback to query param if getenv fails, or hardcode if we must (bad practice).
    // Let's check if the requester sends teamId.
    
    $folderId = isset($_GET['folderId']) ? $_GET['folderId'] : '';
    $teamId = isset($_GET['teamId']) ? $_GET['teamId'] : ''; // Should be passed from frontend
    
    // If frontend doesn't pass it, this will fail. DashboardPage.jsx doesn't seem to call 'folder_tasks' yet.
    // If it did, we'd need to update it to pass teamId.
    
    $apiUrl = "https://api.clickup.com/api/v2/team/$teamId/task?project_ids[]=$folderId&include_closed=true&subtasks=true";

} else if ($path === 'team_tasks') {
    $listId = isset($_GET['listId']) ? $_GET['listId'] : '';
    $teamId = isset($_GET['teamId']) ? $_GET['teamId'] : '';
    $apiUrl = "https://api.clickup.com/api/v2/team/$teamId/task?list_ids[]=$listId&include_closed=true&subtasks=true";

} else if ($path === 'list_views') {
    $listId = isset($_GET['listId']) ? $_GET['listId'] : '';
    $apiUrl = "https://api.clickup.com/api/v2/list/$listId/view";

} else if ($path === 'view_tasks') {
    $viewId = isset($_GET['viewId']) ? $_GET['viewId'] : '';
    $page = isset($_GET['page']) ? $_GET['page'] : '0';
    $apiUrl = "https://api.clickup.com/api/v2/view/$viewId/task?page=$page&include_closed=true";

} else if ($path === 'user') {
    $apiUrl = "https://api.clickup.com/api/v2/user";

} else if ($path === 'my_tasks') {
    $teamId = isset($_GET['teamId']) ? $_GET['teamId'] : '';
    $userId = isset($_GET['userId']) ? $_GET['userId'] : '';
    $page = isset($_GET['page']) ? $_GET['page'] : '0';
    
    if (!$teamId || !$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing teamId or userId']);
        exit;
    }
    $apiUrl = "https://api.clickup.com/api/v2/team/$teamId/task?assignees[]=$userId&page=$page&include_closed=true&subtasks=true";
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid path parameter']);
    exit;
}

// Initialize cURL session
$ch = curl_init($apiUrl);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: $token",
    "Content-Type: application/json"
]);

// Execute cURL request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Curl error: ' . curl_error($ch)]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
?>

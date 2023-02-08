<?php
/**
*   This script gets all the entries associated with a given day "d"
**/

$d = $_POST["d"];
$s = "localhost";
$u = "root";
$p = "";
$db = "schedule";
$a = array();

// Create connection
$conn = new mysqli($s, $u, $p, $db);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$sql = "SELECT * FROM schedule WHERE DATE = '$d'";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    for ($i = 0; $i < $result->num_rows; $i++) {
        $a[$i] = $result->fetch_assoc();
    }
    echo json_encode($a);
}
$conn->close();
?>
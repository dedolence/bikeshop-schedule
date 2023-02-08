<?php
/**
*   This script deletes the entry associated with the ID parameter sent
**/

$id = $_POST["id"];
$s = "localhost";
$u = "root";
$p = "";
$db = "schedule";

// Create connection
$conn = new mysqli($s, $u, $p, $db);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$sql = "DELETE FROM schedule WHERE ID = '$id'";
if ($conn->query($sql) === TRUE) {
    echo "Record deleted successfully";
} else {
    echo "Error deleting record: " . $conn->error;
}
$conn->close();
?>
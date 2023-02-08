<?php
/**
*   This script creates inserts a new row entry into the schedule
**/

$s = "localhost";
$u = "root";
$p = "";
$db = "schedule";

// Create connection
$conn = new mysqli($s, $u, $p, $db);

// Get parameters
$date     = $_POST["d"];
$col    = $_POST["col"];
$val    = mysqli_real_escape_string($conn, $_POST["val"]);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$sql = "INSERT INTO schedule (DATE, $col) VALUES ('$date', '$val')";

if ( $conn -> query($sql) === TRUE) {
  $lastID = $conn->insert_id;
  echo $lastID;
} else {
    echo "Error adding record: " . $conn->error;
}
$conn->close();
?>
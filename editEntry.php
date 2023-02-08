<?php

$s = "localhost";
$u = "root";
$p = "";
$db = "schedule";

// Create connection
$conn = new mysqli($s, $u, $p, $db);

// Get parameters
$id     = $_POST["id"];
$col    = $_POST["col"];
$val    = mysqli_real_escape_string($conn, $_POST["val"]);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$sql = "UPDATE schedule SET $col = '$val' WHERE ID =  $id";
if ($conn->query($sql) === TRUE) {
  echo "Entry updated successfully!";
} else {
    echo "Error deleting record: " . $conn->error;
}
$conn->close();
?>
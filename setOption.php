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
$sql = "UPDATE calendar SET $col = '$val' WHERE DAY =  '$id'";
if ($conn->query($sql) === TRUE) {
  echo "Entry updated successfully! \n" . $id . " : " . $col . " : " . $val;
} else {
    echo "Error editing record: " . $conn->error;
}
$conn->close();
?>
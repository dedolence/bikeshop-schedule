<?php
/**
*   A simple search
**/

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

$a = array();

$sql = "SELECT * FROM schedule WHERE ";

if (isset($_POST["DATE"])) {
  array_push($a, "DATE LIKE '" . $_POST["DATE"] . "'");
}
if (isset($_POST["NAME"])) {
  array_push($a, "NAME LIKE '%" . $_POST["NAME"] . "%'");
}
if (isset($_POST["EMAIL"])) {
  array_push($a, "EMAIL LIKE '%" . $_POST["EMAIL"] . "%'");
}
if (isset($_POST["PHONE"])) {
  array_push($a, "PHONE LIKE '%" . $_POST["PHONE"] . "%'");
}
if (isset($_POST["DESCR"])) {
  array_push($a, "DESCR LIKE '%" . $_POST["DESCR"] . "%'");
}
if (isset($_POST["NOTES"])) {
  array_push($a, "NOTES LIKE '%" . $_POST["NOTES"] . "%'");
}

//$sql = "SELECT * FROM schedule WHERE DATE = '$d'";
//$sql = "SELECT * FROM schedule WHERE DATE LIKE '%" . $a[DATE] . "%' OR NAME LIKE '%" . $a[] . "%'

$length = count($a);

if ($length > 1) {
  for ($i = 0; $i < $length; $i++) {
    if ($i == 0) {
      $sql .= " ";
      $sql .= $a[$i];
    } else {
      $sql .= " OR ";
      $sql .= $a[$i];
    }
  }
} else {
  $sql .= $a[0];
}
$r = array();
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    for ($i = 0; $i < $result->num_rows; $i++) {
        $r[$i] = $result->fetch_assoc();
    }
    echo json_encode($r);
}
$conn->close();
?>
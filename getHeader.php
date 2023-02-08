<?php
/**
*   This script gets the options set for a given day $d and creates
*   default options if none exist.
**/

$d = $_POST["d"];       // string date in YYYY-MM-DD format
$s = strtotime($d);     // date object based on string
$day = date("D", $s);   // new string (?) that's just the three-letter day of the week e.g. Mon, Tue, etc.
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
$sql = "SELECT * FROM calendar WHERE DAY = '$d'";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode($row);
} else {
    if ($day == "Sun" || $day == "Mon") {
        // it's a Sunday or Monday - shop is closed
       $newSql = "INSERT INTO calendar (DAY, CLOSED) values ('$d', '1')";
       if ($conn->query($newSql) === TRUE) {
            $a['DAY'] = "$d";
            $a['CLOSED'] = "1";
            $a['OPEN'] = "1300";
            $a['CLOSE'] = "1830";
            $a['NOTES'] = "";
            $a['FLOW'] = "0";
            echo json_encode($a);
        } else {
            echo "Error recording new day's options: " . $conn->error;
        }
    } elseif ($day == "Sat") {
        // saturdays are walk-in days by default
        $newSql = "INSERT INTO calendar (DAY, FLOW) values ('$d', '1')";
        if ($conn->query($newSql) === TRUE) {
            $a['DAY'] = "$d";
            $a['CLOSED'] = "0";
            $a['OPEN'] = "1300";
            $a['CLOSE'] = "1830";
            $a['NOTES'] = "";
            $a['FLOW'] = "1";
            echo json_encode($a);
        } else {
            echo "Error recording new day's options: " . $conn->error;
        }
    } else {
        // it's neither Sunday nor Monday, insert default values
        $newSql = "INSERT INTO calendar (DAY) VALUES ('$d')";
        if ($conn->query($newSql) === TRUE) {
            $a['DAY'] = "$d";
            $a['CLOSED'] = "0";
            $a['OPEN'] = "1300";
            $a['CLOSE'] = "1830";
            $a['NOTES'] = "";
            $a['FLOW'] = "0";
            echo json_encode($a);
        } else {
            echo "Error recording new day's options: " . $conn->error;
        }
    }
}
$conn->close();
?>
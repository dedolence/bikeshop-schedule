<html>
  <head></head>

  <body>
    <form action="phpDate.php" method="GET">
    Enter a date in YYYY-MM-DD format:<br />
    <input type="text" name="d"><br />
    <input type="submit">
    </form>
    <?php
      if (isset($_GET["d"])) {
        $d = $_GET["d"];
        $s = strtotime($d);
        $day = date("D", $s);
        if ($day == "Sun" || $day == "Mon") {
          echo "The shop isn't open!";
        } else {
          echo "The shop is open!";
        }
      }
    ?>
  </body>
</html>
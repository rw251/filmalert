<?php
echo '1';
include '../private/config.php';
echo CONST_DB_HOST;
echo CONST_DB_USERNAME;
echo CONST_DB_NAME;

mysqli_report(MYSQLI_REPORT_ALL);

try {
    echo '2aa';
    echo '2aaa';
    $con = mysqli_connect(CONST_DB_HOST,CONST_DB_USERNAME,CONST_DB_PASSWORD,CONST_DB_NAME);
} catch(Exception $e) {
    echo '2b';
    print_r($e);
}
echo '3';
if (mysqli_connect_errno()) {
    echo '4';
    error_log("Failed to connect to MySQL: " . mysqli_connect_error());
    die("Didn't connect to db");
}
echo '5';

$result=mysqli_query($con,"SELECT * FROM films;");
echo '6';
mysqli_close($con);
echo 'done';

?>
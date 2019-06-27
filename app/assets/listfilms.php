<?php

include 'dbConnect.php'; //exposes a $con object and $email

require_once '../../vendor/autoload.php';
use Symfony\Component\HttpFoundation\Response;

$arr = array();

$userId = mysqli_real_escape_string($con, $userId);
if ($result = mysqli_query($con,"select `film`, `when`, `channel`, `year`, `imdbId` from `film` f INNER JOIN `users` u on u.id = f.userId WHERE `googleSub`='$userId'")) {
    /* fetch object array */
    while ($row = $result->fetch_row()) {
        $arr[] = '{"id":"'.$row[4].'","cell":["'.$row[0].'","'.$row[3].'","'.$row[2].'","'.$row[1].'"]}';
    }

    /* free result set */
    mysqli_free_result($result);
}

mysqli_close($con);

$response = new Response(
  '['. implode(',',$arr) .']',
  Response::HTTP_OK,
  array('content-type' => 'application/json') //
);

$response->send();
?>
<?php

include 'dbConnect.php'; //exposes a $con object and $userId

require_once '../vendor/autoload.php';
use Symfony\Component\HttpFoundation\Response;


$id=$_POST['id'];
$film=$_POST['name'];
$year=$_POST['year'];

date_default_timezone_set('Europe/London'); 
$dt = date('Y-m-d H:i:s');

$response;

$film = mysqli_real_escape_string($con, $film);
$result=mysqli_query($con,"INSERT INTO `film` (`userId`,`film`,`year`,`imdbId`,`added`) VALUES ( (SELECT `id` FROM `users` WHERE `googleSub`='$userId'),'$film',$year,'$id','$dt')");
if ( false===$result ) {
    error_log(mysqli_error($con));
    $response = new Response(
        '{"status":"failure"}',
        Response::HTTP_OK,
        array('content-type' => 'application/json')
      );
}
else {
    $result=mysqli_query($con,"SELECT `when`, `channel` FROM `film` WHERE `imdbId` = '$id' AND `when` IS NOT NULL");
    if ( false===$result ) {
        error_log(mysqli_error($con));
        $response = new Response(
            '{"status":"failure"}',
            Response::HTTP_OK,
            array('content-type' => 'application/json')
        );
    }
    else{
        if(mysqli_num_rows($result)>0){
            $row = mysqli_fetch_array($result);
            $w =$row['when'];
            $c =$row['channel'];
            mysqli_free_result($result);
            $result=mysqli_query($con,"UPDATE `film` set `when`='$w', `channel`='$c' where imdbId='$id'");

            $response = new Response(
                '{"status":"success", "film":{"id":"'.$id.'","year":"'.$year.'","name":"'.$film.'","when":"'.$w.'","channel":"'.$c.'"}}',
                Response::HTTP_OK,
                array('content-type' => 'application/json')
            );
        } else {
            $response = new Response(
                '{"status":"success", "film":{"id":"'.$id.'","year":"'.$year.'","name":"'.$film.'"}}',
                Response::HTTP_OK,
                array('content-type' => 'application/json')
            );
        }
    }
}
  
mysqli_close($con);
$response->send();

?>
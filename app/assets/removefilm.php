<?php

include 'dbConnect.php'; //exposes a $con object and $userId

require_once '../../vendor/autoload.php';
use Symfony\Component\HttpFoundation\Response;

$imdbId = $_POST['imdbId'];
$response;

if(!mysqli_query($con,"DELETE FROM film WHERE userId = (SELECT `id` FROM `users` WHERE `googleSub`='$userId') and imdbId = $imdbId")){
    error_log(mysqli_error($con));
    $response = new Response(
        '{"status":"failure", error:"db error"}',
        Response::HTTP_OK,
        array('content-type' => 'application/json')
    );
};

mysqli_close($con);

$response = new Response(
    '{"status":"success", "film" : {"imdbId" : "' . $imdbId .'"}}',
    Response::HTTP_OK,
    array('content-type' => 'application/json') 
);
$response->send();

?>
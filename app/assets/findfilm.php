<?php

include 'checkLoggedIn.php';

require_once '../../vendor/autoload.php';
use Symfony\Component\HttpFoundation\Response;


$filmName=$_GET['name'];

if(!$filmName) {
    die('Pass param name=');
}

$search = new \Imdb\TitleSearch();
$results=$search->search($filmName, array(\Imdb\TitleSearch::MOVIE), 5);

$arr=array();
foreach ($results as $res) {
    $mid  = $res->imdbid();
    $name = $res->title();
    $year = $res->year();
    
    if($year && $year>1900)
        $arr[] = '{"id":"'.$mid.'","name":"'.$name.'","year":"'.$year.'"}';
}

$response = new Response(
    '['. implode(',',$arr) .']',
    Response::HTTP_OK,
    array('content-type' => 'application/json') //
  );
  
$response->send();

?>
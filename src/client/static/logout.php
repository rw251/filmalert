<?php

require_once '../vendor/autoload.php';

session_start();
unset($_SESSION['user']);
session_destroy();

use Symfony\Component\HttpFoundation\Response;

$response = new Response(
  '{"status":"success","message":"Logged out"}',
  Response::HTTP_OK,
  array('content-type' => 'application/json') //
);

$response->send();

?>
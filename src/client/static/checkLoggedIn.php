<?php

session_start();
session_regenerate_id();

if(!isset($_SESSION['user'])) {
  die('Not logged in');
} 

$userId = $_SESSION['user'];

?>
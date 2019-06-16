<?php

session_start();
session_regenerate_id();

if(!isset($_SESSION['user'])) {
  print('Not logged in');
} else {
  print('Logged in as' . $_SESSION['user']);
}
?>
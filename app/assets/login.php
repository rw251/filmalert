<?php

require_once '../vendor/autoload.php';

session_start();

// Get $id_token via HTTPS POST.
$id_token = $_POST['idtoken'];

$CLIENT_ID = getenv('FILMALERT_GOOGLE_CLIENT_ID');

if($id_token) {
  $client = new Google_Client(['client_id' => $CLIENT_ID]);
  // $client = new Google_Client();
  // $client->setClientId($CLIENT_ID);
  $payload = $client->verifyIdToken($id_token);
  if ($payload) {
    $userId = $payload['sub'];
    $email = $payload['email'];
    $_SESSION['user'] = $userId;

    include '../private/config.php';
    
    $con = mysqli_connect(CONST_DB_HOST,CONST_DB_USERNAME,CONST_DB_PASSWORD,CONST_DB_NAME);
    
    if (mysqli_connect_errno()) {
        error_log("Failed to connect to MySQL: " . mysqli_connect_error());
        die("Didn't connect to db");
    }

    $query = "INSERT INTO users SET openid='$email', googleSub='$userId' ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)";
    mysqli_query($con, $query);
    $id = mysqli_insert_id($con);
    print($id);
    print($userId);
    print_r($email);
  } else {
    // Invalid ID token
    print('invalid');
  }
} else {
  print('balls');
}

?>
<?php
/*
 * Sample application for Google+ client to server authentication.
 * Remember to fill in the OAuth 2.0 client id and client secret,
 * which can be obtained from the Google Developer Console at
 * https://code.google.com/apis/console
 *
 * Copyright 2013 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Note (Gerwin Sturm):
 * Include path is still necessary despite autoloading because of the require_once in the libary
 * Client library should be fixed to have correct relative paths
 * e.g. require_once '../Google/Model.php'; instead of require_once 'Google/Model.php';
 */
set_include_path(get_include_path() . PATH_SEPARATOR . __DIR__ .'/../vendor/google/apiclient/src');

require_once __DIR__.'/../vendor/autoload.php';

include __DIR__.'/../private/config.php';

function connect(){
    $con = mysqli_connect(CONST_DB_HOST,CONST_DB_USERNAME,CONST_DB_PASSWORD,CONST_DB_NAME);

    if (mysqli_connect_errno()) {
        echo "Failed to connect to MySQL: " . mysqli_connect_error();
    }
    return $con;
}
function disconnect($con){
    mysqli_close($con);
}

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

//const CLIENT_ID = '750259488516-p8opjt83thhicfp8bjfahv1jjtisovvq.apps.googleusercontent.com';
const CLIENT_ID = '750259488516-a7tue7cr3k8dik5i59m3b8ckmmb0eaf6.apps.googleusercontent.com';
const CLIENT_SECRET = 'HWzxxATJNSkBPCgX7YAId-87';
const APPLICATION_NAME = "FilmAlert";


$client = new Google_Client();
$client->setApplicationName(APPLICATION_NAME);
$client->setClientId(CLIENT_ID);
$client->setClientSecret(CLIENT_SECRET);
$client->setRedirectUri('postmessage');
$client->setScopes(array('https://www.googleapis.com/auth/userinfo.email'));

$plus = new Google_Service_Plus($client);

$app = new Silex\Application();
$app['debug'] = true;

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__,
));
$app->register(new Silex\Provider\SessionServiceProvider());

// Initialize a session for the current user, and render main.html.
$app->get('/', function () use ($app) {
    $state = md5(rand());
    $app['session']->set('state', $state);
    return $app['twig']->render('main.html', array(
        'CLIENT_ID' => CLIENT_ID,
        'STATE' => $state,
        'APPLICATION_NAME' => APPLICATION_NAME
    ));
});

// Upgrade given auth code to token, and store it in the session.
// POST body of request should be the authorization code.
$app->post('/connect', function (Request $request) use ($app, $client, $plus) {
    $token = $app['session']->get('token');

    // Ensure that this is no request forgery going on, and that the user
    // sending us this connect request is the user that was supposed to.
    if ($request->get('state') != ($app['session']->get('state'))) {
        return new Response('Invalid state parameter', 401);
    }

    $app['session']->set('OPENID_AUTH', true);
    
    $token = $request->request->get('idtoken');
    $gPlusId = $request->get['gplus_id'];

    $ticket = $client->verifyIdToken($token);
    if ($ticket) {
        $data = $ticket->getAttributes();
        // Store the token in the session for later use.
        $app['session']->set('token', json_encode($token));
        $id=4;
        // get email
        $email = $data['payload']['email'];
        
        //find id in database or insert and get id
        $db = connect();
        $query = "INSERT INTO users SET openid='$email' ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)";
        mysqli_query($db, $query);
        $id = mysqli_insert_id($db);
        disconnect($db);
        $app['session']->set('openid', $id);
    
        $response = "Successfully connected with token: " . print_r($token, true);
    
        return new Response($response, 200);
    } else {
        return new Response("error", 500);
    }
});

// Revoke current user's token and reset their session.

$app->post('/logout', function () use ($app) {
    try{
        // Remove the credentials from the user's session.
        $app['session']->set('token', '');
        $app['session']->set('OPENID_AUTH', false);
        $app['session']->set('openid', -1);
        return new Response('Successfully logged out', 200);
    }
    catch(Exception $e){
        return new Response('error '.$e, 200);
    }
});

$app->post('/films/find/{name}', function ($name) use($app, $client){
    if(!$app['session']->get('OPENID_AUTH')) return new Response('{"status":"failure", error: "Not logged in"}', 200);
    
    
    require_once("../cron/simple_html_dom.php");
    require_once("../imdbphp2-2.3.2/imdb.class.php");       // include the class file
    require_once("../imdbphp2-2.3.2/imdbsearch.class.php"); // for Moviepilot: pilotsearch.class.php
    
    $filmName=$name;

    $search = new imdbsearch();
    $arrr = array();
    $arrr[] = imdbsearch::MOVIE;
    $results=$search->search($filmName, $arrr, 5);
    
    $arr=array();
    foreach ($results as $res) {
        $mid  = $res->imdbid();
        $name = $res->title();
        $year = $res->year();
        
        $arr[] = '{"id":"'.$mid.'","name":"'.$name.'","year":"'.$year.'"}';
    }
    
    return new Response('{"status":"success", "films":['.implode(',',$arr).']}',200);
});

$app->post('/films/add/{id}/{film}/{year}', function ($id, $film, $year) use($app, $client){
    if(!$app['session']->get('OPENID_AUTH')) return new Response('{"status":"failure", error: "Not logged in"}', 200);

    date_default_timezone_set('Europe/London'); 
    $dt = date('Y-m-d H:i:s');

    $db = connect();
    $openid = $app['session']->get('openid');
    $film = mysqli_real_escape_string($db, $film);
    $result=mysqli_query($db,"INSERT INTO `film` (`userId`,`film`,`year`,`imdbId`,`added`) VALUES ($openid,'$film',$year,'$id','$dt')");
    if ( false===$result ) {
        $resp = new Response('{"status":"failure", error: "'.mysqli_error($db).'"}', 200);
        disconnect($db);
      return $resp;
    }
    else {
        //mysqli_free_result($result);
        $result=mysqli_query($db,"SELECT `when`, `channel` FROM `film` WHERE `imdbId` = '$id' AND `when` IS NOT NULL");
        if ( false===$result ) {
            $resp = new Response('{"status":"failure", error: "'.mysqli_error($db).'"}', 200);
            disconnect($db);
          return $resp;
        }
        else{
            if(mysqli_num_rows($result)>0){
                $row = mysqli_fetch_array($result);
                $w =$row['when'];
                $c =$row['channel'];
                mysqli_free_result($result);
                $result=mysqli_query($db,"UPDATE `film` set `when`='$w', `channel`='$c' where imdbId='$id'");
                disconnect($db);
                return new Response('{"status":"success", "film":{"id":"'.$id.'","year":"'.$year.'","name":"'.$film.'","when":"'.$w.'","channel":"'.$c.'"}}',200);
            }
        }
    }
    disconnect($db);
    return new Response('{"status":"success", "film":{"id":"'.$id.'","year":"'.$year.'","name":"'.$film.'"}}',200);
});

$app->post('/films/remove/{id}', function ($id) use($app, $client){
    if(!$app['session']->get('OPENID_AUTH')) return new Response('{"status":"failure", error: "Not logged in"}', 200);
    $imdbId = $id;
    $openid = $app['session']->get('openid');

    $db = connect();
    if(!mysqli_query($db,"DELETE FROM film WHERE userId = $openid and imdbId = $imdbId")){
        disconnect($db);
        return new Response('{"status":"failure", error:"db error"}',200);
    };
    //echo mysqli_error($db);
    disconnect($db);
    
    return new Response('{"status":"success", "film" : {"imdbId" : "' . $imdbId .'"}}',200);
});

$app->post('/listfilms', function() use($app, $client){
    if(!$app['session']->get('OPENID_AUTH')) return new Response('{"status":"failure", error: "Not logged in"}', 200);

    $db = connect();
    $openid = $app['session']->get('openid');
    $arr = array();
    
    if ($result = mysqli_query($db,"select `film`, `when`, `channel`, `year`, `imdbId` from `film` WHERE `userId`=$openid")) {
        
        /* fetch object array */
        while ($row = $result->fetch_row()) {
            $arr[] = '{"id":"'.$row[4].'","cell":["'.$row[0].'","'.$row[3].'","'.$row[2].'","'.$row[1].'"]}';
        }
    
        /* free result set */
        mysqli_free_result($result);
    }

    disconnect($db);
    return new Response('{"status":"success", "openid" : "'.$openid.'", "data":['. implode(',',$arr) .']}',200);
});

//todo
$app->get('/films/list/{film}', function ($film) use($app, $client){
    
    require_once("../cron/simple_html_dom.php");
    require_once("../imdbphp2-2.3.2/imdb.class.php");       // include the class file
    require_once("../imdbphp2-2.3.2/imdbsearch.class.php"); // for Moviepilot: pilotsearch.class.php
    
    $f     = file_get_html('http://www.viewfilm.net/date/20140830');
    $name=$film;
    $year=2009;
    $i=0;
    foreach ($f->find('li.film h3') as $row) {
        if($i==12)break;
        $i++;
        $name = $row->children(0)->innertext;
        $year = $row->children(1)->innertext;

        if(strlen($year)==6){
            $year = intval( substr($year,1,4));
        } else {
            $year=0;
        }
        if($year>0){
    $search = new imdbsearch();
    $arrr = array();
    $arrr[] = imdbsearch::MOVIE;
    $results=$search->search($name, $arrr, 3);
    
    
    foreach ($results as $res) {
        $mid  = $res->imdbid();
        $name = $res->title();
        
        if($res->year()==$year){
        // now do something with these data
            echo "$mid: $name ($year)<br>\n";
            break;
        }
    }
        }
    }
    

    return new Response('',200);
});



$app->run();

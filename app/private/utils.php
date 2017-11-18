<?php

use Symfony\Component\DomCrawler\Crawler;

require_once __DIR__."/../vendor/autoload.php";
include __DIR__.'/config.php';

function connect() {
    $con = mysqli_connect(CONST_DB_HOST,CONST_DB_USERNAME,CONST_DB_PASSWORD,CONST_DB_NAME);
    
    if (mysqli_connect_errno()) {
        error_log("Failed to connect to MySQL: " . mysqli_connect_error());
        die("Didn't connect to db");
    }

    return $con;
}

function disconnect($con) {
    mysqli_close($con);
}

function mailOnErrorThenDie($emailText) {
    error_log($emailText);
    mail('rw251@yahoo.co.uk', 'Cron Job Failed', $emailText);
    if(isset($con)){
        disconnect($con);
    }
    die();
}

// TEST ADDED TO SETUP
function getFilmQueries($films){
    $con = connect();
    $queries = array();
    foreach($films as $film){
        $name = mysqli_real_escape_string($con, $film['name']);
        $year = $film['year'];
        $channel = mysqli_real_escape_string($con, $film['channel']);
        $ddd = $film['when'];

        if(!isset($film['imdb'])) {
            $search = new \Imdb\TitleSearch();
            $results=$search->search($film['name'], array(\Imdb\TitleSearch::MOVIE), 5);
            
            foreach ($results as $res) {
                if($res->year() >=$year-1 && $res->year() <=$year+1) {
                    $queries[] = "INSERT INTO `film` (`userId`, `film`, `when`, `channel`, `year`, `imdbId`) VALUES (-1, '$name', '$ddd', '$channel',$year,'".$results[0]->imdbid() . "')";
                    $queries[] = "UPDATE `film` set `when`='$ddd', `channel`='$channel' where imdbId='".$results[0]->imdbid() . "'";
                    break;
                }
            }
        } else {
            $queries[] = "INSERT INTO `film` (`userId`, `film`, `when`, `channel`, `year`, `imdbId`) VALUES (-1, '$name', '$ddd', '$channel',$year,'" . $film['imdb'] . "')";
            $queries[] = "UPDATE `film` set `when`='$ddd', `channel`='$channel' where imdbId='" . $film['imdb'] . "'";
        }
    }
    disconnect($con);
    return $queries;
}

// TEST ADDED TO SETUP
function getDateOfThreeDaysHence() {
    //get date 3 days hence
    date_default_timezone_set('Europe/London'); 
    $dt_plus_3 = strtotime("+3 day");
    return date('Ymd', $dt_plus_3);
}

function getFilmsFromNextFilm($dt = false) {
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_URL => "https://nextfilm.co.uk/?id=2",
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0'
    ));

   
    $result = curl_exec($curl); // send request / get response
    $crawler = new Crawler($result); // this is the response body from the requested page (usually html)
    
    $name="";
    $year=2009;
    $dt3 = strtotime("+3 day");
    $lastHour=-1;
    $films = array();

        //foreach film..
    foreach($crawler->filter('.listentry') as $node) {
        try{
            $node = new Crawler($node);
            $name = $node->filter('.title a')->text();
            $year = $node->filter('i')->text();
            $channel = $node->filter('.chanbox img')->attr('alt');
            $time = explode(':',explode(' ',$node->filter('.time strong')->text())[0]);
            $imdbId = explode('/',$node->filter('.imdb a')->eq(1)->attr('href'))[4];
            $hour = intval($time[0]);
            $min = intval($time[1]);
            if($hour<$lastHour) break; // assuming the films appear in date order so this shouldn't happen
            $lastHour=$hour;
        
            if(strlen($year)==6){
                $year = intval(substr($year,1,4)); // for if the year is '(2007)'
            } else {
                $year=0;
            }
        
            $dd= date_create();
            date_timestamp_set($dd, $dt3); // these are all films on in 3 days time
            date_time_set($dd, $hour, $min);
            $ddd=date_format($dd, 'Y-m-d H:i:s');
            
            if($year>0){
                $item = array();
                $item['name'] = $name;
                $item['year'] = $year;
                $item['channel'] = $channel;
                $item['when'] = $ddd;
                if($imdbId) {
                    $imdbId = substr($imdbId, 2);
                } else {
                    echo $name;
                }
                $item['imdb'] = $imdbId;
                $films[] = $item;
            }
        } catch (Exception $e) {
            // poorly formatted text
        }
    };    
    
    return $films;
}

function getFilmsFromViewFilm($dt = false) {
    if(!$dt) { $dt = getDateOfThreeDaysHence(); }
    //get films and years and channel and when
    
    //THIS WASN'T WORKING - TURNED OUT ON THE HOSTINGER SERVER IT WAS ATTEMPTING TO DO IT ON IP6
    //WHICH DIDN'T WORK BUT JUST USING IP4 ON C9 WAS WORKING
     
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_URL => "http://www.viewfilm.net/date/$dt",
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4
    ));

   
    $result = curl_exec($curl); // send request / get response
    $crawler = new Crawler($result); // this is the response body from the requested page (usually html)
    
    $name="";
    $year=2009;
    $dt3 = strtotime("+3 day");
    $lastHour=-1;
    $films = array();

        //foreach film..
    foreach($crawler->filter('li.film') as $node) {
        try{
            $node = new Crawler($node);
            $name = $node->filter('h3 > a')->text();
            $year = $node->filter('h3 > span')->text();
            $channel = $node->filter('.time strong')->text();
            $time = explode(':',$node->filter('.time .start')->text());
            $hour = intval($time[0]);
            $min = intval($time[1]);
            if($hour<$lastHour) break; // assuming the films appear in date order so this shouldn't happen
            $lastHour=$hour;
        
            if(strlen($year)==6){
                $year = intval(substr($year,1,4)); // for if the year is '(2007)'
            } else {
                $year=0;
            }
        
            $dd= date_create();
            date_timestamp_set($dd, $dt3); // these are all films on in 3 days time
            date_time_set($dd, $hour, $min);
            $ddd=date_format($dd, 'Y-m-d H:i:s');
            
            if($year>0){
                $item = array();
                $item['name'] = $name;
                $item['year'] = $year;
                $item['channel'] = $channel;
                $item['when'] = $ddd;
                $films[] = $item;
            }
        } catch (Exception $e) {
            // poorly formatted text
        }
    };    
    
    return $films;
}

// TEST ADDED TO SETUP
function getFilmsFromWeb($dt = false){
    return getFilmsFromNextFilm($dt);
}

// TEST ADDED TO SETUP
function addFilmsToStagingArea($films) {
    $con = connect();
    $queries = array();
    foreach($films as $film){
        $name = mysqli_real_escape_string($con, $film['name']);
        $channel = mysqli_real_escape_string($con, $film['channel']);
        $queries[] = "INSERT INTO `film_staging_area` VALUES ('".$name."',".$film['year'].",'".$channel."','".$film['when']."','".$film['imdbId']."')"; 
    }
    if(!mysqli_multi_query($con,implode(";",$queries))) {
        mailOnErrorThenDie('ERROR 1005: '.mysqli_error($con));
    }
    disconnect($con);
}

// TEST ADDED TO SETUP
function updateLastFilmFetch($dt) {
    $con = connect();
    if(!mysqli_query($con,"INSERT INTO `config` (`key`, `val`) VALUES ('last_got_films','$dt') ON DUPLICATE KEY UPDATE `val`='$dt'")){
        mailOnErrorThenDie('ERROR 1004: '.mysqli_error($con));
    }
    disconnect($con);       
}

function getFilmsUpdateDB($dt){
    $films = getFilmsFromWeb($dt);
    addFilmsToStagingArea($films);
    updateLastFilmFetch($dt);
    mail('rw251@yahoo.co.uk', 'New films found', 'New films found on '. $dt . '. Number found: ' . sizeof($films));
}

// TEST ADDED TO SETUP
function getDateOfLastFilmFetch() {
    $con = connect();
    $dt = '19000101';
    if ($res = mysqli_query($con,"SELECT `val` FROM `config` WHERE `key`='last_got_films'")) {
        if(mysqli_num_rows($res)>0){
            $dt = mysqli_fetch_array($res)['val'];
        } else {
            $dt = '20000101';
        }
    } else {
        $dt = false;
    }
    if(!$dt) {
        mailOnErrorThenDie('ERROR 1007: '.mysqli_error($con));
    }
    disconnect($con);
    return $dt;
}

// TEST ADDED TO SETUP
function getNRowsFromStagingArea($n = 15) {
    $con = connect();
    $res = mysqli_query($con,"SELECT * FROM `film_staging_area` LIMIT 15");
    $films = array();
    if(mysqli_num_rows($res)>0){
        while($row = mysqli_fetch_array($res)){
            $film = array();
            $film['name']=$row['name'];
            $film['year']=$row['year'];
            $film['channel']=$row['channel'];
            $film['when']=$row['when'];
            $films[] = $film;
        }
    }
    disconnect($con);
    return $films;
}

// TEST ADDED TO SETUP
function clearStagingArea() {
    $con = connect();
    if(!mysqli_query($con, "DELETE FROM `film_staging_area` LIMIT 15")){
        mailOnErrorThenDie('ERROR 1001: '.mysqli_error($con));
    }
    disconnect($con);
}

function clearOldUnpickedFilms() {
    $con = connect();
    $now = date("Y-m-d H:i:s");
    if(!mysqli_query($con, "DELETE FROM `film` WHERE `userId` < 0 AND `when` < '$now'")){
        mailOnErrorThenDie('ERROR 1002: '.mysqli_error($con));
    }
    disconnect($con);
}

function executeQueries($queries) {
    $con = connect();
    if (!mysqli_multi_query($con,implode(";",$queries))) {
        mailOnErrorThenDie('ERROR 1003: '.mysqli_error($con));
    } else {
        clearStagingArea();
    }
    disconnect($con);
}

function mailUserFilms() {
    $con = connect();
    $res = mysqli_query($con,"SELECT `film`, `channel`, `when`, `openid` FROM `film` f inner join `users` u on u.id = f.userId where `when` > now()");
    while ($row = $res->fetch_row()) {
        mail($row[3], 'Film alert', $row[0] . ' is on ' . $row[1] . ' at ' . $row[2]);
    }
    disconnect($con);
};

function doBatch() {
    $dateInThreeDaysTime = getDateOfThreeDaysHence();
    
    if(getDateOfLastFilmFetch() == $dateInThreeDaysTime) {
        //get 15 rows and update
        $films = getNRowsFromStagingArea(15);
        if(sizeof($films)>0){
            $queries = getFilmQueries($films);
            if(sizeof($queries)==0){
                clearStagingArea();
            } else {
                clearOldUnpickedFilms();
                executeQueries($queries);
            }
        } else {
            //send email at 10am
            if(date("H")=="10") {
                mailUserFilms();
            }
        }
    } else {
        getFilmsUpdateDB($dateInThreeDaysTime);
    }
};

?>
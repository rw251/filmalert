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
die("Don't call this again. I'm warning you...");

//todo
// $app->get('/films/list/{film}', function ($film) use($app, $client){
    
//     require_once("../cron/simple_html_dom.php");
//     require_once("../imdbphp2-2.3.2/imdb.class.php");       // include the class file
//     require_once("../imdbphp2-2.3.2/imdbsearch.class.php"); // for Moviepilot: pilotsearch.class.php
    
//     $f     = file_get_html('http://www.viewfilm.net/date/20140830');
//     $name=$film;
//     $year=2009;
//     $i=0;
//     foreach ($f->find('li.film h3') as $row) {
//         if($i==12)break;
//         $i++;
//         $name = $row->children(0)->innertext;
//         $year = $row->children(1)->innertext;

//         if(strlen($year)==6){
//             $year = intval( substr($year,1,4));
//         } else {
//             $year=0;
//         }
//         if($year>0){
//     $search = new imdbsearch();
//     $arrr = array();
//     $arrr[] = imdbsearch::MOVIE;
//     $results=$search->search($name, $arrr, 3);
    
    
//     foreach ($results as $res) {
//         $mid  = $res->imdbid();
//         $name = $res->title();
        
//         if($res->year()==$year){
//         // now do something with these data
//             echo "$mid: $name ($year)<br>\n";
//             break;
//         }
//     }
//         }
//     }
    

//     return new Response('',200);
// });



// $app->run();

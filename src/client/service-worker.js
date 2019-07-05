var CACHE_NAME = 'film-alert-{{VERSION}}-{{RANDOM}}';

// StaleWhileRevalidate
var swr = [/^http.*polyfill.min.js/, /^http.*rollbar.min.js/];

// Precache simple names
var pc = ['main.css', 'main.js', 'index.html'];

// Precache bundle names
var pcb;

// Loads the webpack manifest (from webpack-manifest plugin) and 
// returns an array (via a promise) with all the compiled cache 
// busted names.
var filesToCachePromise = function(cache){
  return fetch('webpack-manifest.json')
    .then(function(response){
      return response.json();
    })
    .catch(function() {
      return {}; // probably doesn't exist so return empty object
    })
    .then(function(manifest){
      return Object.keys(manifest).reduce(function(files, manifestItem){
        if(pc.indexOf(manifestItem) > -1) {
          files.push(manifest[manifestItem]);
        }
        return files;
      }, []);
    })
    .then(function(files){
      pcb = files;
      pcb.push('/'); // add root to cache
      console.log('Adding files to cache ' + CACHE_NAME + '...');
      return cache.addAll(files);
    });
};

self.addEventListener('install', function(event) {
  console.log('Install event called for ' + CACHE_NAME);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(filesToCachePromise)
  );
});

self.addEventListener('activate', function(event) {
  console.log('Activate event called for ' + CACHE_NAME);
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (CACHE_NAME !== cacheName) {
            console.log('Removing old cache: ' + cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Parse the URL:
  var requestURL = new URL(event.request.url);

  var isSWR = swr.reduce(function(hadMatch, nextRegex){
    return hadMatch || nextRegex.test(requestURL);
  }, false);

  if(isSWR) {
    StaleWhileRevalidate(event);
    return;
  }

  // same origin
  if((new RegExp('^' + self.origin)).test(requestURL))  CacheWithNetworkFallback(event);

});

/**
 * If it's in the cache use it. But always then go to the network for a fresher
 * version and put that in the cache.
 */
var StaleWhileRevalidate = function(event) {
  var id = (Math.random()*1000000).toString().substr(0,4);
  console.log(id+'|| SWR for: ' + event.request.url);
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        console.log(id+'|| SWR in cache: ', !!response);
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          console.log(id+'|| SWR caching the network response');
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        console.log(id+'|| SWR returning response or fetchPromise');
        return response || fetchPromise;
      })
    })
  );
}

var CacheWithNetworkFallback = function(event){
  var id = (Math.random()*1000000).toString().substr(0,4);
  console.log(id+'|| CWNF for: ' + event.request.url);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      console.log(id+'|| CWNF in cache: ' + !!response);
      return response || fetch(event.request);
    })
  );
}
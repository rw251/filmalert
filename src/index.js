import './components/filmList';
import './components/filmSearchBox';
import './components/reloadBanner';
import './components/todoistAuthLink';
import './components/dropDownMenu';
import './components/loader';

import './scripts/auth';

import { publish } from './scripts/pubsub';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      publish('NEW_SW_CONTROLLING');
    });

    navigator.serviceWorker.register('/service-worker.js?097jj').then(
      (registration) => {
        // Registration was successful
        console.log(
          'ServiceWorker registration successful with scope: ',
          registration.scope
        );
      },
      (err) => {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      }
    );
  });
  // const wb = new Workbox('/service-worker.js');
  // // Add an event listener to detect when the registered
  // // service worker has installed but is waiting to activate.
  // wb.addEventListener('controlling', () => {
  //   publish('NEW_SW_CONTROLLING');
  // });
  // wb.register();
}

// Do offline stuff
if (navigator.onLine === false) {
  document.body.classList.add('offline');
}

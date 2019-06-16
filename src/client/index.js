import './styles/main.scss';
const filmalert = require('./scripts/filmalert');
const auth = require('./scripts/auth')(() => {
  filmalert.showActions();
}, () => {
  filmalert.getMyFilms();
});
const my = require('./scripts/myQuery');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Do offline stuff
if (navigator.onLine === false) {
  document.body.classList.add('offline');
}

my.ready(filmalert.init);

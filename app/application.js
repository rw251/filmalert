const filmalert = require('./scripts/filmalert');
const auth = require('./scripts/auth')(() => {
  filmalert.showActions();
}, () => {
  filmalert.getMyFilms();
});
const my = require('./scripts/myQuery');

const App = {
  init: function init() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/workit.js').then((registration) => {
          // Registration was successful
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, (err) => {
          // registration failed :(
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }

    my.ready(filmalert.init);
  },
};

module.exports = App;

const filmalert = require('./scripts/filmalert');
const auth = require('./scripts/auth')(() => {
  filmalert.getMyFilms();
});

const run = filmalert.init;

const App = {
  init: function init() {
    // in case the document is already rendered
    if (document.readyState !== 'loading') run();
    // modern browsers
    else if (document.addEventListener) document.addEventListener('DOMContentLoaded', run);
    // IE <= 8
    else {
      document.attachEvent('onreadystatechange', () => {
        if (document.readyState === 'complete') run();
      });
    }
  },
};

module.exports = App;

const $ = require('jquery');
const filmalert = require('./scripts/filmalert');
const auth = require('./scripts/auth')(() => {
  filmalert.getMyFilms();
});

const App = {
  init: function init() {
    $(document).ready(() => {
      filmalert.init();
    });
  },
};

module.exports = App;

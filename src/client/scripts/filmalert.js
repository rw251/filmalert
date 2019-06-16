const my = require('./myQuery');
const utils = require('./utils');
const filmsTmpl = require('../views/films.js');
const filmPickerTmpl = require('../views/film-picker.js');

let $films;
let $filmName;
let $actions;
let $filmPickerContainer;
let $findButton;
let $loader;
let $filmCaret;
let $whenCaret;
let films = [];

// Generic sort by key for array of objects
const sortBy = (key, desc) => {
  let sortDirection = -1;
  if (!desc) sortDirection = 1;
  return (a, b) => {
    if (a[key] < b[key]) return -1 * sortDirection;
    if (a[key] > b[key]) return 1 * sortDirection;
    return 0;
  };
};

const removeFilm = (id) => {
  films = films.filter(el => el.id !== id);
};

const redrawFilms = () => {
// make table
  const filmsHtml = filmsTmpl(films);
  $films.html(filmsHtml);

  $filmCaret = my('filmCaret');
  $whenCaret = my('whenCaret');

  my('filmHeader').on('click', () => {
    $whenCaret.removeClass('caret');
    $filmCaret.addClass('caret');
    if ($filmCaret.hasClass('caret-reversed')) $filmCaret.removeClass('caret-reversed');
    else $filmCaret.addClass('caret-reversed');
    films.sort(sortBy('name', !$filmCaret.hasClass('caret-reversed')));
    redrawFilms();
  });
  my('whenHeader').on('click', () => {
    $filmCaret.removeClass('caret');
    $whenCaret.addClass('caret');
    films.sort(sortBy('when', true));
    redrawFilms();
  });

  $actions.show();
};

const getMyFilms = () => {
  utils.get('listfilms.php', (responseText) => {
    const data = JSON.parse(responseText);
    films = [];
    for (let i = 0; i < data.length; i += 1) {
      const film = {
        id: data[i].id,
        name: data[i].cell[0],
        year: data[i].cell[1],
        channel: data[i].cell[2],
        when: data[i].cell[3],
      };
      films.push(film);
    }

    redrawFilms();
  });
};

exports.getMyFilms = getMyFilms;
exports.showActions = () => {
  $actions.show();
  $filmName.focus();
};

exports.init = () => {
  $films = my('myFilms');
  $filmName = my('filmName');
  $actions = my('actions');
  $filmPickerContainer = my('filmPicker');
  $findButton = my('btnFind');
  $loader = my('ajaxLoader');

  $filmName.on('keyup', (e) => {
    if (e.which === 13) {
      $findButton.click();
    }
  });

  $findButton.on('click', () => {
    $filmPickerContainer.html('');
    $actions.hide();
    $loader.show('block');

    my.post(`findfilm.php?name=${$filmName.val()}`, {}, (err, filmList) => {
      if (err) {
        console.log(err);
      } else {
        const filmPickerHtml = filmPickerTmpl(filmList);
        $filmPickerContainer.html(filmPickerHtml);
      }
      $actions.show();
      $loader.hide();
    });
  });

  window.addFilm = (id, name, year) => {
    $actions.hide();
    $loader.hide();

    my.post('addfilm.php', { id, name, year }, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        // update table
        films.push(data.film);
        redrawFilms();
      }
      $actions.show();
      $loader.hide();
      // hide table
      $filmPickerContainer.html('');
    });
  };

  window.removeFilm = (imdbId) => {
  // todo hide row with ajax
    // $(this).hide();
    my.post('removefilm.php', { imdbId }, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        // update table
        removeFilm(data.film.imdbId);
        const rowEl = document.getElementById('myFilms').querySelector(`#row-id-${data.film.imdbId}`);
        rowEl.parentNode.removeChild(rowEl);
        // remove ajax and row
      }
    });
  };

  window.showOptions = () => {
    my('options').show();
  };
};

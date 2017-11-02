const $ = require('jquery');

let $films;
let $filmName;
let $actions;
let $pickFilmTable;
let $findButton;
let $loader;
let $filmCaret;
let $whenCaret;
let currentFilms;
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

const row = (film, hidden) => $(`<tr ${hidden ? "style='display:none'" : ''}id='${film.id}'><td>${film.name} (${film.year})</td><td>${film.channel} ${film.when}</td><td><button class='btn btn-danger btn-xs' type='button' id='rem${film.id}'><span class='glyphicon glyphicon-trash'></span><span class='hidden-xs'> Delete</span></button></td></tr>`);

const appendRows = () => {
  for (let i = 0; i < films.length; i += 1) {
    $films.find('tbody').append(row(films[i]));
  }
};

const removeFilm = (id) => {
  films = films.filter(el => el.id !== id);
};


const redrawFilms = () => {
// make table
  $films.find('tbody').html('');
  appendRows();
  $films.show();
  $actions.show();
};

const getMyFilms = () => {
  $.ajax({
    url: 'listfilms.php',
    type: 'GET',
    dataType: 'json',
    success(data) {
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
    },
  });
};

exports.getMyFilms = getMyFilms;

exports.init = () => {
  $films = $('#myFilms');
  $filmName = $('#filmName');
  $actions = $('#actions');
  $pickFilmTable = $('#pickFilm');
  $findButton = $('#btnFind');
  $loader = $('#ajaxLoader');
  $filmCaret = $('#filmHeader').find('span');
  $whenCaret = $('#whenHeader').find('span');

  $filmName.on('keyup', (e) => {
    if (e.which === 13) {
      $findButton.click();
    }
  });

  $findButton.on('click', () => {
    $pickFilmTable.empty();
    $actions.hide();
    $loader.show();

    $.ajax({
      url: `findfilm.php?name=${$filmName.val()}`,
      type: 'POST',
      dataType: 'json',
    }).done((filmList) => {
      // persist
      currentFilms = {};

      // construct
      const body = $('<tbody></tbody>');

      for (let i = 0; i < filmList.length; i += 1) {
        body.append($(`<tr><td>${filmList[i].name}</td><td>${filmList[i].year}</td><td><button class='btn btn-default' id='add${filmList[i].id}'>Add</button></td></tr>`));
        currentFilms[String(filmList[i].id)] = filmList[i];
      }

      // add
      $pickFilmTable.append(body);
    }).fail(() => {
      $pickFilmTable.append($("<tbody><tr><td>Oops.. that didn't work. Maybe try again?</td></tr></tbody>"));
    })
    .always(() => {
      $actions.show();
      $loader.hide();
    });
  });

  $pickFilmTable.on('click', 'button', function () {
    const imdbId = this.id.substring(3);
    $actions.hide();
    $loader.show();

    $.ajax({
      url: 'addfilm.php',
      type: 'POST',
      data: {
        id: imdbId,
        name: currentFilms[imdbId].name,
        year: currentFilms[imdbId].year,
      },
      dataType: 'json',
    }).done((data) => {
      if (data.status === 'success') {
        // update table
        films.push(data.film);
        const r = row(data.film);
        // r.hide();
        $films.find('tbody').prepend(r);
      } else {
        $pickFilmTable.append($("<tbody><tr><td>Oops.. that didn't work. Maybe try again?</td></tr></tbody>"));
      }
    })
    .fail(() => {
      $pickFilmTable.append($("<tbody><tr><td>Oops.. that didn't work. Maybe try again?</td></tr></tbody>"));
    })
    .always(() => {
      $actions.show();
      $loader.hide();
      // hide table
      $pickFilmTable.empty();
    });
  });

  $films.on('click', 'button', function () {
    const imdbId = this.id.substring(3);
  // todo hide row with ajax
    $(this).hide();
    $.ajax({
      url: 'removefilm.php',
      type: 'POST',
      data: {
        imdbId,
      },
      dataType: 'json',
    }).done((data) => {
      if (data.status === 'success') {
        // update table
        removeFilm(data.film.imdbId);
        $films.find(`#${data.film.imdbId}`).remove();
        // remove ajax and row
      } else {
        $films.find(`#${data.film.imdbId}`).find('button').show();
      }
      // todo reinstate row
    })
    .fail(() => {
      $films.find(`#${imdbId}`).find('button').show();
    });
  });

  $('#filmHeader').on('click', () => {
    $whenCaret.removeClass('caret');
    $filmCaret.addClass('caret');
    $filmCaret.toggleClass('caret-reversed');
    films.sort(sortBy('name', !$filmCaret.hasClass('caret-reversed')));
    redrawFilms();
  });
  $('#whenHeader').on('click', () => {
    $filmCaret.removeClass('caret');
    $whenCaret.addClass('caret');
    films.sort(sortBy('when', true));
    redrawFilms();
  });
};

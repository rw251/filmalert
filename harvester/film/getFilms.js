const rp = require('request-promise');
const $ = require('cheerio');
const DB = require('./db');

const filmUrl = 'https://nextfilm.uk/';

const validateFilm = (film, date) => {
  if (!film.imdb || film.imdb[0] !== 't' || film.imdb[1] !== 't') return false;
  if (!film.time || film.time.indexOf('-') < 0) return false;
  film.time = `${date} ${film.time.split('-')[0].replace(/ /g, '')}:00`;
  film.imdb = film.imdb.slice(2);
  return film;
};

const getFilmFromHtml = (node, date) => {
  try {
    const film = {
      channel: $('.chanbox img', node).attr('title'),
      title: $('a.title', node).text(),
      year: $('i', node)[0].childNodes[0].data.substr(1, 4),
      time: $('span.time strong', node).text(),
      imdb: $('.imdb a.ib:contains(IMDb)', node).attr('href').split('/')[4],
    };
    return validateFilm(film, date);
  } catch (e) {
    return false;
  }
};

const filmObj = {

};

const getFilms = (id, date) => rp({
  uri: `${filmUrl}?id=${id}`,
  headers: {
    'User-Agent': 'Request-Promise',
    Host: 'nextfilm.uk',
  },
})
  .then(html => $('.listentry', html))
  .then(data => data.map((x, y) => getFilmFromHtml(y, date)))
  .then(films => Array.from(films))
  .then(films => films.filter(x => x))
  .then(films => films.forEach((film) => {
    if (!filmObj[film.imdb] || film.time > filmObj[film.imdb].time) {
      filmObj[film.imdb] = film;
    }
  }));

/**
 * Removes all films that were on in the past that
 * are on nobodies list
 * @param {String} date The date to tidy from
 * @returns {Promise} A promise that resolves when the delete is executed
 */
const tidyFilms = date => DB.query(`DELETE \`film\` FROM \`film\` LEFT OUTER JOIN user_films ON \`film\`.id = user_films.filmId WHERE \`when\` < '${date}' AND userId IS NULL`);

const insertNewFilms = (films) => {
  const sql = 'INSERT INTO `film` (`film`, `when`, `channel`, `year`, `imdbId`) VALUES ? ON DUPLICATE KEY UPDATE `film` = VALUES(`film`), `when` = VALUES(`when`), `channel` = VALUES(`channel`), `year` = VALUES(`year`) ';
  const values = films.map(x => [x.title, x.time, x.channel, x.year, x.imdb]);
  console.log(`${values.length} films inserting...`);
  return DB.query(sql, [values]);
};

const now = new Date();
const nowISO = now.toISOString();
const nowAsShortDate = now.toISOString().substr(0, 10);
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowAsShortDate = tomorrow.toISOString().substr(0, 10);
const dayAfterTomorrow = new Date();
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
const dayAfterTomorrowAsShortDate = dayAfterTomorrow.toISOString().substr(0, 10);


tidyFilms(nowISO)
  .then(() => Promise.all([
    getFilms(0, nowAsShortDate),
    getFilms(1, tomorrowAsShortDate),
    getFilms(2, dayAfterTomorrowAsShortDate),
  ]))
  .then(() => Object.keys(filmObj).map(id => filmObj[id]))
  .then(films => insertNewFilms(films))
  .catch(err => console.log(err))
  .finally(() => DB.close());


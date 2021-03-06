import { debounce } from '../scripts/utils';
import { addFilmToFirebase } from '../scripts/firebase'
import { subscribe } from '../scripts/pubsub';

const $lookup = document.getElementById('lookup');
const $results = document.getElementById('results');
let hideyTimeout;

const renderFilms = (data) => {
  $results.innerHTML = (!data || !data.Search)
    ? '<div class="none-found">No films found - try again</div>'
    : `<ul class="films">
    ${data.Search.map((film) => `
      <li class="film">
        <a class="film-btn-card" data-imdb-id="${film.imdbID}" 
          data-title="${film.Title}" data-year="${film.Year}">
          <div class="film-image" style="${film.Poster.indexOf('http')>-1
            ? `background-image:url('${film.Poster}')`
            : ``
          }"></div>
          <div class="film-info">
            <div class="film-title">${film.Title}</div>
            <div class="film-year">${film.Year}</div>
          </div>
          <svg class="film-add-icon" width="20" height="20" viewbox="0 0 140 140">
            <rect x="60" y="20" width="20" height="100" />
            <rect x="20" y="60" width="100" height="20" />
            <circle cx="70" cy="20" r="10" />
            <circle cx="70" cy="120" r="10" />
            <circle cx="20" cy="70" r="10" />
            <circle cx="120" cy="70" r="10" />
          </svg>
        </a>
      </li>
    `).join('')}
  </ul>`;
};

const findFilm = (title) => fetch(`https://www.omdbapi.com/?apikey=672fc152&s=${title}`)
    .then((resp) => resp.json())
    .then((data) => renderFilms(data));

const addFilm = (el) => {
  if(el.target.nodeName.toLowerCase() === 'a') {
    const {imdbId, title, year} = el.target.dataset;
    let ttImdbId = imdbId;
    if(imdbId[0] === 't' && ttImdbId[1] === 't') ttImdbId = imdbId.substr(2);
    addFilmToFirebase(title, year, ttImdbId)
      .then(() => {
        $results.innerHTML = `<div clas="none-found">${title} successfully added</div>`;
      })
      .catch(() => {
        $results.innerHTML = `<div clas="none-found">Something went wrong.. sorry. ${title} wasn't added</div>`;
      })
      .then(() => {
        hideyTimeout = setTimeout(() => {
          $results.innerText = '';
        }, 2000);
      })
    renderFilms({Search:[]});
    $lookup.value = '';
  }
};

const searchForFilm = (el) => {
  if(el.target.value === '') {
    $results.style.display = 'none';
    return;
  }
  $results.style.display = 'block';
  clearTimeout(hideyTimeout);
  findFilm(el.target.value); 
};

$results.addEventListener('click', addFilm);
$lookup.addEventListener('keyup', debounce(searchForFilm, 500));

const show = () => {
  // $results.style.display = 'block';
  $lookup.style.display = 'block';
  setTimeout(() => {
    $lookup.style.transform = 'none';
  })
}

const hide = () => {
  // $results.style.display = 'none';
  $lookup.style.display = 'none';
}

subscribe('USER_LOGGED_IN', show)
subscribe('USER_LOGGED_OUT', hide)
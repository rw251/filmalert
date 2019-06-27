import { debounce } from '../scripts/utils';
import { addFilmToFirebase } from '../scripts/firebase'
import { subscribe } from '../scripts/pubsub';

const $lookup = document.getElementById('lookup');
const $results = document.getElementById('results');
let hideyTimeout;

const renderFilms = (data) => {
  $results.innerHTML = (!data || !data.Search)
    ? 'No films found - try again'
    : `<ul class="films">
    ${data.Search.map((film) => `
      <li class="film">
        <img class="film__poster" src="${film.Poster}" alt="${film.Title}"/>
        <span class="film__title">${film.Title} (${film.Year})</span>
        <a 
          data-imdb-id="${film.imdbID}" 
          data-title="${film.Title}" 
          data-year="${film.Year}"
          class="film__add" 
          href="javascript:void(0)"
        >Add</a>
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
    addFilmToFirebase(title, year, imdbId)
      .then(() => {
        $results.innerText = `${title} successfully added`;
      })
      .catch(() => {
        $results.innerText = `Something went wrong.. sorry. ${title} wasn't added`;
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
  console.log(el.target.value);
  clearTimeout(hideyTimeout);
  findFilm(el.target.value);
};

$results.addEventListener('click', addFilm);
$lookup.addEventListener('keyup', debounce(searchForFilm, 500));

const show = () => {
  $results.style.display = 'block';
  $lookup.style.display = 'block';
}

const hide = () => {
  $results.style.display = 'none';
  $lookup.style.display = 'none';
}

subscribe('USER_LOGGED_IN', show)
subscribe('USER_LOGGED_OUT', hide)
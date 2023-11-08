import { getFilms, removeFilm } from '../scripts/api';
import { subscribe } from '../scripts/pubsub';

const $myFilms = document.getElementById('myFilms');

const renderFilms = (films) => {
  $myFilms.innerHTML = films
    .map(
      (film) => `
    <li style="line-height: 45px; display: grid; grid-template-columns: 1fr 80px; align-items: center;max-width: 400px;margin:0 auto;transition: transform 2s ease-out">
      <span>${film.title} (${film.year})</span>
      <button
        data-imdb="${film.imdb}" 
        data-title="${film.title}" 
        data-year="${film.year}"
        class="film__remove nice-button" 
        style="font-size: 1rem; padding: 5px;margin:0;min-width:10px;color:#000;background-color:#ff3;"
      >Remove</button>
    </li>
  `
    )
    .join('');
  $myFilms.style.transform = 'none';
};

const render = () => getFilms().then(renderFilms);
const clear = () => renderFilms([]);

$myFilms.addEventListener('click', (el) => {
  if (el.target.nodeName.toLowerCase() === 'button') {
    el.target.parentNode.classList.add('shrink');
    const { imdb } = el.target.dataset;
    removeFilm(imdb);
  }
});

subscribe('USER_LOGGED_IN', render);
subscribe('USER_LOGGED_OUT', clear);
subscribe('FILM_ADDED', render);
subscribe('FILM_REMOVED', render);

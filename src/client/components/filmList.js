import { getFilms, removeFilm, listUpcomingFilms } from '../scripts/firebase';
import { subscribe } from '../scripts/pubsub';

const $myFilms = document.getElementById('myFilms');
const $upcomingFilms = document.getElementById('upcomingFilms');

const renderFilms = (films) => {
  $myFilms.innerHTML = films.map((film) => `
    <li style="line-height: 45px; display: grid; grid-template-columns: 1fr 80px; align-items: center;">
      <span>${film.title} (${film.year})</span>
      <button
        data-imdb-id="${film.imdbId}" 
        data-title="${film.title}" 
        data-year="${film.year}"
        class="film__remove nice-button" 
        style="font-size: 1rem; padding: 5px;margin:0;min-width:10px;color:#000;background-color:#ff3;"
      >Remove</button>
    </li>
  `).join('');
};

const renderUpcomingFilms = (films) => {
  $upcomingFilms.innerHTML = films
    .sort((a,b) => new Date(a.time) - new Date(b.time))
    .map((film) => `
      <li style="line-height: 45px; align-items: center;">
        <span>${film.title} (${film.year}) : ${film.channel} on ${film.time}</span>
      </li>
    `)
    .join('');
};

const render = () => getFilms().then(renderFilms).then(listUpcomingFilms).then(renderUpcomingFilms);
const clear = () => renderFilms([]);

$myFilms.addEventListener('click', (el) => {
  if(el.target.nodeName.toLowerCase() === 'button') {
    el.target.classList.add('rotate');
    const { imdbId } = el.target.dataset;
    removeFilm(imdbId);
  }
})

subscribe('USER_LOGGED_IN', render);
subscribe('USER_LOGGED_OUT', clear);
subscribe('FILM_ADDED', render);
subscribe('FILM_REMOVED', render);
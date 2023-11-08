async function getFilms() {
  const { results } = await fetch('film?action=list').then((x) => x.json());
  return results;
}

async function removeFilm(imdb) {
  const { results } = await fetch(`film?action=remove&i=${imdb}`).then((x) =>
    x.json()
  );
  return results;
}

async function addFilm(title, year, imdb) {
  const { results } = await fetch(
    `film?action=add&t=${title}&y=${year}&i=${imdb}`
  ).then((x) => x.json());
  return results;
}

async function setTodoistState() {}

export { getFilms, removeFilm, addFilm, setTodoistState };

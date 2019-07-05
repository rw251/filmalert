module.exports = (admin, config) => (films) => {
  const batch = admin.firestore().batch();
  films.forEach((film) => {
    let newFilm = admin.firestore().collection(config.collections.films).doc(film.imdb);
    batch.set(newFilm, film);
  })
  return batch.commit();
};
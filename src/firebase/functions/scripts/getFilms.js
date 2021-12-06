/* eslint-disable no-await-in-loop */
const $ = require('cheerio');
const rp = require('request-promise');

const services = {
  nextfilm: 'nextfilm',
  tvfilms: 'tvfilms',
  tvfilmapi: 'tvfilmapi',
};

// Change this to use a different service
const service = services.tvfilmapi;

const url = {
  nextfilm: 'https://nextfilm.uk/',
  tvfilms: 'https://www.tv-films.co.uk/',
  tvfilmapi: 'https://www.tv-films.co.uk/api/shows/',
};

const request = {
  nextfilm: (id) => ({
    uri: `${url.nextfilm}?id=${id}`,
    headers: {
      'User-Agent': 'Request-Promise',
      Host: 'nextfilm.uk',
    },
  }),
  tvfilms: () => url.tvfilms,
  tvfilmapi: () => ({
    uri: url.tvfilmapi,
    json: true
  }),
};

const filmClass = {
  nextfilm: '.listentry',
  tvfilms: '.Freeview',
};

const validate = {
  nextfilm: (film, date) => {
    if (!film.imdb || film.imdb[0] !== 't' || film.imdb[1] !== 't') return false;
    if (!film.time || film.time.indexOf('-') < 0) return false;
    film.time = `${date} ${film.time.split('-')[0].replace(/ /g, '')}:00`;

    // Check it's still today
    const actualDateInMS = (new Date(date)).getTime();
    const actualTimeInMS = (new Date(film.time)).getTime();
    if (Math.abs(actualDateInMS - actualTimeInMS) > 48 * 60 * 60 * 1000) return false;

    // Check the year is a year
    if (!/^[12][0-9]{3}$/.test(film.year)) film.year = "????";

    film.imdb = film.imdb.slice(2);
    return film;
  },
  tvfilms: (film) => {
    if (!film.imdb || film.imdb[0] !== 't' || film.imdb[1] !== 't') return false;
    if (!film.time) return false;
    film.time = new Date(film.time).toISOString().replace(/[TZ]/g, ' ').substr(0, 19);

    // Check the year is a year
    if (!/^[12][0-9]{3}$/.test(film.year)) film.year = "????";

    film.imdb = film.imdb.slice(2);
    return film;
  },
  tvfilmapi: (film) => {
    if (!film.imdb || film.imdb[0] !== 't' || film.imdb[1] !== 't') return false;
    if (!film.time) return false;
    film.time = new Date(film.time).toISOString().replace(/[TZ]/g, ' ').substr(0, 19);

    // Check the year is a year
    if (!/^[12][0-9]{3}$/.test(film.year)) film.year = "????";

    film.imdb = film.imdb.slice(2);
    return film;
  }
};

const isHtml = {
  nextfilm: true,
  tvfilms: true,
  tvfilmapi: false,
}

const getFilm = {
  nextfilm: (node, date) => {
    try {
      const film = {
        channel: $('.chanbox img', node).attr('title'),
        title: $('a.title', node).text(),
        year: $('i', node)[0].childNodes[0].data.substr(1, 4),
        time: $('span.time strong', node).text(),
        imdb: $('.imdb a.ib:contains(IMDb)', node).attr('href').split('/')[4],
      };
      return validate.nextfilm(film, date);
    } catch (e) {
      return false;
    }
  },
  tvfilms: (node) => {
    try {
      const film = {
        channel: $(node).attr('channel'),
        title: $(node).attr('title'),
        year: $(node).attr('year'),
        time: $(node).attr('showtime'),
        imdb: $('.imdbRatingPlugin', node).attr('data-title'),
      };
      return validate.tvfilms(film);
    } catch (e) {
      return false;
    }
  },
};

const filmObj = {

};

const processHtml = {
  nextfilm: (html) => {
    return $(filmClass.nextfilm, html).map((x, y) => getFilm.nextfilm(y, date));
  },
  tvfilms: (html) => {
    return $(filmClass.tvfilms, html).map((x, y) => getFilm.tvfilms(y, date));
  },
};

const processJson = {
  tvfilmapi: (json) => {
    if (!json || !json.shows || json.shows.length === 0) {
      // throw error
    }
    const channels = {};
    json.channels.forEach((channel) => {
      channels[channel.id] = channel.name;
    });
    return json.shows.map((show) => {
      const film = {
        channel: show.channel_id ? channels[show.channel_id] : show.link, // now includes iplayer shows
        title: json.films[show.film_id].title,
        year: json.films[show.film_id].year,
        time: show.time,
        imdb: json.films[show.film_id].imdb,
      };
      return validate.tvfilmapi(film);
    });
  },
};

const getFilms = (id, date) => rp(request[service](id))
  .then(htmlOrJSON => {
    if (isHtml[service]) {
      return processHtml[service](htmlOrJSON);
    } else {
      return processJson[service](htmlOrJSON)
    }
  })
  .then(films => Array.from(films))
  .then(films => films.filter(x => x))
  .then(films => films.forEach((film) => {
    if (!filmObj[film.imdb] || film.time > filmObj[film.imdb].time) {
      filmObj[film.imdb] = film;
    }
  }));

const timeToRemoveFrom = () => {
  const now = new Date();
  now.setHours(now.getHours() - 4);
  return now.toISOString().split("T").reduce((date, time) => date + ' ' + time.substr(0, 5))
}

const filmModule = (admin, config) => {
  /**
   * Removes all films that were on in the past
   * @returns {Promise} A promise that resolves when the delete is executed
   */
  const tidyFilms = () => {
    const batch = admin.firestore().batch();
    return admin.firestore()
      .collection(config.collections.films)
      .where("time", "<", timeToRemoveFrom())
      .get()
      .then((snapshot) => {
        snapshot.docs.forEach(doc => {
          if (!doc.data().users || Object.keys(doc.data().users).length === 0)
            batch.delete(doc.ref);
        });
        return batch.commit();
      });
  }


  const insertNewFilms = async (films) => {

    const batchArray = [];
    batchArray.push(admin.firestore().batch());
    let operationCounter = 0;
    let batchIndex = 0;

    // let batch = admin.firestore().batch();
    films.forEach(x => {
      let newFilm = admin.firestore().collection(config.collections.films).doc(x.imdb);
      batchArray[batchIndex].set(newFilm, x, { merge: true });
      operationCounter++;

      if (operationCounter === 499) {
        batchArray.push(admin.firestore().batch());
        batchIndex++;
        operationCounter = 0;
      }
    });
    console.log(`${films.length} films inserting in ${batchArray.length} batch${batchArray.length!==1 ? 'es':''}...`);
    batchIndex = 1;
    for (const batch of batchArray) {
      console.log(`Batch ${batchIndex} starting...`);
      await batch.commit();
      console.log(`Batch ${batchIndex} complete.`);
      batchIndex++;
    }
    return;
  };

  return {

    getFilmsCron: (context) => {

      const now = new Date();
      const nowISO = now.toISOString();
      const nowAsShortDate = now.toISOString().substr(0, 10);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowAsShortDate = tomorrow.toISOString().substr(0, 10);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const dayAfterTomorrowAsShortDate = dayAfterTomorrow.toISOString().substr(0, 10);

      return tidyFilms()
        .then(() => Promise.all([
          getFilms(0, nowAsShortDate),
          getFilms(1, tomorrowAsShortDate),
          getFilms(2, dayAfterTomorrowAsShortDate),
        ]))
        .then(() => Object.keys(filmObj).map(id => filmObj[id]))
        .then(films => insertNewFilms(films))
        .catch(err => console.log(err))
        .finally(() => {
          console.log('done');
        });
    }
  };
};

module.exports = filmModule;

// const now = new Date();
// const nowISO = now.toISOString();
// const nowAsShortDate = now.toISOString().substr(0, 10);
// getFilms(0, nowAsShortDate);
// tidyFilms(nowISO)
//   .then(() => Promise.all([
//     getFilms(0, nowAsShortDate),
//     getFilms(1, tomorrowAsShortDate),
//     getFilms(2, dayAfterTomorrowAsShortDate),
//   ]))
//   .then(() => Object.keys(filmObj).map(id => filmObj[id]))
//   .then(films => insertNewFilms(films))
//   .catch(err => console.log(err))
//   .finally(() => DB.close());


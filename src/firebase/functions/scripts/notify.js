// const functions = require('firebase-functions');
// const rp = require('request-promise');
// const mg = require('mailgun-js');


// /*

// /films/{imdbId}/users/{uid}
// - each film has optional 'when', 'channel', 'name', 'year'

// /users/{uid}/films/{imdbId}
// - each user has name, email, todoist state, todoist token

// /counts/{uid}
// - just has a single property 'count'

// onCreate  /users/{uid}/films/{imdbId}
//   -> Get count property of /counts/{uid}
//   -> If less than 500? then increment the count and save
//   -> Write user id to /films/{imdbId}/users/{uid}

// onDelete  /users/{uid}/films/{imdbId}
//   -> Get count property of /counts/{uid}
//   -> Decrement the count and save
//   -> Delete doc at /films/{imdbId}/users/{uid}
// */


// const { password } = functions.config().mailgun;
// const mailgun = mg({apiKey: password, domain: 'mg.rw251.com'});

// const sendEmail = message => new Promise((resolve, reject) => {
//   mailgun.messages().send(message, (error, body) => {
//     if(error) {
//       console.log(error);
//       reject(new Error('sending mail failed'));
//     } else {
//       resolve(body);
//     }
//   })
// });

// const constructEmail = (to, films) => ({
//   from: 'Film Alert <film@mg.rw251.com>',
//   to,
//   subject: 'Upcoming films',
//   text: `Upcoming films: ${films.map(x => `${x.film} - ${x.channel} - ${x.when}`).join(', ')}`,
//   html: `<p>Upcoming films:</p><p><ul>${films.map(x => `<li>${x.film} is on ${x.channel} at ${x.when}</li>`).join('')}</ul></p>`,
// });

// const constructEmails = films => films.reduce((emailObject, nextEmail) => {
//   const { openid: email, film, channel, when } = nextEmail;
//   if (!emailObject[email]) {
//     emailObject[email] = [{ film, channel, when }];
//   } else {
//     emailObject[email].push({ film, channel, when });
//   }
//   return emailObject;
// }, {});

// const getFilmsToSend = () => 

// DB
//   .query('SELECT `film`, `channel`, `when`, `openid` FROM `film` f INNER JOIN `user_films` uf on uf.filmId = f.id INNER JOIN `users` u on u.id = uf.userId WHERE `when` > now()')
//   .then((results) => {
//     if (results && results.length > 0) {
//       const emails = constructEmails(results);
//       const emailPromises = Object.keys(emails).map((to) => {
//         const mail = constructEmail(to, emails[to]);
//         console.log(mail);
//         return sendEmail(mail);
//       });
//       console.log(`Sending ${emailPromises.length} emails about ${results.length} films`);
//       return Promise.all(emailPromises);
//     }
//     return false;
//   });

// // getFilmsToSend()
// //   .then(() => console.log('DONE!'))
// //   .catch(err => console.log(err))
// //   .finally(() => DB.close());

// const notifyModule = (admin) => {

//   const getUpcomingFilms = () => admin.firestore()
//     .collection('films')
//     .get()
//     .then((snapshot) => Array.from(snapshot.docs).reduce((filmObj, film) => {
//       if(!filmObj[film.id]) {
//         filmObj[film.id] = film.data();
//       }
//       return filmObj;
//     }, {}));
  
//   const getUserRefs = () => admin.firestore()
//     .collection('users')
//     .get()
//     .then((snapshot) => snapshot.docs);
  
//   const getFilmsForUsers = () => Promise.all([
//     getUpcomingFilms(),
//     getUserRefs(),
//   ])
//     .then(([films, users]) => {
//       const filmIds = Object.keys(films).map(x => `tt${x}`);
//       return users.forEach((user) => {
//         user.ref.collection('films').get()
//           .then((filmSnapshot) => {
            
//           })
//         console.log(filmIds);
//         console.log(user.films);
//         const filmsOnSoon = user.films.filter(x => filmIds.indexOf(x) > -1);
//       });
//     });

//   return { 
//     getFilmsToSend: async (req, res) => getFilmsForUsers()
//       .then(x => res.send({its: 'done'}))
//       .catch((err) => res.send(err))
//   };
// };

// module.exports = notifyModule;

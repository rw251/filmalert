const functions = require('firebase-functions');
const rp = require('request-promise');
const mg = require('mailgun-js');


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


const { password } = functions.config().mailgun;
const mailgun = mg({apiKey: password, domain: 'mg.rw251.com'});

const sendEmail = message => new Promise((resolve, reject) => {
  mailgun.messages().send(message, (error, body) => {
    if(error) {
      console.log(error);
      reject(new Error('sending mail failed'));
    } else {
      resolve(body);
    }
  })
});

const constructEmail = (to, films) => ({
  from: 'Film Alert <film@mg.rw251.com>',
  to,
  subject: 'Upcoming films',
  text: `Upcoming films: ${films.map(x => `${x.film} - ${x.channel} - ${x.when}`).join(', ')}`,
  html: `<p>Upcoming films:</p><p><ul>${films.map(x => `<li>${x.film} is on ${x.channel} at ${x.when}</li>`).join('')}</ul></p>`,
});

const constructEmails = films => films.reduce((emailObject, nextEmail) => {
  const { openid: email, film, channel, when } = nextEmail;
  if (!emailObject[email]) {
    emailObject[email] = [{ film, channel, when }];
  } else {
    emailObject[email].push({ film, channel, when });
  }
  return emailObject;
}, {});

const timeToSearchFrom = () => {
  const now = new Date();
  now.setHours(now.getHours() - 1);
  return now.toISOString().split("T").reduce((date, time) => date + ' ' + time.substr(0,5))
}

const notifyModule = (admin) => {

  const getUpcomingFilms = () => admin.firestore()
    .collection('films')
    .where("time", ">", timeToSearchFrom())
    .get()
    .then((snapshot) => Array.from(snapshot.docs).reduce((filmObj, film) => {
      const { users, channel, time, title} = film.data();
      if(!users || Object.keys(users).length === 0) return filmObj;
      Object.keys(users).forEach((userId) => {
        const email = ''; //TODO lookup email or put this into the user object
        if(!filmObj[email]) filmObj[email] = [ { title, channel, when}];
        else filmObj[email].push({ title, channel, when});
      });
      return filmObj;
    }, {}));  

  return { 
    getFilmsToSend: async (req, res) => getFilmsForUsers()
      .then(x => res.send({its: 'done'}))
      .catch((err) => res.send(err))
  };
};

module.exports = notifyModule;

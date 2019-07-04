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
  text: `Upcoming films: ${films.map(x => `${x.title} - ${x.channel} - ${x.time}`).join(', ')}`,
  html: `<p>Upcoming films:</p><p><ul>${films.map(x => `<li>${x.title} is on ${x.channel} at ${x.time}</li>`).join('')}</ul></p>`,
});

const timeToSearchFrom = () => {
  const now = new Date();
  now.setHours(now.getHours() - 1);
  return now.toISOString().split("T").reduce((date, time) => date + ' ' + time.substr(0,5))
}

const addTasksToTodoist = (token, films) => Promise.all(films.map((film) => rp({
  uri: 'https://todoist.com/api/v8/items/add',
  method: 'POST',
  body: {
    token,
    content: 'Record or delete ' + film.title+'. It\'s on ' + film.channel + ' at ' + film.time,
    priority: 4,
    date_string: 'today',
  },
  json: true,
})));

const notifyModule = (admin) => {

  const getUpcomingFilms = () => admin.firestore()
    .collection('films')
    .where("time", ">", timeToSearchFrom())
    .get()
    .then((snapshot) => snapshot.docs.reduce((filmObj, film) => {
      const { users, channel, time, title} = film.data();
      if(!users || Object.keys(users).length === 0) return filmObj;
      Object.keys(users).forEach((userId) => {
        if(!filmObj[userId]) filmObj[userId] = [ { title, channel, time}];
        else filmObj[userId].push({ title, channel, time});
      });
      return filmObj;
    }, {}));

  const getEmail = (userId) => admin.firestore()
    .collection('users')
    .doc(userId)
    .get()
    .then((user) => user.data());

  return { 
    getFilmsToSend: (context) => getUpcomingFilms()
      .then(films => {
        const emailPromises = Object.keys(films).map((userId) => getEmail(userId)
          .then(({email, todoistToken}) => Promise.all([
            constructEmail(email, films[userId]),
            addTasksToTodoist(todoistToken, films[userId]),
          ]))
          .then(([email]) => sendEmail(email)));
        console.log(`Sending ${emailPromises.length} emails`);
        return Promise.all(emailPromises);
      })
      .catch((err) => {
        console.log('Something went wrong', err);
      })
      .finally(() => {
        console.log('done');
      })
  };
};

module.exports = notifyModule;

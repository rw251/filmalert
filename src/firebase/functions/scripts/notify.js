const sendEmail = require('../utilities/send-email')();
const addTasksToTodoist = require('../utilities/add-tasks-to-todoist');
const dateFormatter = require('../utilities/date-formatter');

const constructEmail = (to, subject, text, html) => ({
  from: 'Film Alert <film@mg.rw251.com>',
  to,
  subject,
  text,
  html,
});

const constructFilmEmail = (to, films) => constructEmail(
  to,
  'Upcoming films',
  `${films.map(x => `${x.title} - ${x.channel} - ${x.time}`).join(', ')}`,
  `<p><ul>${films.map(x => `<li>${x.title} is on ${x.channel} at ${x.time}</li>`).join('')}</ul></p>`,
);

const sendProblemEmail = async () => {
  const email = constructEmail(
    '1234richardwilliams@gmail.com',
    'Film alert issue',
    'There dont seem to be any films upcoming in firebase. This means the site is broke.',
    '<p>There dont seem to be any films upcoming in firebase. This means the site is broke.</p>'
  );
  return sendEmail(email);
}

const timeToSearchFrom = () => {
  const now = new Date();
  now.setHours(now.getHours() - 1);
  return dateFormatter(now);
}

const notifyModule = (admin, config) => {

  const getAvailableChannels = () => admin.firestore()
    .collection(config.collections.channels)
    .get()
    .then(snapshot => snapshot.docs.map(x => {
      const { name } = x.data();
      return name;
    }));

  const getUpcomingFilms = (channels) => admin.firestore()
    .collection(config.collections.films)
    .where("time", ">", timeToSearchFrom())
    .get()
    .then((snapshot) => snapshot.docs.reduce((filmObj, film) => {
      const { users, channel, time, title} = film.data();
      if(!users || Object.keys(users).length === 0) return filmObj;
      if(channel.toLowerCase().match(/bbc/) || channels.filter(x => x.toLowerCase().replace(/ /g,"")===channel.toLowerCase().replace(/ /g,"")).length > 0) {
        Object.keys(users).forEach((userId) => {
          if(!filmObj[userId]) filmObj[userId] = [ { title, channel, time}];
          else filmObj[userId].push({ title, channel, time});
        });
      }
      return filmObj;
    }, {numFiles: snapshot.docs.length}));

  const getEmail = (userId) => admin.firestore()
    .collection(config.collections.users)
    .doc(userId)
    .get()
    .then((user) => user.data());

  return { 
    getFilmsToSend: () => getAvailableChannels()
      .then(getUpcomingFilms)
      .then(films => {
        console.log(films);
        if(films.numFiles === 0) {
          return sendProblemEmail();
        }
        delete films.numFiles;
        const emailPromises = Object.keys(films).map((userId) => getEmail(userId)
          .then(({email, todoistToken}) => Promise.all([
            constructFilmEmail(email, films[userId]),
            todoistToken 
              ? addTasksToTodoist({token: todoistToken, films: films[userId]})
              : Promise.resolve(),
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

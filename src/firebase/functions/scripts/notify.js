const sendEmail = require('../utilities/send-email')();
const addTasksToTodoist = require('../utilities/add-tasks-to-todoist');
const dateFormatter = require('../../../shared/date-formatter');

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
  return dateFormatter(now);
}

const notifyModule = (admin, config) => {

  const getUpcomingFilms = () => admin.firestore()
    .collection(config.collections.films)
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
    .collection(config.collections.users)
    .doc(userId)
    .get()
    .then((user) => user.data());

  return { 
    getFilmsToSend: () => getUpcomingFilms()
      .then(films => {
        console.log(films);
        const emailPromises = Object.keys(films).map((userId) => getEmail(userId)
          .then(({email, todoistToken}) => Promise.all([
            constructEmail(email, films[userId]),
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

const mg = require('mailgun-js');
const DB = require('./db');

const { mailPassword } = process.env;
const mailgun = mg({apiKey: mailPassword, domain: 'mg.rw251.com'});

const sendEmail = message => new Promise((resolve, reject) => {
  mailgun.messages().send(message, (error, body) => {
    if(error) {
      console.log(error);
      reject('sending mail failed');
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

const getFilmsToSend = () => DB
  .query('SELECT `film`, `channel`, `when`, `openid` FROM `film` f INNER JOIN `user_films` uf on uf.filmId = f.id INNER JOIN `users` u on u.id = uf.userId WHERE `when` > now()')
  .then((results) => {
    if (results && results.length > 0) {
      const emails = constructEmails(results);
      const emailPromises = Object.keys(emails).map((to) => {
        const mail = constructEmail(to, emails[to]);
        console.log(mail);
        return sendEmail(mail);
      });
      console.log(`Sending ${emailPromises.length} emails about ${results.length} films`);
      return Promise.all(emailPromises);
    }
    return false;
  });

getFilmsToSend()
  .then(() => console.log('DONE!'))
  .catch(err => console.log(err))
  .finally(() => DB.close());

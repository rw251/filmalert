const functions = require('firebase-functions');
const mg = require('mailgun-js');

const getDefaultMailgun = () => mg({apiKey: functions.config().mailgun.password, domain: 'mg.rw251.com'});

module.exports = (mailgun = getDefaultMailgun()) => message => new Promise((resolve, reject) => {
  mailgun.messages().send(message, (error, body) => {
    if(error) {
      console.log(error);
      reject(new Error('sending mail failed'));
    } else {
      resolve(body);
    }
  })
});
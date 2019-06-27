const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const todoist = require('./scripts/todoist')(admin);
const films = require('./scripts/getFilms')(admin);

// Takes an auth code, posts to todoist, and receives an access token
exports.todoistOauth = functions.https.onRequest(todoist.oauth);
exports.getFilmsCron = functions.pubsub.schedule('30 */4 * * *').onRun(films.getFilmsCron);
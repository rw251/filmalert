const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = require('./config');

admin.initializeApp();

const todoist = require('./scripts/todoist')(admin);
const films = require('./scripts/getFilms')(admin, config);
const notify = require('./scripts/notify')(admin, config);
const channels = require('./scripts/getFreeviewChannels')(admin, config);

// Takes an auth code, posts to todoist, and receives an access token
exports.todoistOauth = functions.https.onRequest(todoist.oauth);
exports.getFilmsCron = functions.pubsub.schedule('30 */4 * * *').onRun(films.getFilmsCron);
exports.getChannelsCron = functions.pubsub.schedule('45 11 */2 * *').onRun(channels.getChannelsCron);
exports.notificationCron = functions.pubsub.schedule('0 1 * * *').onRun(notify.getFilmsToSend);

const incUserCount = (userId) => admin.firestore()
  .collection('counts')
  .doc(userId)
  .set({ filmCount: admin.firestore.FieldValue.increment(1) }, {merge: true});

const decUserCount = (userId) => admin.firestore()
  .collection('counts')
  .doc(userId)
  .set({ filmCount: admin.firestore.FieldValue.increment(-1) }, {merge: true});

const addToFilms = (imdbId, userId) => {
  var toInsert = { users: {} };
  toInsert.users[userId] = true;
  return admin.firestore()
    .collection('films')
    .doc(imdbId)
    .set(toInsert, {merge: true});
};

const removeFromFilms = (imdbId, userId) => {
  var toDelete = {};
  toDelete[`users.${userId}`] = admin.firestore.FieldValue.delete();
  return admin.firestore()
    .collection('films')
    .doc(imdbId)
    .update(toDelete);
};

exports.addFilm = functions.firestore
  .document('users/{userId}/films/{imdbId}')
  .onCreate((snap, context) => {
    const { userId, imdbId } = context.params;
    return incUserCount(userId).then(() => addToFilms(imdbId, userId));
  });
exports.removeFilm = functions.firestore
  .document('users/{userId}/films/{imdbId}')
  .onDelete((snap, context) => {
    const { userId, imdbId } = context.params;
    return decUserCount(userId).then(() => removeFromFilms(imdbId, userId));
  });
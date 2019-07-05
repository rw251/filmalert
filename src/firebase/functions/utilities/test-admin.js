const admin = require("firebase-admin");
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://annular-strata-742.firebaseio.com"
});

module.exports = admin;
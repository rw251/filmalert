const functions = require('firebase-functions');
const https = require('https');
const querystring = require('querystring');
const admin = require('firebase-admin');

admin.initializeApp();

const post = (body) => new Promise((resolve, reject) => {
  const postData = querystring.stringify(body);
  const options = {
    hostname: 'todoist.com',
    port: 443,
    path: '/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };

  const req = https.request(options, (res) => {
    // reject on bad status
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return reject(new Error('Todoist oauth request, statusCode=' + res.statusCode));
    }
  
    // cumulate data
    var body = [];
    res.on('data', (chunk) => {
      body.push(chunk);
    });

    // resolve on end
    res.on('end', () => {
      try {
        body = JSON.parse(Buffer.concat(body).toString());

        if(body.access_token) {
          body = body.access_token;
        } else {
          reject(new Error('no access token found'));
        }
        // get bearer token and save to users firebase
      } catch(e) {
        reject(e);
      }
      resolve(body);
    });
  });
  
  req.on('error', (e) => {
    console.error(e);
    reject();
  });
  
  req.write(postData);
  req.end();
});

// Takes an auth code, posts to todoist, and receives an access token
exports.todoistOauth = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const { code, state, userId } = req.query;
  const { clientid, clientsecret } = functions.config().todoist;
  
  res.set('Access-Control-Allow-Origin', '*');

  // Make request
  post({
    client_id: clientid,
    client_secret: clientsecret,
    code
  })
    .then((token) => admin.firestore()
      .collection('users')
      .doc(userId)
      .set({ todoistToken: token }, { merge: true })
    )
    .then(() => res.send({its: 'done'}))
    .catch((err) => res.send(err));
});
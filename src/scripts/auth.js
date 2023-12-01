import { publish } from './pubsub';
import { uuidv4 } from './utils';

const $profile = document.getElementById('profile');
const $userpic = document.getElementById('userpic');

// Client ID and API key from the Developer Console
var CLIENT_ID = document
  .querySelector('meta[name=google-signin-client_id]')
  .getAttribute('content');

// Array of API discovery doc URLs for APIs used by the quickstart
// var DISCOVERY_DOCS = [
//   'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
// ];

// const $signOutButton = document.querySelector('#signout');

// const signOut = (e) => {
//   e.preventDefault();
//   firebase.auth().signOut();
// };

// $signOutButton.addEventListener('click', signOut);

// const setTodoistState = () => {
//   const uuid = uuidv4();
//   localStorage.setItem('tState', uuid);
//   return db
//     .collection('users')
//     .doc(firebase.auth().currentUser.uid)
//     .set({ todoistState: uuid }, { merge: true })
//     .then(() => uuid);
// };

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'openid email profile';

var access_token;
var todoist_state;
var todoist_token;

function initOauthFlow() {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?scope=${SCOPES}&prompt=consent&access_type=offline&include_granted_scopes=true&response_type=code&state=state_parameter_passthrough_value&redirect_uri=${window.origin}/key&client_id=${CLIENT_ID}`;
  window.location.href = url;
}

function getAccessToken() {
  fetch('/token')
    .then((x) => x.json())
    .then((x) => {
      if (!x.access_token) {
        initOauthFlow();
      } else {
        access_token = x.access_token;
        todoist_state = x.todoistState;
        todoist_token = x.isTodoistToken;
        if (gapi) {
          console.log('gapi loaded first, token now loaded');
          gapi.load('client', initClient);
        }
      }
    });
}

getAccessToken();

window.handleGapiLoaded = () => {
  if (access_token) {
    console.log('token loaded first, gapi now ready');
    gapi.load('client', initClient);
  }
};

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
async function initClient() {
  await gapi.client.init({});

  gapi.client.setToken({ access_token });

  $profile.style.display = 'block';

  // publish('LINK_UNLINK', user.providerData);

  // $userpic.style.backgroundImage = `url(${user.photoURL})`;
  // setTimeout(() => {
  //   $userpic.style.transform = 'none';
  // }, 0);

  publish('USER_LOGGED_IN');
}

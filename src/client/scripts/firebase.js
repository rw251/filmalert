import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { publish } from './pubsub';
import { uuidv4 } from './utils';

const $signIn = document.getElementById('signin');
const $profile = document.getElementById('profile');
const $userpic = document.getElementById('userpic');
const $signInButton = document.querySelector('#signin a');
const $signOutButton = document.querySelector('#signout');

firebase.initializeApp({
  apiKey: "AIzaSyBoM5zfz2qhDbCPps4gIu9q2hPrtQefJk0",
  authDomain: "annular-strata-742.firebaseapp.com",
  databaseURL: "https://annular-strata-742.firebaseio.com",
  projectId: "annular-strata-742",
  storageBucket: "",
  messagingSenderId: "750259488516",
  appId: "1:750259488516:web:7d689741fba962be" 
});

const signIn = (e) => {
  e.preventDefault();
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch((error) => console.log(error));
}

const signOut = (e) => {
  e.preventDefault();
  firebase.auth().signOut();
};

$signInButton.addEventListener('click', signIn);
$signOutButton.addEventListener('click', signOut);

const db = firebase.firestore();

const getFilms = () => db
  .collection('users')
  .doc(firebase.auth().currentUser.uid)
  .collection('films')
  .get()
  .then((querySnapshot) => {
    const xx = Array.from(querySnapshot.docs);
    const y = xx.map((x) => {
      return {imdbId: x.id, ...x.data()};
    });
    return y;
  });

const setTodoistState = () => {
  const uuid = uuidv4();
  localStorage.setItem('tState', uuid);
  return db
    .collection('users')
    .doc(firebase.auth().currentUser.uid)
    .set({ todoistState: uuid }, { merge: true })
    .then(() => uuid);
};

const upsertUser = (name, email) => db
  .collection('users')
  .doc(firebase.auth().currentUser.uid)
  .get()
  .then((user) => user.exists
    ? Promise.resolve({ state: user.get('todoistState'), isToken: !!user.get('todoistToken') })
    : db.collection('users').doc(firebase.auth().currentUser.uid).set({ name, email })
  );

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    $signIn.style.display = 'none';
    $profile.style.display = 'block';

    $userpic.style.backgroundImage = `url(${user.photoURL})`;
    upsertUser(user.displayName || 'unknown', user.email)
      .then(({ state, isToken }) => {
        publish('USER_LOGGED_IN');
        
        // redirect from todoist auth
        if(window.location.pathname.indexOf('oauth')>-1){
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const paramState = urlParams.get('state');
          window.history.replaceState({}, document.title, "/");
          if(code && paramState) {
            if(paramState !== state) {
              console.log('something fishy')
            } else {
              return fetch(`https://us-central1-annular-strata-742.cloudfunctions.net/todoistOauth?code=${code}&state=${state}&userId=${firebase.auth().currentUser.uid}`)
                .then((resp) => resp.json())
                .then((data) => console.log(data))
                .catch((err) => console.log(err));
            }
          }
        }
        return publish(isToken ? 'TODOIST_LINK_FOUND' : 'TODOIST_LINK_NOT_FOUND');
      });
  } else {
    $signIn.style.display = 'block';
    $profile.style.display = 'none';
    publish('USER_LOGGED_OUT');
  }
});

const addFilmToFirebase = (title, year, imdbId) => db
  .collection("users")
  .doc(firebase.auth().currentUser.uid)
  .collection('films')
  .doc(imdbId)
  .set({ title, year })
  .then(() => {
    publish('FILM_ADDED');
    console.log('film added');
  });

const removeFilm = (imdbId) => db
  .collection("users")
  .doc(firebase.auth().currentUser.uid)
  .collection('films')
  .doc(imdbId)
  .delete()
  .then(() => {
    publish('FILM_REMOVED');
    console.log(imdbId, 'film removed');
  });

const listUpcomingFilms = () => db
  .collection('films')
  .where('year','>','0')
  .get()
  .then((snapshot) => {
    const xx = Array.from(snapshot.docs);
    const y = xx.map((x) => {
      return {imdbId: x.id, ...x.data()};
    });
    return y;
  })

export { getFilms, addFilmToFirebase, removeFilm, setTodoistState, listUpcomingFilms };
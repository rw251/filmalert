import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { publish } from './pubsub';
import { uuidv4 } from './utils';

const $signIn = document.getElementById('signin');
const $profile = document.getElementById('profile');
const $userpic = document.getElementById('userpic');
const $signInWithGoogleButton = document.querySelector('#signInGoogle');
const $signInWithMicrosoftButton = document.querySelector('#signInMicrosoft');
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


const signInWith = (provider) => () => firebase.auth().signInWithPopup(provider)
  .catch((error) => console.log(error));

const signInWithGoogle = signInWith(new firebase.auth.GoogleAuthProvider());
const signInWithMicrosoft = signInWith(new firebase.auth.OAuthProvider('microsoft.com'));

const signOut = (e) => {
  e.preventDefault();
  firebase.auth().signOut();
};

$signInWithGoogleButton.addEventListener('click', signInWithGoogle);
$signInWithMicrosoftButton.addEventListener('click', signInWithMicrosoft);
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

    publish('LINK_UNLINK', user.providerData);

    $userpic.style.backgroundImage = `url(${user.photoURL})`;
    setTimeout(() => {
      $userpic.style.transform = 'none';
    }, 0);
    upsertUser(user.displayName || 'unknown', user.email)
      .then((currentUser) => {
        publish('USER_LOGGED_IN');
        
        // redirect from todoist auth
        if(window.location.pathname.indexOf('oauth')>-1){
          const { state } = currentUser;
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
        return publish(currentUser && currentUser.isToken ? 'TODOIST_LINK_FOUND' : 'TODOIST_LINK_NOT_FOUND');
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
  });


const linkGoogle = () => {
  publish('SHOW_MESSAGE', 'Linking to Google...');
  return firebase.auth().currentUser
    .linkWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(({user}) => {
      publish('LINK_UNLINK', user.providerData);
    })
    .catch(() => publish('HIDE_MESSAGE'));
}
const unlinkGoogle = () => {
  publish('SHOW_MESSAGE', 'Unlinking from Google...');
  return firebase.auth().currentUser
    .unlink('google.com')
    .then(() => {
      publish('LINK_UNLINK', firebase.auth().currentUser.providerData);
      publish('HIDE_MESSAGE');
    })
    .catch(() => publish('HIDE_MESSAGE'));
}
const linkMicrosoft = () => {
  publish('SHOW_MESSAGE', 'Linking to Microsoft...');
  return firebase.auth().currentUser
    .linkWithPopup(new firebase.auth.OAuthProvider('microsoft.com'))
    .then(({user}) => {
      publish('LINK_UNLINK', user.providerData);
      publish('HIDE_MESSAGE');
    })
    .catch(() => publish('HIDE_MESSAGE'));
}
const unlinkMicrosoft = () => {
  publish('SHOW_MESSAGE', 'Unlinking from Microsoft...');
  return firebase.auth().currentUser
    .unlink('microsoft.com')
    .then(() => {
      publish('LINK_UNLINK', firebase.auth().currentUser.providerData);
      publish('HIDE_MESSAGE');
    })
    .catch(() => publish('HIDE_MESSAGE'));
}

export { 
  getFilms, 
  addFilmToFirebase, 
  removeFilm, 
  setTodoistState, 
  listUpcomingFilms,
  linkGoogle,
  unlinkGoogle,
  linkMicrosoft,
  unlinkMicrosoft,
};
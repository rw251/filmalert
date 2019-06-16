const profileTmpl = require('../views/profile.js');
const my = require('./myQuery');

const authenticateWithBackend = (idtoken, callback) => {
  my.post('login.php', { idtoken }, () => {
    // console.log(`Signed in as: ${responseText}`);
    callback();
  });
};

const signOutBackend = () => {
  my.get('logout.php', () => {
    // console.log('Signed out');
  });
};

module.exports = (callbackOnClientSignIn, callbackOnServerSignIn) => {
  window.onSignIn = (googleUser) => {
    // Useful data for your client-side scripts:
    const profile = googleUser.getBasicProfile();
    // console.log(`ID: ${profile.getId()}`); // Don't send this directly to your server!
    // console.log(`Full Name: ${profile.getName()}`);
    // console.log(`Given Name: ${profile.getGivenName()}`);
    // console.log(`Family Name: ${profile.getFamilyName()}`);
    // console.log(`Image URL: ${profile.getImageUrl()}`);
    // console.log(`Email: ${profile.getEmail()}`);

    const profileHtml = profileTmpl(profile.getEmail(), profile.getImageUrl());
    document.getElementById('profileBar').innerHTML = profileHtml;
    document.getElementById('signinButton').style.display = 'none';

    // The ID token you need to pass to your backend:
    const idToken = googleUser.getAuthResponse().id_token;
    // console.log(`ID Token: ${idToken}`);

    callbackOnClientSignIn();
    authenticateWithBackend(idToken, callbackOnServerSignIn);
  };

  window.signOut = () => {
    signOutBackend();

    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(() => {
      document.getElementById('profileBar').innerHTML = '';
      document.getElementById('signinButton').style.display = '';
      // console.log('User signed out.');
    });
  };

  window.disconnect = () => {
    signOutBackend();

    const auth2 = gapi.auth2.getAuthInstance();
    auth2.disconnect().then(() => {
      document.getElementById('profileBar').innerHTML = '';
      document.getElementById('signinButton').style.display = '';
      // console.log('User disconnected.');
    });
  };
};

const $ = require('jquery');

const authenticateWithBackend = (idToken, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'login.php');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function () {
    console.log(`Signed in as: ${xhr.responseText}`);
    callback();
  };
  xhr.send(`idtoken=${idToken}`);
};

module.exports = (callback) => {
  window.onSignIn = (googleUser) => {
    // Useful data for your client-side scripts:
    const profile = googleUser.getBasicProfile();
    console.log(`ID: ${profile.getId()}`); // Don't send this directly to your server!
    console.log(`Full Name: ${profile.getName()}`);
    console.log(`Given Name: ${profile.getGivenName()}`);
    console.log(`Family Name: ${profile.getFamilyName()}`);
    console.log(`Image URL: ${profile.getImageUrl()}`);
    console.log(`Email: ${profile.getEmail()}`);


    $('#email').text(profile.getEmail());
    $('#profileImage').attr('src', profile.getImageUrl());
    $('#signinButton').hide();
    $('#profile').show();

    // The ID token you need to pass to your backend:
    const idToken = googleUser.getAuthResponse().id_token;
    console.log(`ID Token: ${idToken}`);

    authenticateWithBackend(idToken, callback);
  };

  return {

  /**
   * Retrieves and renders the authenticated user's Google+ profile.
   */

    renderProfile() {
      const request = gapi.client.plus.people.get({ userId: 'me' });
      request.execute((profile) => {
        $('#profile').empty();
        if (profile.error) {
            // $('#profile').append(profile.error);
          return;
        }
        const email = profile.emails.filter(v => v.type === 'account', // Filter out the primary email
          )[0].value; // get the email from the filtered results, should always be defined.

        $('#profile').append($(`<img id="disconnect" data-toggle="modal" data-target="#myModal" class="circle" src="${profile.image.url}">`));
          // profile.displayName
      });
    },

    /**
     * Calls the server endpoint to connect the app for the user. The client
     * sends the one-time authorization code to the server and the server
     * exchanges the code for its own tokens to use for offline API access.
     * For more information, see:
     *   https://developers.google.com/+/web/signin/server-side-flow
     */
      // Send the code to the server
    connectServer(state) {
      console.log(this.authResult.code);
      $.ajax({
        type: 'POST',
        url: `${window.location.href.replace(/#$/, '').replace(/\/$/, '')}/server.php/connect?state=${state}`,
        contentType: 'application/octet-stream; charset=utf-8',
        success(result) {
          console.log(result);
        },
        processData: false,
        data: this.authResult.code,
      });
    },

    signOut(event) {
      const auth2 = gapi.auth2.getAuthInstance();
      auth2.signOut().then(() => {
        console.log('User signed out.');
      });
      $.ajax({
        type: 'POST',
        url: `${window.location.href.replace(/#$/, '').replace(/\/$/, '')}/server.php/logout`,
          /* async: false, */
        success(result) {
          console.log(`revoke response: ${result}`);
          $('#myFilms').hide();
          $('#actions').hide();
          $('#signinButton').show();
          $('#profile').hide();
        },
        error(e) {
          console.log(e);
        },
      });
      event.preventDefault();
    },
  };
};

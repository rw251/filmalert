/*global gapi, getMyFilms*/

var helper = (function() {
  var authResult = undefined;

  return {
    onSignIn: function(googleUser){
      // Useful data for your client-side scripts:
        var profile = googleUser.getBasicProfile();
        console.log("ID: " + profile.getId()); // Don't send this directly to your server!
        console.log("Name: " + profile.getName());

        $('#email').text(profile.getEmail());
        $('#profileImage').attr("src", profile.getImageUrl());
        $('#signinButton').hide();
        $('#profile').show();

        // The ID token you need to pass to your backend:
        var id_token = googleUser.getAuthResponse().id_token;
        console.log("ID Token: " + id_token);
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', window.location.href.replace(/#$/,"").replace(/\/$/,"") + '/index.php/connect?state='+$('#st').html());
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
          console.log('Signed in as: ' + xhr.responseText);
          
          getMyFilms();
        };
        xhr.send('idtoken=' + id_token);
          
        // After we load the Google+ API, render the profile data from Google+.
       // gapi.client.load('plus','v1',this.renderProfile);
      //  getMyFilms();
        
    },
    /**
     * Retrieves and renders the authenticated user's Google+ profile.
     */
    renderProfile: function() {
      var request = gapi.client.plus.people.get( {'userId' : 'me'} );
      request.execute( function(profile) {
          $('#profile').empty();
          if (profile.error) {
            //$('#profile').append(profile.error);
            return;
          }
          var email = profile['emails'].filter(function(v) {
                return v.type === 'account'; // Filter out the primary email
            })[0].value; // get the email from the filtered results, should always be defined.
        
          $('#profile').append($('<img id="disconnect" data-toggle="modal" data-target="#myModal" class="circle" src=\"' + profile.image.url + '\">'));
          //profile.displayName
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
    connectServer: function(state) {
      //console.log(this.authResult.code);
      $.ajax({
        type: 'POST',
        url: window.location.href.replace(/#$/,"").replace(/\/$/,"") + '/index.php/connect?state=' +state,
        contentType: 'application/octet-stream; charset=utf-8',
        success: function(result) {
          console.log(result);
        },
        processData: false,
        data: this.authResult.code
      });
    },
    
    signOut: function(event) {
      var auth2 = gapi.auth2.getAuthInstance();
      auth2.signOut().then(function () {
        console.log('User signed out.');
      });
      $.ajax({
    			type: 'POST',
    			url: window.location.href.replace(/#$/, "").replace(/\/$/, "") + '/index.php/logout',
    			/*async: false,*/
    			success: function(result) {
    				console.log('revoke response: ' + result);
    				$('#myFilms').hide();
    				$('#actions').hide();
            $('#signinButton').show();
            $('#profile').hide();
    			},
    			error: function(e) {
    				console.log(e);
    			}
    	});
    	event.preventDefault();
    }
  };
})();

/**
 * Perform jQuery initialization and check to ensure that you updated your
 * client ID.
 */
$(document).ready(function() {
  $("div.header").on('click', '#disconnect', function() {
		gapi.auth.signOut();
		$.ajax({
			type: 'POST',
			url: window.location.href.replace(/#$/, "").replace(/\/$/, "") + '/index.php/logout',
			async: false,
			success: function(result) {
				console.log('revoke response: ' + result);
				$('#myFilms').hide();
				$('#actions').hide();
				$('#profile').empty();
				$('#signinButton').show();
			},
			error: function(e) {
				console.log(e);
			}
		});
	});
	$('#signout').on('click', helper.signOut);
});

/**
 * Calls the helper method that handles the authentication flow.
 *
 * @param {Object} authResult An Object which contains the access token and
 *   other authentication information.
 */
function onSignIn(googleUser) {
  helper.onSignIn(googleUser);
}
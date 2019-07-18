import { linkGoogle, unlinkGoogle, linkMicrosoft, unlinkMicrosoft } from '../scripts/firebase';
import { subscribe } from '../scripts/pubsub';

const $googleLink = document.getElementById('google');
const $googleUnlink = document.getElementById('googleUnlink');
const $microsoftLink = document.getElementById('microsoft');
const $microsoftUnlink = document.getElementById('microsoftUnlink');

$googleLink.addEventListener('click', (e) => {
  e.preventDefault();
  return linkGoogle();
});

$googleUnlink.addEventListener('click', (e) => {
  e.preventDefault();
  return unlinkGoogle();
});

$microsoftLink.addEventListener('click', (e) => {
  e.preventDefault();
  return linkMicrosoft();
});

$microsoftUnlink.addEventListener('click', (e) => {
  e.preventDefault();
  return unlinkMicrosoft();
});

const showGoogleUnlinkButton = () => {
  $googleUnlink.style.display = 'block';
  $googleLink.style.display = 'none';
};

const showGoogleLinkButton = () => {
  $googleLink.style.display = 'block';
  $googleUnlink.style.display = 'none';
};

const showMicrosoftUnlinkButton = () => {
  $microsoftUnlink.style.display = 'block';
  $microsoftLink.style.display = 'none';
};

const showMicrosoftLinkButton = () => {
  $microsoftLink.style.display = 'block';
  $microsoftUnlink.style.display = 'none';
};

subscribe('LINK_UNLINK', (channel, msg) => {
  if(msg && msg.length === 2) {
    showGoogleUnlinkButton();
    showMicrosoftUnlinkButton();
  } else if (msg && msg.length === 1 && msg[0].providerId === 'google.com') {
    showMicrosoftLinkButton();
  } else if (msg && msg.length === 1 && msg[0].providerId === 'microsoft.com') {
    showGoogleLinkButton();
  }
});
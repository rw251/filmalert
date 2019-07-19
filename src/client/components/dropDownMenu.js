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

const showBothUnlinkButtons = () => {
  $googleLink.style.display = 'none';
  $microsoftLink.style.display = 'none';
  $googleUnlink.style.display = 'block';
  $microsoftUnlink.style.display = 'block';
};

const showGoogleLinkButton = () => {
  $microsoftLink.style.display = 'none';
  $microsoftUnlink.style.display = 'none';
  $googleUnlink.style.display = 'none';
  $googleLink.style.display = 'block';
};

const showMicrosoftLinkButton = () => {
  $googleUnlink.style.display = 'none';
  $googleLink.style.display = 'none';
  $microsoftUnlink.style.display = 'none';
  $microsoftLink.style.display = 'block';
};

subscribe('LINK_UNLINK', (channel, msg) => {
  if(msg && msg.length === 2) {
    showBothUnlinkButtons();
  } else if (msg && msg.length === 1 && msg[0].providerId === 'google.com') {
    showMicrosoftLinkButton();
  } else if (msg && msg.length === 1 && msg[0].providerId === 'microsoft.com') {
    showGoogleLinkButton();
  }
});
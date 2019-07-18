import { linkGoogle, unlinkGoogle, linkMicrosoft, unlinkMicrosoft } from '../scripts/firebase';
import { subscribe } from '../scripts/pubsub';

const $googleLink = document.getElementById('google');
const $googleUnlink = document.getElementById('googleUnlink');
const $microsoftLink = document.getElementById('microsoft');
const $microsoftUnlink = document.getElementById('microsoftUnlink');

$link.addEventListener('click', (e) => {
  e.preventDefault();
  return setTodoistState()
    .then((uuid) => {
      window.location.href = `https://todoist.com/oauth/authorize?client_id=3349e5205b2e400eb4b93d57b15d4c9a&state=${uuid}&scope=data:read_write`;
    });
  });

$unlink.addEventListener('click', (e) => {
  e.preventDefault();
  // return setTodoistState()
  //   .then((uuid) => {
  //     window.location.href = `https://todoist.com/oauth/authorize?client_id=3349e5205b2e400eb4b93d57b15d4c9a&state=${uuid}&scope=task:add`;
  //   });
  });

const showUnlinkButton = () => {
  $unlink.style.display = 'block';
  $link.style.display = 'none';
};

const showLinkButton = () => {
  $link.style.display = 'block';
  $unlink.style.display = 'none';
};

subscribe('TODOIST_LINK_NOT_FOUND', showLinkButton);
subscribe('TODOIST_LINK_FOUND', showUnlinkButton);
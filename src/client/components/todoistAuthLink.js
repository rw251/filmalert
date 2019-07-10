import { setTodoistState } from '../scripts/firebase';
import { subscribe } from '../scripts/pubsub';

const $link = document.getElementById('todoist');
const $unlink = document.getElementById('todoistUnlink');

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
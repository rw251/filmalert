import { subscribe } from '../scripts/pubsub';

const $loader = document.getElementById('loaderMessage');

const setMessage = (msg) => {
  $loader.innerText = msg;
};

const show = (topic, msg) => {
  if(msg) setMessage(msg);
  $loader.style.display = 'grid';
};

const hide = () => {
  $loader.style.display = 'none';
};

subscribe('SHOW_MESSAGE', show);
subscribe('HIDE_MESSAGE', hide);
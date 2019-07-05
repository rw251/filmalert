const rp = require('request-promise');

module.exports = ({token, films}) => Promise.all(films.map((film) => rp({
  uri: 'https://todoist.com/api/v8/items/add',
  method: 'POST',
  body: {
    token,
    content: 'Record or delete ' + film.title+'. It\'s on ' + film.channel + ' at ' + film.time,
    priority: 4,
    date_string: 'today',
  },
  json: true,
})));
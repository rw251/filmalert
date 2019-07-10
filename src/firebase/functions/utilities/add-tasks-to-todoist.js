const rp = require('request-promise');
const uuidv4 = require('uuid/v4');

module.exports = ({token, films}) => {
  const commands = films.map(film => {
    return {
      type: "item_add",
      temp_id: uuidv4(),
      uuid: uuidv4(),
      args: {
        content: 'Record or delete ' + film.title+'. It\'s on ' + film.channel + ' at ' + film.time,
        priority: 4,
        date_string: 'today',
      }
    }
  });
  return  rp({
    uri: 'https://todoist.com/api/v8/sync',
    method: 'POST',
    body: { token, commands },
    json: true,
  });
};
exports.get = (url, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = () => {
    callback(xhr.responseText);
  };
  xhr.send();
};

exports.post = (url, data, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = () => {
    callback(xhr.responseText);
  };
  const body = Object.keys(data).map(key => `${key}=${data[key]}`).join('&');
  xhr.send(body);
};

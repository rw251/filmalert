module.exports = (date) => date
  .toISOString()
  .split("T")
  .reduce((datePart, timePart) => `${datePart} ${timePart.substr(0,5)}`);
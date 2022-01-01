/* eslint-disable no-await-in-loop */
const $ = require('cheerio');
const rp = require('request-promise');

const getChannels = () => rp({
  uri: 'https://www.freeview.co.uk/help/coverage-checker-results',
  method: 'POST',
  form: {
    "postcode": "WA12 0DE",
    "address": "6",
    "op": "Check",
  }
})
  .then(html => {
    const channelArray = $('.fv-channel-list__channel-name', html)
      .map((x, y) => $(y).text().trim()).get()
      .filter(x => x.indexOf('**') === -1)
      .map(x => {
        const name = x.replace(/\*$/,""); 
        return {name, id: name.replace(/ /g, '-').toLowerCase()};
      });
    return [...new Set(channelArray)];
  });

const channelModule = (admin, config) => {

  const insertNewChannels = async (channels) => {

    const batchArray = [];
    batchArray.push(admin.firestore().batch());
    let operationCounter = 0;
    let batchIndex = 0;

    channels.forEach(x => {
      let newChannel = admin.firestore().collection(config.collections.channels).doc(x.id);
      batchArray[batchIndex].set(newChannel, x, { merge: true });
      operationCounter++;

      if (operationCounter === 499) {
        batchArray.push(admin.firestore().batch());
        batchIndex++;
        operationCounter = 0;
      }
    });
    console.log(`${channels.length} channels inserting in ${batchArray.length} batch${batchArray.length!==1 ? 'es':''}...`);
    batchIndex = 1;
    for (const batch of batchArray) {
      console.log(`Batch ${batchIndex} starting...`);
      await batch.commit();
      console.log(`Batch ${batchIndex} complete.`);
      batchIndex++;
    }
    return;
  };

  return {

    getChannelsCron: (context) => {

      return getChannels()
        .then(channels => insertNewChannels(channels))
        .catch(err => console.log(err))
        .finally(() => {
          console.log('done');
        });
    }
  };
};

module.exports = channelModule;
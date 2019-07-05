module.exports = (admin, config) => (imdbIds) => admin.firestore()
  .collection(config.collections.films).get()
  .then((snapshot) => {
    if(snapshot.size === 0) return 0;
    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      if(!imdbIds || imdbIds.indexOf(doc.id) > -1)
        batch.delete(doc.ref);
    });
    return batch.commit();
  });
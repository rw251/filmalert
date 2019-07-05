module.exports = (admin, config) => (userIds) => admin.firestore()
  .collection(config.collections.users).get()
  .then((snapshot) => {
    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      if(!userIds || userIds.indexOf(doc.id) > -1)
        batch.delete(doc.ref);
    });
    return batch.commit();
  });
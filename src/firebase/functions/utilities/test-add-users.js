module.exports = (admin, config) => (users) => {
  const batch = admin.firestore().batch();
  users.forEach((user) => {
    let newUser = admin.firestore().collection(config.collections.users).doc(user.id);
    batch.set(newUser, user);
  })
  return batch.commit();
};
const findFileFromName = (bundle, name) => Object
  .values(bundle).find(desc => (desc.name || '') === name);

const findHashFromName = (bundle, name) => findFileFromName(bundle, name).fileName;

export {
  findFileFromName,
  findHashFromName,
};

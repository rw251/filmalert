module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ['airbnb-base', 'prettier'],
  rules: {
    'no-param-reassign': [
      2,
      {
        props: false,
      },
    ],
  },
};

module.exports = {
  // See http://brunch.io for documentation.
  paths: {
    public: 'dist/public_html',
  },
  files: {
    javascripts: {
      joinTo: {
        'libraries.js': /^(?!app\/)/,
        'app.js': /^app\//,
      },
    },
    stylesheets: {
      joinTo: 'app.css',
    },
    templates: {
      joinTo: 'app.js',
    },
  },

  server: { command: 'php -S 0.0.0.0:8181 -t dist/public_html -c php.ini' },

  plugins: {
    autoReload: {
      port: [8081, 8082],
    },
  },
};

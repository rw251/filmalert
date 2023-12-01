// Custom rollup plugin for creating html pages
import { readFileSync } from 'fs';
import mustache from 'mustache';
import { findHashFromName } from './bundle-utils.mjs';

// Use import.meta.url to make the path relative to the current source
// file instead of process.cwd(). For more information:
// https://nodejs.org/docs/latest-v16.x/api/esm.html#importmetaurl
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url))
);

// oddly this needs to be relative to root
// const { rollbarClientToken } = require('./src/server/config.js');

function generateShell(
  bundle,
  { templatePath, isDev, rollbarClientToken, clientId }
) {
  const template = readFileSync(templatePath, 'utf8');
  return mustache.render(template, {
    isProduction: !isDev,
    isDev,
    rollbarClientToken,
    scriptFile: findHashFromName(bundle, 'main'),
    title: 'Film Alert',
    version,
    clientId,
  });
}

export default function createHTMLPlugin({
  isDev,
  rollbarClientToken,
  clientId,
}) {
  const templatePath = 'src/index.mustache';
  return {
    name: 'create-html-plugin',
    buildStart() {
      this.addWatchFile(templatePath);
    },
    async generateBundle(options, bundle) {
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: await generateShell(bundle, {
          templatePath,
          isDev,
          rollbarClientToken,
          clientId,
        }),
      });
    },
  };
}

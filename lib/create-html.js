// Custom rollup plugin for creating html pages
import { readFileSync } from 'fs';
import mustache from 'mustache';
import { findHashFromName } from './bundle-utils';
import { version } from '../package.json';

// oddly this needs to be relative to root
// const { rollbarClientToken } = require('./src/server/config.js');

function generateShell(bundle, { templatePath, isDev, rollbarClientToken }) {
  const template = readFileSync(templatePath, 'utf8');
  return mustache.render(template, {
    isProduction: !isDev,
    isDev,
    rollbarClientToken,
    scriptFile: findHashFromName(bundle, 'main'),
    title: 'Film Alert',
    version,
  });
}

export default function createHTMLPlugin({ isDev, rollbarClientToken }) {
  const templatePath = 'src/client/index.mustache';
  return {
    name: 'create-html-plugin',
    buildStart() {
      this.addWatchFile(templatePath);
    },
    async generateBundle(options, bundle) {
      bundle['index.html'] = {
        fileName: 'index.html',
        isAsset: true,
        source: await generateShell(bundle, { templatePath, isDev, rollbarClientToken }),
      };
    },
  };
}

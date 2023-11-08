// Custom rollup plugin for creating the service worker
import { readFileSync } from 'fs';
import mustache from 'mustache';

// Use import.meta.url to make the path relative to the current source
// file instead of process.cwd(). For more information:
// https://nodejs.org/docs/latest-v16.x/api/esm.html#importmetaurl
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url))
);

function generateShell(bundle, { templatePath, resourceList }) {
  const template = readFileSync(templatePath, 'utf8');
  return mustache.render(template, {
    resourceList,
    randomNumber: Math.random(),
    version,
  });
}

export default function createServiceWorkerPlugin() {
  const templatePath = 'src/service-worker.mustache.js';
  return {
    name: 'create-service-worker-plugin',
    buildStart() {
      this.addWatchFile(templatePath);
    },
    async generateBundle(options, bundle) {
      const resourceList = JSON.stringify(Object.keys(bundle));
      this.emitFile({
        type: 'asset',
        fileName: 'service-worker.js',
        source: await generateShell(bundle, { templatePath, resourceList }),
      });
    },
  };
}

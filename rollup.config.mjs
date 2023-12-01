import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import rimraf from 'rimraf';
import { join } from 'path';
import terser from '@rollup/plugin-terser';
import rollbarDeploy from 'rollup-plugin-rollbar-deploy';
import rollbarSourcemaps from 'rollup-plugin-rollbar-sourcemaps';
import { execSync } from 'child_process';
import createHTMLPlugin from './lib/create-html.mjs';
import createServiceWorkerPlugin from './lib/create-service-worker.mjs';
import { readFileSync } from 'node:fs';

// Use import.meta.url to make the path relative to the current source
// file instead of process.cwd(). For more information:
// https://nodejs.org/docs/latest-v16.x/api/esm.html#importmetaurl
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url))
);

import dotenv from 'dotenv';
dotenv.config({ path: '.dev.vars' });

const rollbarClientToken = process.env.ROLLBAR_CLIENT_TOKEN;
const rollbarServerToken = process.env.ROLLBAR_SERVER_TOKEN;

const SOURCE_VERSION =
  process.env.SOURCE_VERSION ||
  execSync('git rev-parse --short HEAD').toString();
const USER = execSync('whoami').toString();

const distDir = join('public'); // TODO
// Remove ./dist
rimraf.sync(distDir);

const buildConfig = () => {
  const isDev = process.env.BUILD !== 'production';

  const clientId = process.env.CLIENT_ID;

  return {
    input: {
      main: 'src/index.js',
    },
    output: {
      dir: distDir,
      format: 'iife',
      sourcemap: isDev || 'hidden',
      entryFileNames: '[name]-[hash].js',
      chunkFileNames: '[name]-[hash].js',
    },
    watch: { clearScreen: false },
    plugins: [
      // resolves in-built node packages like https / fs etc..
      nodeResolve({
        preferBuiltins: true,
        mainFields: ['browser', 'module', 'main'],
      }),

      commonjs(), // allows import to work with commonjs modules that do a module.exports
      babel({ exclude: 'node_modules/**', babelHelpers: 'bundled' }),
      !isDev && terser(), // uglify the code if not dev mode
      createHTMLPlugin({ isDev, rollbarClientToken, clientId }), // create the index.html
      copy({
        targets: [{ src: './src/static/**/*', dest: distDir, dot: true }],
      }),
      createServiceWorkerPlugin(),
      !isDev &&
        rollbarSourcemaps({
          accessToken: rollbarServerToken,
          baseUrl: '//film.rw251.com/',
          version,
        }), // upload rollbar source maps if production build
      !isDev &&
        rollbarDeploy({
          accessToken: rollbarServerToken,
          revision: SOURCE_VERSION,
          environment: 'production',
          localUsername: USER,
        }), // notify Rollbar of a deployment if production build
    ].filter((item) => item), // filter out unused plugins by filtering out false and null values
  };
};

export default function () {
  return [buildConfig()];
}

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const acorn = require("acorn");

const distDir = path.join(__dirname, "..", "public");

function getMainBundlePath() {
  if (!fs.existsSync(distDir)) {
    return null;
  }

  const files = fs.readdirSync(distDir).filter((file) => /^main-.*\.js$/.test(file));
  if (files.length === 0) {
    return null;
  }

  // Hashes are in file names; newest file is typically the latest build artifact.
  const newest = files
    .map((file) => ({
      file,
      mtimeMs: fs.statSync(path.join(distDir, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];

  return path.join(distDir, newest.file);
}

test("browser bundle parses as ES5", () => {
  const bundlePath = getMainBundlePath();
  assert.ok(bundlePath, 'No built main bundle found. Run "npm run build:production" first.');

  const code = fs.readFileSync(bundlePath, "utf8");
  assert.doesNotThrow(() => {
    acorn.parse(code, { ecmaVersion: 5 });
  }, `Bundle is not ES5-compatible: ${bundlePath}`);
});

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const standaloneRoot = path.join(projectRoot, '.next', 'standalone');
const serverFile = path.join(standaloneRoot, 'server.js');

if (!fs.existsSync(serverFile)) {
  console.error('Standalone server output is missing; run `npm run build` first.');
  process.exit(1);
}

for (const [source, destination] of [
  [
    path.join(projectRoot, 'public'),
    path.join(standaloneRoot, 'public'),
  ],
  [
    path.join(projectRoot, '.next', 'static'),
    path.join(standaloneRoot, '.next', 'static'),
  ],
]) {
  if (!fs.existsSync(source)) continue;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}

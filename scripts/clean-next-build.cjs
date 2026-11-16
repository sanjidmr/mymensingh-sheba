const fs = require('node:fs');
const path = require('node:path');

fs.rmSync(path.resolve(__dirname, '..', '.next'), { recursive: true, force: true });

const fs = require('fs');

const file = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex = /key=\{([^}]+)\}/g;
let match;
const keys = new Set();
while ((match = regex.exec(file)) !== null) {
  keys.add(match[1]);
}
console.log(Array.from(keys).join('\n'));

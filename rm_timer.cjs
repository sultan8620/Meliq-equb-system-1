const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const regex = /               \{group\?\.nextDrawDate \? \([\s\S]*?No Draw Scheduled'\}[\s\S]*?<\/p>\n                 <\/div>\n               \)\}/g;

code = code.replace(regex, '');
fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Removed timer block");

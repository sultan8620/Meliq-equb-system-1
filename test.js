const code = require('fs').readFileSync('src/pages/Dashboard.tsx', 'utf8');
const lines = code.split('\n');
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('const associatedSlots')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    for (let j=i+1; j<i+20; j++) console.log(`Line ${j+1}: ${lines[j]}`);
  }
}

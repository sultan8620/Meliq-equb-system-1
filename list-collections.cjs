const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');
const matches = content.match(/collection\(db,\s*'([^']+)'\)/g);
if (matches) {
  const unique = [...new Set(matches.map(m => m.match(/'([^']+)'/)[1]))];
  console.log(unique.join('\n'));
}

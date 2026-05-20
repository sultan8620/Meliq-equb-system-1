const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// The regex will look for onSnapshot calls that DO NOT have a third argument.
// A typical onSnapshot looks like: onSnapshot(queryOrDoc, (snapshot) => { ... });
// We'll replace it with: onSnapshot(queryOrDoc, (snapshot) => { ... }, (error) => handleFirestoreError(...));

const regex = /const\s+unsub(\w*)\s*=\s*onSnapshot\(([^,]+),\s*\(([^)]+)\)\s*=>\s*\{([\s\S]*?)\}\);/g;

content = content.replace(regex, (match, name, q, snapArg, body) => {
  return `const unsub${name} = onSnapshot(${q}, (${snapArg}) => {${body}}, (error) => {
    handleFirestoreError(error, OperationType.LIST, '${name || 'unknown'}');
  });`;
});

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);

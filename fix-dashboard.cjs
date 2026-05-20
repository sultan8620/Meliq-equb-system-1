const fs = require('fs');

const files = ['src/pages/Dashboard.tsx', 'src/App.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  // The regex will look for onSnapshot calls that DO NOT have a third argument.
  const regex = /const\s+unsub(\w*)\s*=\s*onSnapshot\(([^,]+),\s*\(([^)]+)\)\s*=>\s*\{([\s\S]*?)\}\);/g;

  content = content.replace(regex, (match, name, q, snapArg, body) => {
    return `const unsub${name} = onSnapshot(${q}, (${snapArg}) => {${body}}, (error) => {
      handleFirestoreError(error, OperationType.LIST, '${name || 'unknown'}');
    });`;
  });

  fs.writeFileSync(file, content);
}

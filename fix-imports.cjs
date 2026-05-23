const { readFileSync, writeFileSync } = require('fs');

function ensureImport(filepath, importPath) {
  let content = readFileSync(filepath, 'utf8');
  if (!content.includes('confirmAction') && !content.includes('promptAction')) return;
  
  if (!content.includes(importPath)) {
     // replace the very first import definition
     content = `import { confirmAction, promptAction } from '${importPath}';\n` + content;
     writeFileSync(filepath, content, 'utf8');
     console.log(`Added import to ${filepath}`);
  }
}

ensureImport('src/components/Marketplace.tsx', '../utils/dialogs');
ensureImport('src/pages/AdminDashboard.tsx', '../utils/dialogs');
ensureImport('src/pages/Dashboard.tsx', '../utils/dialogs');

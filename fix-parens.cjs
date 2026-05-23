const { readFileSync, writeFileSync } = require('fs');
const glob = require('glob');

function getFiles(dir, files = []) {
  const fs = require('fs');
  const path = require('path');
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles('src');

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/!\(await confirmAction\(/g, '!await confirmAction(');

  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    console.log(`Fixed syntax in ${file}`);
  }
}

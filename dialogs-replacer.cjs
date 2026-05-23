const { readFileSync, writeFileSync, readdirSync, statSync } = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles('src');

let changedCount = 0;

for (const file of files) {
  // Normalize path separators to forward slashes for matching
  const normalizedFile = file.replace(/\\/g, '/');
  if (normalizedFile === 'src/utils/dialogs.ts') continue;
  
  let content = readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/!window\.confirm\(/g, '!(await confirmAction(');
  content = content.replace(/!confirm\(/g, '!(await confirmAction(');
  
  // Replace window.confirm that was not preceded by !
  content = content.replace(/(?<!!)window\.confirm\(/g, 'await confirmAction(');
  
  // Replace confirm that was not preceded by !
  // And it must not be prefixed with anything like "wordconfirm(" or part of URL like "confirm("
  // But regex for JS keywords is better this way:
  content = content.replace(/(?<![a-zA-Z0-9_!])confirm\(/g, 'await confirmAction(');

  // Replace prompt
  content = content.replace(/window\.prompt\(/g, 'await promptAction(');
  content = content.replace(/(?<![a-zA-Z0-9_!])prompt\(/g, 'await promptAction(');

  if (content !== original) {
    if (!content.includes('confirmAction') && !content.includes('promptAction')) {
        let importPath = '';
        const depth = normalizedFile.split('/').length;
        if (depth === 2) { 
             importPath = './utils/dialogs';
        } else if (depth === 3) { 
             importPath = '../utils/dialogs';
        } else if (depth === 4) { 
             importPath = '../../utils/dialogs';
        }
        
        content = `import { confirmAction, promptAction } from '${importPath}';\n` + content;
    }
    
    writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated ${file}`);
  }
}
console.log(`Changed ${changedCount} files.`);

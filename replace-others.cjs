const fs = require('fs');
const glob = require('glob'); // Note: we can just manually process the files since we know which ones they are.

const files = [
  'src/components/ShareApp.tsx',
  'src/components/Marketplace.tsx'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('alert(')) {
    // Add import if not present
    if (!content.includes('import toast')) {
      content = "import toast from 'react-hot-toast';\n" + content;
    }
    
    // Replace alert( with toast(
    content = content.replace(/alert\(/g, "toast(");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Replaced alerts in ${filePath}`);
  }
});

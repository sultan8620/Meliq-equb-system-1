const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const lines = code.split('\n');

const newLines = lines.filter((line, index) => {
    if (line.includes('const [chatSubTab, setChatSubTab] = useState')) return false;
    return true;
});

fs.writeFileSync('src/pages/Dashboard.tsx', newLines.join('\n'));
console.log("Removed chatSubTab");

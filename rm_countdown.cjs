const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const regex1 = /  const \[countdown, setCountdown\] = useState\(\{ days: '00', hours: '00', mins: '00', secs: '00' \}\);\n/g;
const regex2 = /  useEffect\(\(\) => \{\n    if \(\!group\?\.nextDrawDate\) return;\n[\s\S]*?  \}, \[group\?\.nextDrawDate\]\);\n/g;

code = code.replace(regex1, '');
code = code.replace(regex2, '');
fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Removed countdown");

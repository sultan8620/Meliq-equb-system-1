const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
code = code.replace(
'              <div className="flex items-center w-full md:w-auto gap-4 relative z-10">\n                   onClick={() => setActiveTab(\'profile\')}',
'              <div className="flex items-center w-full md:w-auto gap-4 relative z-10">\n                 <button\n                    onClick={() => setActiveTab(\'profile\')}'
);
fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Fixed button");

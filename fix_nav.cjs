const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const badChunk = `              <div className={\`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 \${isActive ? 'bg-indigo-50 text-indigo-600 scale-110 shadow-sm' : 'bg-transparent text-slate-400'}\`}>
                <Icon size={isActive ? 20 : 22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
                )}
              </div>`;

const fixedChunk = `              <div className={\`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 \${isActive ? 'bg-indigo-50 text-indigo-600 scale-110 shadow-sm' : 'bg-transparent text-slate-400'}\`}>
                <Icon size={isActive ? 20 : 22} strokeWidth={isActive ? 2.5 : 2} />
              </div>`;

code = code.replace(badChunk, fixedChunk);
fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Fixed nav");

const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const badChunk = `                        <span className="text-[15px] md:text-[16px] font-black uppercase tracking-wide hidden md:block truncate flex-1 text-left">{tab.label}</span>
                          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)] rounded-full animate-pulse" />
                        )}`;

const fixedChunk = `                        <span className="text-[15px] md:text-[16px] font-black uppercase tracking-wide hidden md:block truncate flex-1 text-left">{tab.label}</span>`;

code = code.replace(badChunk, fixedChunk);

const badChunk2 = `                        <span className="text-xs font-black tracking-widest uppercase truncate">{item.label}</span>
                          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)] rounded-full animate-pulse" />
                        )}`;

const fixedChunk2 = `                        <span className="text-xs font-black tracking-widest uppercase truncate">{item.label}</span>`;

code = code.replace(badChunk2, fixedChunk2);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Fixed menus");

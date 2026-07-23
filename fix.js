const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

// Fix the corrupted lines 3226-3228
const corruptedBlock = `                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-              )}

              <div className="glass-card p-10 rounded-[3rem] relative overflow-hidden bg-white/40 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">ute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />`;

const correctBlock = `                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm"><Layers size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-indigo-500/50 bg-indigo-50 px-2 py-1 rounded-lg">Slots</span>
                 </div>
                 <div>
                    <h3 className="text-4xl font-display font-black text-slate-900 leading-none mb-1">{formatSlots(userData.slots)}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'የእርስዎ እጣዎች' : 'Active Slots'}</p>
                 </div>
              </div>

              <div className="relative overflow-hidden bg-white/90 p-6 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 cursor-pointer border border-slate-100 hover:border-emerald-500/30 shadow-md shadow-slate-200/15 hover:shadow-lg hover:shadow-emerald-500/5">
                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />`;

code = code.replace(corruptedBlock, correctBlock);

// Remove the old pending block
const pendingBlockRegex = /\{\s*userData\.status === 'pending'\s*&&\s*\([\s\S]*?<\/motion\.div>\s*\)\s*\}/g;
code = code.replace(pendingBlockRegex, '');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Fixed!");

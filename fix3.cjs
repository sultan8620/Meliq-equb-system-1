const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

// The standalone card in the first grid
const card1 = `              <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer border border-slate-100 hover:border-purple-500/30 shadow-lg shadow-slate-200/20">
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center border border-purple-100 shadow-sm"><Clock size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-purple-500/50 bg-purple-50 px-2 py-1 rounded-lg">Next</span>
                 </div>
                 <div>
                    <h3 className="text-xl font-display font-black text-slate-900 leading-none mb-1 truncate max-w-[150px]">{drawInfo.date}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ቀጣይ እጣ' : 'Upcoming Draw'}</p>
                 </div>
              </div>`;

code = code.replace(card1 + '\n', '');

// The card inside the group grid
const card2 = `                     <div className="flex flex-col gap-2 p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mb-1"><Clock size={16} /></div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ቀጣይ እጣ' : 'Next Draw'}</p>
                        <p className="text-xl font-display font-black text-slate-900 leading-none truncate">{drawInfo.date}</p>
                     </div>`;

code = code.replace(card2 + '\n', '');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Removed cards");

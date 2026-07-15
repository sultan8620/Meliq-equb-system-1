const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes("                         <div className=\"bg-white/20 text-white border border-white/30 rounded-full px-4 py-1.5 text-[10px]                       </h3>"));

if (startIndex !== -1) {
    const fixedLines = [
'                         <div className="bg-white/20 text-white border border-white/30 rounded-full px-4 py-1.5 text-[10px] tracking-[0.2em] font-black uppercase backdrop-blur-md shadow-xl">',
'                            {language === \'am\' ? `ዙር ${group?.currentRound}` : `Round ${group?.currentRound}`}',
'                         </div>',
'                       )}',
'                    </div>',
'                    <div className="flex items-center justify-center md:justify-start gap-3">',
'                       <span className="text-[10px] font-black uppercase tracking-widest text-white/50 bg-white/5 px-3 py-1 rounded-full">{userData.phone}</span>',
'                       <span className="w-1.5 h-1.5 rounded-full bg-white/20" />',
'                       <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-inner ${userData.status === \'pending\' ? \'bg-amber-500/20 text-amber-100 border border-amber-500/30\' : \'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30\'}`}>',
'                          <div className={`w-1.5 h-1.5 rounded-full ${userData.status === \'pending\' ? \'bg-amber-400 animate-pulse\' : \'bg-emerald-400\'}`} />',
'                          {userData.status === \'pending\' ? t(\'common.pending\') : t(\'common.verified\')}',
'                       </div>',
'                    </div>',
'                 </div>',
'              </div>',
'',
'              <div className="flex items-center w-full md:w-auto gap-4 relative z-10">'
    ];
    lines.splice(startIndex, 8, ...fixedLines);
    fs.writeFileSync('src/pages/Dashboard.tsx', lines.join('\n'));
    console.log("Fixed successfully");
} else {
    console.log("Not found");
}

const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const buttonStr = `                 <button onClick={() => setActiveTab('chat')} className="bg-white hover:-translate-y-1 transition-all p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 group text-slate-500 hover:text-rose-600 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-xl hover:shadow-rose-500/10 cursor-pointer">
                    <div className="w-14 h-14 rounded-[1rem] bg-rose-50/50 flex items-center justify-center text-rose-500 group-hover:scale-110 group-hover:bg-rose-100 transition-all relative">
                       <MessageCircle size={24} strokeWidth={2.5} />
                       {unreadChat && <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />}
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase">{language === 'am' ? 'ውይይት' : 'Chat'}</span>
                 </button>`;

if(code.includes(buttonStr)) {
    code = code.replace(buttonStr + '\n', '');
    fs.writeFileSync('src/pages/Dashboard.tsx', code);
    console.log("Removed chat button from overview");
} else {
    console.log("Button not found");
}

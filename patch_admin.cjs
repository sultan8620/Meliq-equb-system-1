const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Make email required, remove phone from UI
content = content.replace(
  `                 {/* Phone, Email, Role */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                   <div>
                     <label className="block text-[10px] font-black text-slate-700 mb-1">ስልክ ቁጥር</label>
                     <input 
                       type="text" 
                       required
                       placeholder="09..." 
                       value={addAdminForm.phone} 
                       onChange={e => setAddAdminForm({...addAdminForm, phone: e.target.value})} 
                       className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 transition-colors" 
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-slate-700 mb-1">ኢሜይል</label>
                     <input 
                       type="email" 
                       placeholder="አማራጭ ኢሜይል" 
                       value={addAdminForm.email} 
                       onChange={e => setAddAdminForm({...addAdminForm, email: e.target.value})} 
                       className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 transition-colors" 
                     />
                   </div>
                   <div>`,
  `                 {/* Email and Role */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                   <div>
                     <label className="block text-[10px] font-black text-slate-700 mb-1">ኢሜይል</label>
                     <input 
                       type="email" 
                       required
                       placeholder="አድሚን ኢሜይል" 
                       value={addAdminForm.email} 
                       onChange={e => setAddAdminForm({...addAdminForm, email: e.target.value})} 
                       className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 transition-colors" 
                     />
                   </div>
                   <div>`
);

// 2. Remove Password row
content = content.replace(
  `               {/* Password row */}
               <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 space-y-1.5 mt-2 mb-4">
                 <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider">ለአዲሱ አድሚን መግቢያ የይለፍ ቃል (Assign Login Password)</label>
                 <input 
                   type="text" 
                   required
                   placeholder="የይለፍ ቃል ያስገቡ (ለምሳሌ: Admin123!)" 
                   value={addAdminForm.password} 
                   onChange={e => setAddAdminForm({...addAdminForm, password: e.target.value})} 
                   className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 transition-colors" 
                 />
                 <p className="text-[9px] font-semibold text-slate-400 mt-0.5">አድሚኑ በዚሁ የይለፍ ቃል እና በስልካቸው/በኢሜይላቸው መግባት ይችላሉ። (ያለ የይለፍ ቃል 'Admin123!' በዲፎልት ያገለግላል)</p>
               </div>`,
  ``
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log("Patched Add Admin Form");

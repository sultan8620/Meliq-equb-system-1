import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

target = """                          <div>
                            <p className="text-[12px] font-black text-slate-900 tracking-tight leading-none mb-1">
                              {(payment.amount || 0).toLocaleString()} <span className="text-[8px] text-slate-400">ETB</span>
                            </p>
                            <div className="flex items-center gap-1">"""

replacement = """                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <p className="text-[12px] font-black text-slate-900 tracking-tight leading-none">
                                 {(payment.amount || 0).toLocaleString()} <span className="text-[8px] text-slate-400">ETB</span>
                               </p>
                               {(payment.paymentDays || 1) > 1 && (
                                 <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded">
                                   x{payment.paymentDays || 1}
                                 </span>
                               )}
                            </div>
                            <div className="flex items-center gap-1">"""

content = content.replace(target, replacement)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)


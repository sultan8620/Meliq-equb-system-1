import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Amount</span>
                    <span className="text-lg font-black text-slate-900">{paymentReviewModal.amount?.toLocaleString()} ETB</span>
                  </div>"""

replacement = """                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Amount</span>
                    <div className="flex items-center gap-2">
                       <span className="text-lg font-black text-slate-900">{paymentReviewModal.amount?.toLocaleString()} ETB</span>
                       {(paymentReviewModal.paymentDays || 1) > 1 && (
                         <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-lg">
                           x{paymentReviewModal.paymentDays || 1} {language === 'am' ? 'ቀናት' : 'Days'}
                         </span>
                       )}
                    </div>
                  </div>"""

content = content.replace(target, replacement)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


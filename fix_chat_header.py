import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

target = """             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[80vh] flex flex-col bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40 relative">
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">"""

replacement = """             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[80vh] flex flex-col bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40 relative">
               
               <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{language === 'am' ? 'ከአድሚን ጋር ይወያዩ' : 'Chat with Admin'}</h3>
                    <p className="text-[10px] font-bold text-slate-400">{language === 'am' ? 'የግል መልእክት' : 'Private Message'}</p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">"""

content = content.replace(target, replacement)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)


import os

filepath = 'src/pages/Dashboard.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (
        'className="w-full bg-slate-900 text-white h-16 rounded-[2rem] font-display font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"',
        'className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white h-16 rounded-[2rem] font-display font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:from-indigo-700 hover:to-indigo-800 transition-all active:scale-95"'
    ),
    (
        'className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-display font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"',
        'className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[1.5rem] font-display font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:from-indigo-700 hover:to-indigo-800 transition-all active:scale-95"'
    ),
    (
        'className="w-full max-w-sm py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"',
        'className="w-full max-w-sm py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"'
    ),
    (
        'className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-[0.98]"',
        'className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:from-indigo-700 hover:to-indigo-800 transition-all active:scale-[0.98]"'
    ),
    (
        'className="w-full h-16 bg-slate-900 text-white rounded-2xl font-display font-black text-xs uppercase tracking-[0.4em] hover:bg-slate-800 transition-all active:scale-[0.98] shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-4 disabled:opacity-50"',
        'className="w-full h-16 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-display font-black text-xs uppercase tracking-[0.4em] hover:from-indigo-700 hover:to-indigo-800 transition-all active:scale-[0.98] shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 disabled:opacity-50"'
    )
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated buttons successfully!")

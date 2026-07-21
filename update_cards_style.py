import os

filepath = 'src/pages/Dashboard.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace plain slate-900 cards with premium gradient cards
replacements = [
    (
        'className="bg-slate-900 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl group h-full"',
        'className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl group h-full"'
    ),
    (
        'className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden mb-6"',
        'className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-[2rem] p-6 text-white relative overflow-hidden mb-6 shadow-xl shadow-slate-900/40"'
    ),
    (
        'className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col h-full shadow-2xl"',
        'className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-[2.5rem] p-10 flex flex-col h-full shadow-2xl shadow-slate-900/40"'
    ),
    (
        'className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden"',
        'className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-xl shadow-slate-900/40"'
    ),
    (
        'className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl"',
        'className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40"'
    ),
    (
        'className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden"',
        'className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden"'
    ),
    (
        'className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl mb-8"',
        'className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40 mb-8"'
    ),
    (
        'className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group"',
        'className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden group"'
    )
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated cards successfully!")

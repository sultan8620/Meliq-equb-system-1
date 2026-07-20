import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 leading-none">System Health</h4>
                     <p className="text-4xl font-black text-white leading-none">98.5%</p>"""

replacement = """                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 leading-none">System Health</h4>
                     <p className="text-4xl font-black text-white leading-none">{(100 - (allUsers.filter(u => u.status === 'rejected').length / Math.max(1, allUsers.length)) * 100).toFixed(1)}%</p>"""

content = content.replace(target, replacement)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


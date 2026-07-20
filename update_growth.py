import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """                  <p className="text-4xl font-black text-white tracking-tighter">{allUsers.length}</p>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] font-bold text-blue-100">
                     <TrendingUp size={14} /> +12% Growth
                  </div>"""

replacement = """                  <p className="text-4xl font-black text-white tracking-tighter">{allUsers.length}</p>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] font-bold text-blue-100">
                     <TrendingUp size={14} /> {allUsers.filter(u => u.status === 'active').length} Active Members
                  </div>"""

content = content.replace(target, replacement)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


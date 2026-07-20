import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """                                    <div className="flex gap-1">
                                       {[1, 2, 3, 4, 5].map(star => (
                                          <div key={star} className={`w-1.5 h-6 rounded-full ${star < 4 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                                       ))}
                                    </div>"""

replacement = """                                    <div className="flex gap-1">
                                       {[1, 2, 3, 4, 5].map(star => {
                                          const score = Math.max(1, Math.min(5, Math.ceil((groupMembers.length / Math.max(1, group.memberCount)) * 5)));
                                          return <div key={star} className={`w-1.5 h-6 rounded-full ${star <= score ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                                       })}
                                    </div>"""

content = content.replace(target, replacement)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


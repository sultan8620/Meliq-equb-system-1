import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# Pattern matching with flexible whitespace
pattern = r'<label className="block relative group">\s*<span className="text-xs font-bold text-slate-700 mb-2 block w-full">Email / ኢሜይል</span>\s*<input\s+type="email"\s+value={auth\.currentUser\?\.email \|\| \'\'}\s+readOnly\s+className="w-full bg-slate-100/70 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-slate-500 cursor-not-allowed font-medium"\s*/>\s*<div className="absolute right-3 top-9 text-\[10px\] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">Firebase Sync</div>\s*</label>'

replacement = """<label className="block relative group">
                            <span className="text-xs font-bold text-slate-700 mb-2 block w-full">Email / ኢሜይል</span>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                              <input
                                type="email"
                                value={adminProfileEdits.email !== undefined ? adminProfileEdits.email : adminProfile?.email || auth.currentUser?.email || ''}
                                onChange={(e) => setAdminProfileEdits((prev: any) => ({ ...prev, email: e.target.value.toLowerCase() }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                placeholder="admin@example.com"
                              />
                            </div>
                         </label>"""

new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

if new_content != content:
    with open('src/pages/AdminDashboard.tsx', 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print("Pattern not found")

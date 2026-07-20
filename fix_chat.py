import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# Change default state
content = content.replace("const [chatSubTab, setChatSubTab] = useState<'group' | 'admin'>('group');", "const [chatSubTab, setChatSubTab] = useState<'group' | 'admin'>('admin');")

# Remove the toggle
target = """               <div className="flex bg-slate-50 border-b border-slate-100 p-2">
                 <button onClick={() => setChatSubTab('group')} className={`flex-1 py-3 font-bold rounded-2xl transition-colors ${chatSubTab === 'group' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:bg-slate-100/50'}`}>{language === 'am' ? 'የቡድን ውይይት (Group)' : 'Group Chat'}</button>
                 <button onClick={() => setChatSubTab('admin')} className={`flex-1 py-3 font-bold rounded-2xl transition-colors ${chatSubTab === 'admin' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:bg-slate-100/50'}`}>{language === 'am' ? 'አድሚን (Admin)' : 'Admin'}</button>
               </div>"""

content = content.replace(target, "")

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

import os

filepath = 'src/pages/Dashboard.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Revert mobile menu tab
old_mobile_tab = """                              <button 
                                onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${isActive ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                              >
                                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                                <span className="text-[16px] font-bold uppercase tracking-wide text-left flex-1">{tab.label}</span>
                                {tab.badge !== undefined && (
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-gold-500 text-white animate-pulse'}`}>
                                    {tab.badge}
                                  </span>
                                )}"""

new_mobile_tab = """                              <button 
                                onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                              >
                                <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                                <span className="text-[16px] font-bold uppercase tracking-wide text-left flex-1">{tab.label}</span>
                                {tab.badge !== undefined && (
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isActive ? 'bg-indigo-500 text-white' : 'bg-gold-500 text-white animate-pulse'}`}>
                                    {tab.badge}
                                  </span>
                                )}"""

# Revert desktop menu tab
old_desktop_tab = """                      <button 
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all relative group ${isActive ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} />
                        <span className="text-[15px] md:text-[16px] font-black uppercase tracking-wide hidden md:block truncate flex-1 text-left">{tab.label}</span>
                        {tab.badge !== undefined && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md hidden md:block ${isActive ? 'bg-white/20 text-white' : 'bg-gold-500 text-white animate-pulse'}`}>
                            {tab.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-indigo-300 rounded-r-full" />
                        )}
                      </button>"""

new_desktop_tab = """                      <button 
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all relative group ${isActive ? 'bg-slate-900 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'} />
                        <span className="text-[15px] md:text-[16px] font-black uppercase tracking-wide hidden md:block truncate flex-1 text-left">{tab.label}</span>
                        {tab.badge !== undefined && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md hidden md:block ${isActive ? 'bg-indigo-500 text-white' : 'bg-gold-500 text-white animate-pulse'}`}>
                            {tab.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-indigo-500 rounded-r-full" />
                        )}
                      </button>"""

content_norm = content.replace('\r\n', '\n')
old_mobile_tab_norm = old_mobile_tab.replace('\r\n', '\n')
new_mobile_tab_norm = new_mobile_tab.replace('\r\n', '\n')
old_desktop_tab_norm = old_desktop_tab.replace('\r\n', '\n')
new_desktop_tab_norm = new_desktop_tab.replace('\r\n', '\n')

content_norm = content_norm.replace(old_mobile_tab_norm, new_mobile_tab_norm)
content_norm = content_norm.replace(old_desktop_tab_norm, new_desktop_tab_norm)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Reverted menu tabs successfully!")

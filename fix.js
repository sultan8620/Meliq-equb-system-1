import fs from "fs";

const content = fs.readFileSync("src/pages/AdminDashboard.tsx", "utf-8");

const fixed = content.replace(
  /const slug = prompt\('Enter slug\/key \(e\.g\., About Us\):'\);\n\s*if \(slug\) \{[\s\S]*?Amharic Content<\/label>/,
  `const slug = prompt('Enter slug/key (e.g., About Us):');
                          if (slug) {
                            newMap[slug] = { am: 'ርዕስ', content: 'English content', contentAm: 'የአማርኛ ይዘት' };
                            setLandingSettings({...landingSettings, footerInfoMap: newMap});
                          }
                        }}
                        className="px-6 py-3 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200"
                      >
                        <Plus size={14} className="inline mr-2" /> Add Content
                      </button>
                    </div>

                    <div className="space-y-6">
                      {Object.keys(landingSettings.footerInfoMap || {}).map((slug) => (
                        <div key={slug} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                          <button 
                            onClick={() => {
                              if (!confirm('Delete this content?')) return;
                              const newMap = {...landingSettings.footerInfoMap};
                              delete newMap[slug];
                              setLandingSettings({...landingSettings, footerInfoMap: newMap});
                            }}
                            className="absolute top-6 right-6 text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="flex flex-col lg:flex-row gap-8">
                             <div className="lg:w-1/3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Slug/Key</label>
                                <div className="text-xs font-mono font-bold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">{slug}</div>
                                
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-1">Amharic Title</label>
                                <input 
                                  type="text"
                                  value={landingSettings.footerInfoMap[slug].am}
                                  onChange={(e) => {
                                    const newMap = {...landingSettings.footerInfoMap};
                                    newMap[slug].am = e.target.value;
                                    setLandingSettings({...landingSettings, footerInfoMap: newMap});
                                  }}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none font-am"
                                />
                             </div>
                             <div className="flex-1 space-y-4">
                                <div>
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-1">English Content</label>
                                  <textarea 
                                    value={landingSettings.footerInfoMap[slug].content}
                                    onChange={(e) => {
                                      const newMap = {...landingSettings.footerInfoMap};
                                      newMap[slug].content = e.target.value;
                                      setLandingSettings({...landingSettings, footerInfoMap: newMap});
                                    }}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-medium focus:border-emerald-500 transition-colors outline-none h-24 resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-1">Amharic Content</label>`
);

fs.writeFileSync("src/pages/AdminDashboard.tsx", fixed, "utf-8");
console.log("Replaced!");

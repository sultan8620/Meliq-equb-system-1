import os

filepath = "src/pages/AdminDashboard.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content_norm = content.replace("\r\n", "\n")

start_str = "ለአባሉ የመግቢያ መረጃ (Login Credentials)</p>"
idx_start = content_norm.find(start_str)
if idx_start == -1:
    print("ERROR: Login Credentials string not found!")
    exit(1)

idx_form_end = content_norm.find("</form>", idx_start)
if idx_form_end == -1:
    print("ERROR: closing </form> not found after confirmation note!")
    exit(1)

full_form_end_block = content_norm[idx_start:idx_form_end + len("</form>")]

replacement_form_end = """ለአባሉ የመግቢያ መረጃ (Login Credentials)</p>                      <p className="text-[11px] font-bold text-slate-400 leading-relaxed">                         አባሉ በሚቀጥለው ጊዜ ወደ መሊክ እቁብ ለመግባት <span className="text-rose-400 font-black">{addUserForm.phone || 'ስልክ ቁጥራቸው'}</span> እና ከላይ ያስገቡትን <span className="text-rose-400 font-black">የይለፍ ቃል</span> በመጠቀም መግባት ይችላሉ። ሲመዘገቡ የሚሰጣቸውን የአባል መለያ ኮድም ከገቡ በኋላ ያገኙታል።                      </p>                   </div>                 </div>               </div>            </form>
            ) : (
              <form onSubmit={handleTransferUsersSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pb-32">
                 {/* Target Group selection */}
                 <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-900">ተቀባይ ምድብ (Target Group) *</label>
                    <select 
                      value={addUserForm.groupId} 
                      onChange={e => setAddUserForm({...addUserForm, groupId: e.target.value})} 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    >
                      <option value="">-- ተቀባይ ምድብ ይምረጡ (Select Target) --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({(g.amount || 0).toLocaleString()} ETB - {g.type})</option>
                      ))}
                    </select>
                 </div>

                 {/* Source Group selection */}
                 <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-900">አባላት የሚመረጡበት መነሻ ምድብ (Source Group)</label>
                    <select 
                      value={transferSourceGroupId} 
                      onChange={e => {
                        setTransferSourceGroupId(e.target.value);
                        setTransferSelectedUserIds([]); // Reset selection when group changes
                      }} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    >
                      <option value="">-- ከሁሉም ምድቦች (All Groups / No Group) --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({(g.amount || 0).toLocaleString()} ETB - {g.type})</option>
                      ))}
                    </select>
                 </div>

                 {/* Search bar & Select All */}
                 <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <div className="relative w-full sm:max-w-xs">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                         type="text" 
                         placeholder={language === 'am' ? 'በስም ወይም በስልክ ፈልግ...' : 'Search name or phone...'}
                         value={transferSearchQuery}
                         onChange={e => setTransferSearchQuery(e.target.value)}
                         className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                       />
                    </div>
                    <div className="flex items-center gap-2">
                       <button
                         type="button"
                         onClick={() => {
                           const filtered = allUsers.filter(u => {
                             if (addUserForm.groupId && u.groupId === addUserForm.groupId) return false;
                             if (transferSourceGroupId && u.groupId !== transferSourceGroupId) return false;
                             if (transferSearchQuery) {
                               const q = transferSearchQuery.toLowerCase();
                               return u.fullName?.toLowerCase().includes(q) || u.phone?.includes(q);
                             }
                             return true;
                           });
                           setTransferSelectedUserIds(filtered.map(u => u.id));
                         }}
                         className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-colors"
                       >
                         {language === 'am' ? 'ሁሉንም ምረጥ' : 'Select All'}
                       </button>
                       <button
                         type="button"
                         onClick={() => setTransferSelectedUserIds([])}
                         className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors"
                       >
                         {language === 'am' ? 'ሁሉንም ሰርዝ' : 'Deselect All'}
                       </button>
                    </div>
                 </div>

                 {/* Members list to select from */}
                 <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-2 border border-slate-100 rounded-3xl p-3 bg-slate-50/50">
                    {(() => {
                      const filteredUsers = allUsers.filter(u => {
                        if (addUserForm.groupId && u.groupId === addUserForm.groupId) return false;
                        if (transferSourceGroupId && u.groupId !== transferSourceGroupId) return false;
                        if (transferSearchQuery) {
                          const q = transferSearchQuery.toLowerCase();
                          return u.fullName?.toLowerCase().includes(q) || u.phone?.includes(q);
                        }
                        return true;
                      });

                      if (filteredUsers.length === 0) {
                        return (
                          <div className="text-center py-10 opacity-60">
                            <Users size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
                              {language === 'am' ? 'ሊዛወሩ የሚችሉ አባላት አልተገኙም' : 'No transferable members found'}
                            </p>
                          </div>
                        );
                      }

                      return filteredUsers.map(u => {
                        const isChecked = transferSelectedUserIds.includes(u.id);
                        const userGroup = groups.find(g => g.id === u.groupId);
                        return (
                          <div 
                            key={u.id}
                            onClick={() => {
                              if (isChecked) {
                                setTransferSelectedUserIds(prev => prev.filter(id => id !== u.id));
                              } else {
                                setTransferSelectedUserIds(prev => [...prev, u.id]);
                              }
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer \${
                              isChecked 
                                ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' 
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all \${
                                isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isChecked && <CheckCircle size={14} className="stroke-[3]" />}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800 leading-none mb-1">{u.fullName}</p>
                                <p className="text-[10px] font-bold text-slate-500 leading-none">{u.phone}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {userGroup ? (
                                <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-black uppercase rounded-lg">
                                  {userGroup.name}
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded-lg">
                                  {language === 'am' ? 'ምድብ የሌለው' : 'No Group'}
                                </span>
                              )}
                              <span className="px-2 py-1 bg-slate-900 text-white text-[8px] font-mono font-bold rounded-lg">
                                {u.slots || 1} Slots
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                 </div>

                 {/* Selection stats & summary */}
                 <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-indigo-800">
                    <span>{language === 'am' ? 'የተመረጡ አባላት ብዛት:' : 'Selected Members:'} <strong>{transferSelectedUserIds.length}</strong></span>
                    <span>
                      {language === 'am' ? 'ጠቅላላ እጣዎች (Slots):' : 'Total Slots:'}{' '}
                      <strong>
                        {allUsers
                          .filter(u => transferSelectedUserIds.includes(u.id))
                          .reduce((sum, u) => sum + (parseInt(u.slots as any) || 1), 0)}
                      </strong>
                    </span>
                 </div>
              </form>
            )"""

content_norm = content_norm.replace(full_form_end_block, replacement_form_end)
print("FORM_END_PATCHED")

idx_btn = content_norm.find("{/* Footer Actions */}", idx_start)
if idx_btn == -1:
    print("ERROR: Footer Actions comment not found after form end!")
    exit(1)

idx_button_action = content_norm.find("handleAddUserSubmit", idx_btn)
if idx_button_action == -1:
    print("ERROR: handleAddUserSubmit button not found in footer actions!")
    exit(1)

idx_div_end = content_norm.find("</div>", idx_button_action)
if idx_div_end == -1:
    print("ERROR: closing div for footer actions not found!")
    exit(1)

full_footer_block = content_norm[idx_btn:idx_div_end + len("</div>")]

replacement_footer = """{/* Footer Actions */}
             <div className="absolute bottom-0 left-0 right-0 p-8 pt-4 bg-white/80 backdrop-blur-md border-t border-slate-50 flex gap-4">
               <button 
                 type="button" 
                 onClick={() => {
                   setShowAddUserModal(false);
                   setAddUserModalTab("register");
                 }}
                 className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
               >
                 አቋርጥ (Cancel)
               </button>
               <button 
                 onClick={(e) => { 
                   e.preventDefault(); 
                   if (addUserModalTab === 'register') {
                     handleAddUserSubmit(e); 
                   } else {
                     handleTransferUsersSubmit(e);
                   }
                 }}
                 disabled={addUserModalTab === 'register' ? isAddingUser : isTransferringUsers}
                 className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                 {addUserModalTab === 'register' ? (
                   isAddingUser ? <RefreshCw size={18} className="animate-spin" /> : <><Users size={18} /> አባሉን መዝግብ</>
                 ) : (
                   isTransferringUsers ? <RefreshCw size={18} className="animate-spin" /> : <><RefreshCw size={18} /> አባላትን አዛውር/አሸጋግር</>
                 )}
               </button>
             </div>"""

content_norm = content_norm.replace(full_footer_block, replacement_footer)
print("FOOTER_PATCHED")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content_norm)

print("PATCH_COMPLETED_SUCCESSFULLY")

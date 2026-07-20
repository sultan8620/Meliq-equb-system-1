import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """                  )}
                </div>
              </form>"""

replacement = """                  )}
                </div>

                {jointSlotForm.splitFactor >= 3 && (
                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
                        {language === 'am' ? 'የአባል 3 መረጃ' : 'Member 3 Details'}
                      </h4>
                      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                        <button
                          type="button"
                          onClick={() => setJointSlotForm({ ...jointSlotForm, member3Type: 'existing' })}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            jointSlotForm.member3Type === 'existing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          {language === 'am' ? 'ነባር አባል' : 'Existing'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setJointSlotForm({ ...jointSlotForm, member3Type: 'new' })}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            jointSlotForm.member3Type === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          {language === 'am' ? 'አዲስ አባል' : 'New User'}
                        </button>
                      </div>
                    </div>

                    {jointSlotForm.member3Type === 'existing' ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-700">
                          {language === 'am' ? 'ነባር አባል ይምረጡ *' : 'Select Existing Member *'}
                        </label>
                        <select
                          value={jointSlotForm.member3Id}
                          onChange={e => setJointSlotForm({ ...jointSlotForm, member3Id: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        >
                          <option value="">-- {language === 'am' ? 'አባል ይምረጡ' : 'Select Member'} --</option>
                          {allUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.fullName} ({u.phone})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-700">{language === 'am' ? 'ሙሉ ስም *' : 'Full Name *'}</label>
                          <input
                            type="text"
                            value={jointSlotForm.member3Name}
                            onChange={e => setJointSlotForm({ ...jointSlotForm, member3Name: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-700">{language === 'am' ? 'ስልክ ቁጥር *' : 'Phone *'}</label>
                          <input
                            type="text"
                            placeholder="09..."
                            value={jointSlotForm.member3Phone}
                            onChange={e => setJointSlotForm({ ...jointSlotForm, member3Phone: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-700">{language === 'am' ? 'የይለፍ ቃል *' : 'Password *'}</label>
                          <input
                            type="text"
                            value={jointSlotForm.member3Password}
                            onChange={e => setJointSlotForm({ ...jointSlotForm, member3Password: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {jointSlotForm.splitFactor >= 4 && (
                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">5</span>
                        {language === 'am' ? 'የአባል 4 መረጃ' : 'Member 4 Details'}
                      </h4>
                      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                        <button
                          type="button"
                          onClick={() => setJointSlotForm({ ...jointSlotForm, member4Type: 'existing' })}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            jointSlotForm.member4Type === 'existing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          {language === 'am' ? 'ነባር አባል' : 'Existing'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setJointSlotForm({ ...jointSlotForm, member4Type: 'new' })}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            jointSlotForm.member4Type === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          {language === 'am' ? 'አዲስ አባል' : 'New User'}
                        </button>
                      </div>
                    </div>

                    {jointSlotForm.member4Type === 'existing' ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-700">
                          {language === 'am' ? 'ነባር አባል ይምረጡ *' : 'Select Existing Member *'}
                        </label>
                        <select
                          value={jointSlotForm.member4Id}
                          onChange={e => setJointSlotForm({ ...jointSlotForm, member4Id: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        >
                          <option value="">-- {language === 'am' ? 'አባል ይምረጡ' : 'Select Member'} --</option>
                          {allUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.fullName} ({u.phone})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-700">{language === 'am' ? 'ሙሉ ስም *' : 'Full Name *'}</label>
                          <input
                            type="text"
                            value={jointSlotForm.member4Name}
                            onChange={e => setJointSlotForm({ ...jointSlotForm, member4Name: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-700">{language === 'am' ? 'ስልክ ቁጥር *' : 'Phone *'}</label>
                          <input
                            type="text"
                            placeholder="09..."
                            value={jointSlotForm.member4Phone}
                            onChange={e => setJointSlotForm({ ...jointSlotForm, member4Phone: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-700">{language === 'am' ? 'የይለፍ ቃል *' : 'Password *'}</label>
                          <input
                            type="text"
                            value={jointSlotForm.member4Password}
                            onChange={e => setJointSlotForm({ ...jointSlotForm, member4Password: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>"""

content = content.replace(target, replacement)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


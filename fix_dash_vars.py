import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace paidStepsInSelectedRound references
content = content.replace("paidStepsInSelectedRound / stepsPerRound", "accountedStepsInSelectedRound / stepsPerRound")
content = content.replace("paidStepsInSelectedRound}/${stepsPerRound}", "accountedStepsInSelectedRound}/${stepsPerRound}")
content = content.replace("Round ${selectedTrackerRound}: ${paidStepsInSelectedRound} of", "Round ${selectedTrackerRound}: ${accountedStepsInSelectedRound} of")

target = """                          {Array.from({ length: stepsPerRound }).map((_, sIdx) => {
                            const stepNo = sIdx + 1;
                            const isPaid = stepNo <= paidStepsInSelectedRound;"""

replacement = """                          {Array.from({ length: stepsPerRound }).map((_, sIdx) => {
                            const stepNo = sIdx + 1;
                            const isPaidActive = stepNo <= activeStepsInSelectedRound;
                            const isPaidPending = !isPaidActive && stepNo <= accountedStepsInSelectedRound;
                            const isPaid = isPaidActive || isPaidPending;"""

content = content.replace(target, replacement)

target2 = """                                    {isPaid ? (
                                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                        <CheckCircle size={12} strokeWidth={3} />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-500 flex items-center justify-center">
                                        <XCircle size={12} strokeWidth={3} />
                                      </div>
                                    )}"""

replacement2 = """                                    {isPaidActive ? (
                                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                        <CheckCircle size={12} strokeWidth={3} />
                                      </div>
                                    ) : isPaidPending ? (
                                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                                        <Activity size={12} strokeWidth={3} />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-500 flex items-center justify-center">
                                        <XCircle size={12} strokeWidth={3} />
                                      </div>
                                    )}"""

content = content.replace(target2, replacement2)

target3 = """                                className={`p-4 rounded-[1.5rem] border flex flex-col justify-between h-32 relative overflow-hidden transition-all shadow-sm ${
                                  isPaid 
                                    ? "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-950" 
                                    : selectedTrackerRound === (group.currentRound || 1)
                                      ? "bg-slate-50 border-slate-100 hover:border-indigo-100 hover:bg-white text-slate-900 cursor-pointer"
                                      : "bg-slate-100/50 border-slate-100 text-slate-400 opacity-60"
                                  }`}"""

replacement3 = """                                className={`p-4 rounded-[1.5rem] border flex flex-col justify-between h-32 relative overflow-hidden transition-all shadow-sm ${
                                  isPaidActive 
                                    ? "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-950" 
                                    : isPaidPending
                                      ? "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 text-amber-950"
                                      : selectedTrackerRound === (group.currentRound || 1)
                                        ? "bg-slate-50 border-slate-100 hover:border-indigo-100 hover:bg-white text-slate-900 cursor-pointer"
                                        : "bg-slate-100/50 border-slate-100 text-slate-400 opacity-60"
                                  }`}"""

content = content.replace(target3, replacement3)

target4 = """                                {/* Decorative circle */}
                                <div className={`absolute -right-4 -bottom-4 w-12 h-12 rounded-full blur-md opacity-20 ${isPaid ? 'bg-emerald-400' : 'bg-slate-300'}`} />"""

replacement4 = """                                {/* Decorative circle */}
                                <div className={`absolute -right-4 -bottom-4 w-12 h-12 rounded-full blur-md opacity-20 ${isPaidActive ? 'bg-emerald-400' : isPaidPending ? 'bg-amber-400' : 'bg-slate-300'}`} />"""

content = content.replace(target4, replacement4)

target5 = """                                  <p className="text-xs font-black tracking-tight leading-none mb-1">
                                    {isPaid 
                                      ? (language === 'am' ? 'የራይት ምልክት' : 'Verified')
                                      : (language === 'am' ? 'ኤክስ ምልክት' : 'Pending')}
                                  </p>"""

replacement5 = """                                  <p className="text-xs font-black tracking-tight leading-none mb-1">
                                    {isPaidActive 
                                      ? (language === 'am' ? 'የራይት ምልክት (ተረጋግጧል)' : 'Verified')
                                      : isPaidPending
                                        ? (language === 'am' ? 'በግምገማ ላይ (Pending)' : 'Under Review')
                                        : (language === 'am' ? 'ኤክስ ምልክት (ያልተከፈለ)' : 'Unpaid')}
                                  </p>"""

content = content.replace(target5, replacement5)

target6 = """                            let statusTextAm = isPaid 
                              ? `የራይት ምልክት (ተከፍሏል)${(userData?.slots || 1) > 1 ? ` - ተደርቧል (x${userData.slots})` : ''}` 
                              : "የኤክስ ምልክት (ያልተከፈለ)";
                            let statusTextEn = isPaid 
                              ? `Verified (Paid)${(userData?.slots || 1) > 1 ? ` - Stacked (x${userData.slots})` : ''}` 
                              : "Pending (Unpaid)";"""

replacement6 = """                            let statusTextAm = isPaidActive
                              ? `የራይት ምልክት (ተረጋግጧል)${(userData?.slots || 1) > 1 ? ` - ተደርቧል (x${userData.slots})` : ''}`
                              : isPaidPending
                                ? `በመጠባበቅ ላይ (ክፍያ ተልኳል)`
                                : "የኤክስ ምልክት (ያልተከፈለ)";
                            let statusTextEn = isPaidActive
                              ? `Verified (Paid)${(userData?.slots || 1) > 1 ? ` - Stacked (x${userData.slots})` : ''}`
                              : isPaidPending
                                ? `Pending Review (Submitted)`
                                : "Unpaid";"""

content = content.replace(target6, replacement6)


with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

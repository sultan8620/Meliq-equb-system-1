import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target1 = """                                    {/* Tracker calculations */}
                                    {(() => {
                                      // Filter active payments for this user in this group
                                      const userPayments = groupPayments.filter(p => p.userId === member.id);
                                      const totalPaidDays = userPayments.reduce((acc, p) => acc + (p.paymentDays || 1), 0);

                                      const getSteps = (type: string) => {"""

replacement1 = """                                    {/* Tracker calculations */}
                                    {(() => {
                                      // Filter active payments for this user in this group
                                      const userActivePayments = groupPayments.filter(p => p.userId === member.id && (p.status === 'active' || p.status === 'verified' || p.status === 'completed'));
                                      const totalActiveDays = userActivePayments.reduce((acc, p) => acc + (p.paymentDays || 1), 0);
                                      
                                      const userPendingPayments = groupPayments.filter(p => p.userId === member.id && p.status === 'pending');
                                      const totalPendingDays = userPendingPayments.reduce((acc, p) => acc + (p.paymentDays || 1), 0);
                                      
                                      const totalPaidDays = totalActiveDays;
                                      const totalAccountedDays = totalActiveDays + totalPendingDays;

                                      const getSteps = (type: string) => {"""

content = content.replace(target1, replacement1)

target2 = """                                      const paidStepsInSelectedRound = Math.min(
                                        stepsPerRound,
                                        Math.max(0, totalPaidDays - (adminTrackerRound - 1) * stepsPerRound)
                                      );

                                      return (
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                            <span>ጠቅላላ ክፍያ: <strong className="text-slate-800">${totalPaidDays} ቀናት</strong></span>
                                            <span>ዙር ${adminTrackerRound}: <strong className="text-slate-800">${paidStepsInSelectedRound}/${stepsPerRound} ቀናት</strong></span>
                                          </div>

                                          {/* Mini day grid */}
                                          <div className="grid grid-cols-5 gap-2">
                                            {Array.from({ length: stepsPerRound }).map((_, sIdx) => {
                                              const stepNo = sIdx + 1;
                                              const isPaid = stepNo <= paidStepsInSelectedRound;

                                              return (
                                                <div 
                                                  key={stepNo} 
                                                  className={`p-2 rounded-lg border text-center relative overflow-hidden ${
                                                    isPaid 
                                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900" 
                                                      : "bg-slate-50 border-slate-100 text-slate-400"
                                                  }`}
                                                >
                                                  {isPaid && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                      <CheckCircle size={24} />
                                                    </div>
                                                  )}
                                                  <span className="relative z-10 text-[10px] font-black">{stepNo}</span>
                                                </div>
                                              );
                                            })}
                                          </div>"""

replacement2 = """                                      const activeStepsInSelectedRound = Math.min(
                                        stepsPerRound,
                                        Math.max(0, totalActiveDays - (adminTrackerRound - 1) * stepsPerRound)
                                      );
                                      
                                      const accountedStepsInSelectedRound = Math.min(
                                        stepsPerRound,
                                        Math.max(0, totalAccountedDays - (adminTrackerRound - 1) * stepsPerRound)
                                      );

                                      return (
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                            <span>ጠቅላላ ክፍያ: <strong className="text-slate-800">${totalAccountedDays} ቀናት (የተረጋገጠ: ${totalActiveDays})</strong></span>
                                            <span>ዙር ${adminTrackerRound}: <strong className="text-slate-800">${accountedStepsInSelectedRound}/${stepsPerRound} ቀናት</strong></span>
                                          </div>

                                          {/* Mini day grid */}
                                          <div className="grid grid-cols-5 gap-2">
                                            {Array.from({ length: stepsPerRound }).map((_, sIdx) => {
                                              const stepNo = sIdx + 1;
                                              const isPaidActive = stepNo <= activeStepsInSelectedRound;
                                              const isPaidPending = !isPaidActive && stepNo <= accountedStepsInSelectedRound;

                                              return (
                                                <div 
                                                  key={stepNo} 
                                                  className={`p-2 rounded-lg border text-center relative overflow-hidden ${
                                                    isPaidActive 
                                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900" 
                                                      : isPaidPending
                                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-900"
                                                        : "bg-slate-50 border-slate-100 text-slate-400"
                                                  }`}
                                                >
                                                  {isPaidActive && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                      <CheckCircle size={24} />
                                                    </div>
                                                  )}
                                                  {isPaidPending && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                      <Activity size={24} />
                                                    </div>
                                                  )}
                                                  <span className="relative z-10 text-[10px] font-black">{stepNo}</span>
                                                </div>
                                              );
                                            })}
                                          </div>"""

content = content.replace(target2, replacement2)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)

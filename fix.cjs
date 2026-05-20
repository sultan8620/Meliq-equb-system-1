const fs = require('fs');

const path = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file has a corrupted section starting right after `value={paymentSearch}`
// We will find the exact lines 4264 to 4409 and replace them with the correct version.

const lines = content.split('\n');

// Find start index
const startIndex = lines.findIndex(l => l.includes('<div className="relative w-full md:w-64">'));
// Find end index (the end of the Admin Header block)
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('<Plus size={20} /> አዲስ አድሚን መዝግብ')) + 3;

if (startIndex === -1 || endIndex < 3) {
    console.error("Could not find bounds");
    process.exit(1);
}

const replacement = `              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder={language === 'am' ? 'ክፍያዎችን ፈልግ...' : 'Search transactions...'}
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* List of payments */}
            {(paymentHistoryView === 'pending' ? payments : allPayments).filter(p => 
              p.userName?.toLowerCase().includes(paymentSearch.toLowerCase()) || 
              p.groupName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
              p.reference?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
              p.receiptId?.toLowerCase().includes(paymentSearch.toLowerCase())
            ).length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                    <Search size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
                    {paymentSearch 
                      ? (language === 'am' ? 'ምንም አልተገኘም' : 'No results found') 
                      : (language === 'am' ? 'ክፍያ የለም' : 'No payments yet')}
                  </h3>
                  <p className="text-slate-400 text-sm max-w-sm">
                    {paymentSearch 
                      ? (language === 'am' ? 'እባክዎ የፍለጋ ቃሎትን አስተካክለው እንደገና ይሞክሩ፣ ወይም የፊደል ግድፈት አለመፃፉን ያረጋግጡ።' : 'Try searching for something else.')
                      : (paymentHistoryView === 'pending' 
                        ? 'አባላት ክፍያ ሲፈጽሙ እዚህ ላይ ይመዘገባሉ እና እርስዎ ማጽደቅ ይኖርብዎታል።' 
                        : 'ገና ምንም አይነት የተረጋገጠ ክፍያ አልተመዘገበም።')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(paymentHistoryView === 'pending' ? payments : allPayments)
                    .filter(p => 
                      p.userName?.toLowerCase().includes(paymentSearch.toLowerCase()) || 
                      p.groupName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                      p.reference?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                      p.receiptId?.toLowerCase().includes(paymentSearch.toLowerCase())
                    )
                    .map(payment => (
                      <motion.div 
                        layout
                        key={payment.id} 
                        className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6 group hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 relative overflow-hidden"
                      >
                      {/* Status Accent Bar */}
                      <div className={\`absolute top-0 left-0 w-1.5 h-full \${payment.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}\`} />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={\`w-12 h-12 \${payment.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} rounded-2xl flex items-center justify-center border border-current/10 shrink-0 transform group-hover:rotate-12 transition-transform duration-500\`}>
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-0.5">{payment.userName}</h3>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{payment.groupName}</span>
                              <div className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="text-[9px] font-bold text-slate-50">{payment.createdAt?.toDate ? payment.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-slate-900 leading-none mb-0.5">
                            {payment.amount?.toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span>
                          </p>
                          <span className={\`inline-flex px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest \${payment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}\`}>
                            {payment.status === 'active' ? 'ተከፍሏል' : 'በግምገማ ላይ'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Receipt ID</p>
                          <p className="text-[9px] font-mono font-bold text-slate-700 truncate">#{payment.receiptId || 'N/A'}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reference</p>
                           <p className="text-[9px] font-bold text-slate-700 truncate">{payment.reference || 'Mobile Banking'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {payment.status === 'active' && (
                          <button 
                            onClick={() => handleDownloadReceipt(payment)}
                            className="flex-1 px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <Download size={14} /> Receipt
                          </button>
                        )}
                        
                        {payment.status === 'pending' && (
                          <button 
                            onClick={() => {
                              setPaymentReviewModal(payment);
                              setPaymentReviewMessage('');
                            }}
                            className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <Eye size={14} /> {language === 'am' ? 'ገምግም (Review)' : 'Review'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : isSuperAdmin && activeTab === 'admins' ? (
          <motion.div 
            key="admins"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 p-8 max-w-7xl mx-auto"
          >
            {/* Beautiful Admin Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
               {/* Gradients */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-3xl rounded-full" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
               
               <div className="relative z-10 w-full">
                 <div className="flex items-center gap-3 mb-2">
                   <ShieldCheck className="text-amber-500" size={32} />
                   <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter drop-shadow-md">የአድሚን ቡድን ማስተዳደሪያ</h2>
                 </div>
                 <p className="text-slate-400 font-medium max-w-2xl text-sm md:text-base leading-relaxed mb-6">
                   ይህ ገጽ ለዋና አድሚን (Super Admin) ብቻ የሚታይ ሲሆን፣ የሲስተም አድሚኖችን ለመጨመር፣ መብቶቻቸውን ለማስተካከል እና አስፈላጊ ሲሆን ከሲስተሙ ለመሰረዝ ያገለግላል። ማናቸውም የማጥፋት፣ የማስተካከል እርምጃዎች የዋናው አድሚን ሙሉ ስልጣን ናቸው።
                 </p>

                 <button 
                   onClick={() => setShowAddAdminModal(true)}
                   className="w-full md:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 hover:-translate-y-1"
                 >
                   <Plus size={20} /> አዲስ አድሚን መዝግብ
                 </button>
               </div>
            </div>`;

lines.splice(startIndex, endIndex - startIndex + 1, replacement);

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed successfully');

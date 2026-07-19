const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Add state
content = content.replace(
  /const \[paymentCode, setPaymentCode\] = useState\(''\);/,
  "const [paymentCode, setPaymentCode] = useState('');\n  const [paymentDays, setPaymentDays] = useState<number>(1);"
);

// Update handleSendPayment
content = content.replace(
  /const calculatedAmount = userData\?\.totalPerSlot \? \(userData\.totalPerSlot \* \(userData\.slots \|\| 1\)\) \: \(\(group\?\.amount \|\| 0\) \* 1\.1 \* \(userData\?\.slots \|\| 1\)\);/g,
  `const baseAmount = userData?.totalPerSlot ? (userData.totalPerSlot * (userData.slots || 1)) : ((group?.amount || 0) * 1.1 * (userData?.slots || 1));
      const calculatedAmount = baseAmount * paymentDays;`
);

content = content.replace(
  /amount: calculatedAmount,/g,
  `amount: calculatedAmount,\n        paymentDays: paymentDays,`
);

// Also reset paymentDays after success
content = content.replace(
  /setPaymentCode\(''\);/g,
  "setPaymentCode('');\n      setPaymentDays(1);"
);

// Replace form UI for Amount
const oldFormUI = `                 <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{language === 'am' ? 'የክፍያ መጠን' : 'Amount to Pay'}</label>
                      <div className="w-full h-14 bg-slate-100 border border-slate-200 rounded-2xl px-5 flex items-center shadow-inner">
                        <span className="text-lg font-black text-slate-900">{(userData?.totalPerSlot ? (userData.totalPerSlot * (userData.slots || 1)) : ((group?.amount || 0) * 1.1 * (userData?.slots || 1))).toLocaleString()} ETB</span>
                      </div>
                   </div>
                 </div>`;

const newFormUI = `                 <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{language === 'am' ? 'የስንት ቀን ክፍያ ነው?' : 'Payment for how many days?'}</label>
                      <select 
                        value={paymentDays}
                        onChange={(e) => setPaymentDays(Number(e.target.value))}
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer"
                      >
                        <option value={1}>የአንድ ቀን (1 Day)</option>
                        <option value={2}>የሁለት ቀን (2 Days)</option>
                        <option value={3}>የሶስት ቀን (3 Days)</option>
                        <option value={4}>የአራት ቀን (4 Days)</option>
                        <option value={5}>የአምስት ቀን (5 Days)</option>
                        <option value={10}>የ 10 ቀን (10 Days)</option>
                        <option value={15}>የ 15 ቀን (15 Days)</option>
                        <option value={30}>የ 30 ቀን (1 Month)</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{language === 'am' ? 'የክፍያ መጠን' : 'Amount to Pay'}</label>
                      <div className="w-full h-14 bg-slate-100 border border-slate-200 rounded-2xl px-5 flex items-center shadow-inner">
                        <span className="text-lg font-black text-slate-900">{((userData?.totalPerSlot ? (userData.totalPerSlot * (userData.slots || 1)) : ((group?.amount || 0) * 1.1 * (userData?.slots || 1))) * paymentDays).toLocaleString()} ETB</span>
                      </div>
                   </div>
                 </div>`;

content = content.replace(oldFormUI, newFormUI);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Patched payment form in Dashboard.tsx");

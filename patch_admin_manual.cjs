const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// In handleManualPayment:
// amount: totalAmount,
content = content.replace(
  /amount: totalAmount,/g,
  "amount: totalAmount,\n        paymentDays: paymentCount,"
);

// Quantity (Cycles) -> የስንት ቀን ክፍያ ነው? (Cycles/Days)
content = content.replace(
  /<label className="block text-\[8px\] font-black text-slate-400 uppercase mb-1\.5 tracking-widest">Quantity \(Cycles\)<\/label>/g,
  '<label className="block text-[8px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">{language === \'am\' ? \'የስንት ቀን ክፍያ ነው? (Cycles/Days)\' : \'Quantity (Cycles)\'}</label>'
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log("Patched admin manual payment");

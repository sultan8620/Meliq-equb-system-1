const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// 1. Line 5482
content = content.replace(
  "{ label: 'የተሰበሰበ ብር', value: (allPayments.reduce((acc, p) => acc + (p.amount || 0), 0) / 1000).toFixed(1) + 'k', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' }",
  "{ label: 'የተሰበሰበ ብር', value: (groups.reduce((acc, g) => acc + ((g.amount || 0) * (g.memberCount || 0)), 0) / 1000).toFixed(1) + 'k', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' }"
);

// 2. Line 6160
content = content.replace(
  "<p className=\"text-xs font-black text-slate-900 leading-none\">{allPayments.filter(p => p.groupId === group.id).reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()} <span className=\"text-[8px] text-slate-500\">ብር</span></p>",
  "<p className=\"text-xs font-black text-slate-900 leading-none\">{((group.amount || 0) * (group.memberCount || 0)).toLocaleString()} <span className=\"text-[8px] text-slate-500\">ብር</span></p>"
);

// 3. Line 10093
content = content.replace(
  "{allPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()} <span className=\"text-xs\">ETB</span>",
  "{groups.reduce((acc, g) => acc + ((g.amount || 0) * (g.memberCount || 0)), 0).toLocaleString()} <span className=\"text-xs\">ETB</span>"
);

// 4. Line 10601
content = content.replace(
  "<p className=\"text-xl font-black text-slate-900\">{allPayments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}</p>",
  "<p className=\"text-xl font-black text-slate-900\">{groups.reduce((acc, g) => acc + ((g.amount || 0) * (g.memberCount || 0)), 0).toLocaleString()}</p>"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log("Replacements complete.");

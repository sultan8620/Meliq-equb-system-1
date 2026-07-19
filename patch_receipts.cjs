const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // 1. Update displayReceiptId
  const regex = /const displayReceiptId = \(payment: any\) => \{[\s\S]*?return `\$\{prefix\}-\$\{paymentSuffix\}`;\n\};/m;
  const replacement = `const displayReceiptId = (payment: any) => {
  if (!payment) return '';
  if (payment.receiptId) return payment.receiptId;
  const bank = payment.bank || '';
  const prefix = getBankPrefix(bank);
  const paymentSuffix = payment.id ? payment.id.slice(0, 8).toUpperCase() : Math.floor(1000 + Math.random() * 9000).toString();
  return \`\${prefix}-\${paymentSuffix}\`;
};`;
  content = content.replace(regex, replacement);

  // 2. Update receipt amount label
  content = content.replace(
    /\{language === 'am' \? 'የተከፈለው መጠን' : 'Amount Paid'\}/g,
    "{language === 'am' ? `የ${selectedPayment.paymentDays || 1} ቀን ክፍያ` : `${selectedPayment.paymentDays || 1} Day(s) Paid`}"
  );

  fs.writeFileSync(filepath, content);
  console.log("Patched " + filepath);
}

patchFile('src/pages/Dashboard.tsx');
patchFile('src/pages/AdminDashboard.tsx');

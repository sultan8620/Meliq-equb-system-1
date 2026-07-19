const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// In handleAddAdminSubmit:
// const cleanPhone = normalizePhone(addAdminForm.phone);
// changes to const cleanPhone = addAdminForm.phone ? normalizePhone(addAdminForm.phone) : '';

content = content.replace(
  /const cleanPhone = normalizePhone\(addAdminForm\.phone\);/,
  "const cleanPhone = addAdminForm.phone ? normalizePhone(addAdminForm.phone) : '';"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log("Patched normalizePhone");

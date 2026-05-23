const fs = require('fs');

function replaceAlerts(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace alert(something) with triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', something)
  // Be careful with newlines or nested parentheses in alerts.
  // A regex replacement or AST based is better. Regex:
  
  content = content.replace(/alert\(([^)]+)\)/g, (match, arg) => {
    // If it's already calling triggerSuccess, ignore
    if (arg.includes('triggerSuccess')) return match;
    
    // We can just inject triggerSuccess
    return `triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', ${arg})`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Replaced alerts in ${filePath}`);
}

replaceAlerts('src/pages/AdminDashboard.tsx');
replaceAlerts('src/pages/Dashboard.tsx');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const startIndex = code.indexOf("{activeTab === 'chat' && (");
if (startIndex !== -1) {
    const endIndex = code.indexOf("{activeTab === 'market' && (", startIndex);
    if (endIndex !== -1) {
        code = code.substring(0, startIndex) + code.substring(endIndex);
        fs.writeFileSync('src/pages/Dashboard.tsx', code);
        console.log("Removed chat tab block");
    } else {
        console.log("End index not found");
    }
} else {
    console.log("Start index not found");
}

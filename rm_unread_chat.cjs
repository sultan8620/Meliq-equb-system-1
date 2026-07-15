const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
const lines = code.split('\n');

const newLines = lines.filter((line, index) => {
    if (line.includes('const [unreadChat, setUnreadChat] = useState(false);')) return false;
    if (line.includes('unreadChat && !isActive && (')) return false;
    if (line.includes('tab.id === \'chat\' && unreadChat')) return false;
    if (line.includes('item.id === \'chat\' && unreadChat')) return false;
    if (line.includes('setUnreadChat(false)')) return false;
    if (line.includes('setUnreadChat(true)')) return false;
    return true;
});

fs.writeFileSync('src/pages/Dashboard.tsx', newLines.join('\n'));
console.log("Removed unreadChat");

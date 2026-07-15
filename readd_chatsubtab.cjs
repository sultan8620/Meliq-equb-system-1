const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

// just add it below `const [activeTab, setActiveTab] = useState`
code = code.replace(
    /const \[activeTab, setActiveTab\] = useState[^;]+;/g,
    "$& \n const [chatSubTab, setChatSubTab] = useState<'group' | 'admin'>('group');"
);
fs.writeFileSync('src/pages/Dashboard.tsx', code);

const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
content = content.replace(
  /id: 'members',\s*label: language === 'am' \? 'የእጣ አባላት' : t\('menu\.user\.members'\),\s*icon: Users,\s*description: language === 'am' \? 'የግሩፕ አባላት ዝርዝር' : 'Group members list'\s*\},/,
  `id: 'members', 
          label: language === 'am' ? 'የእጣ አባላት' : t('menu.user.members'), 
          icon: Users,
          description: language === 'am' ? 'የግሩፕ አባላት ዝርዝር' : 'Group members list'
        },
        { 
          id: 'chat', 
          label: language === 'am' ? 'ውይይት (Chat)' : 'Chat', 
          icon: MessageCircle,
          description: language === 'am' ? 'ከአድሚን እና ከአባላት ጋር ይወያዩ' : 'Chat with admin and members'
        },`
);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Patched");

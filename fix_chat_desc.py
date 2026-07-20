import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

target = "description: language === 'am' ? 'ከአድሚን እና ከአባላት ጋር ይወያዩ' : 'Chat with admin and members'"
replacement = "description: language === 'am' ? 'ከአድሚን ጋር ይወያዩ' : 'Chat with admin'"

content = content.replace(target, replacement)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

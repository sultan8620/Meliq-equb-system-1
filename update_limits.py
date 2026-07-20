import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("where('status', '==', 'active'), limit(50)", "where('status', '==', 'active')")
content = content.replace("where('status', 'in', ['active', 'cancelled']), limit(50)", "where('status', 'in', ['active', 'cancelled'])")
content = content.replace("where('status', '==', 'settled'), limit(50)", "where('status', '==', 'settled')")

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """    const q = query(
      collection(db, 'payments'),
      where('groupId', '==', viewingGroupId),
      where('status', '==', 'active')
    );"""

replacement = """    const q = query(
      collection(db, 'payments'),
      where('groupId', '==', viewingGroupId),
      where('status', 'in', ['active', 'verified', 'completed', 'pending'])
    );"""

content = content.replace(target, replacement)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)

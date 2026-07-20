import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """                           const groupIncome = allPayments
                              .filter(p => p.groupId === group.id && (p.status === 'verified'))
                              .reduce((acc, curr) => acc + (curr.amount || 0), 0);"""

replacement = """                           const groupIncome = allPayments
                              .filter(p => p.groupId === group.id && (p.status === 'active' || p.status === 'verified' || p.status === 'completed'))
                              .reduce((acc, curr) => acc + (curr.amount || 0), 0);"""

content = content.replace(target, replacement)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


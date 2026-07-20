import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target1 = """                    {allPayments.filter(p => p.status === 'verified').reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()} <span className="text-xs">ETB</span>"""

replacement1 = """                    {allPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()} <span className="text-xs">ETB</span>"""

content = content.replace(target1, replacement1)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


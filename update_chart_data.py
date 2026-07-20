import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """                           data={[
                              { name: 'Jan', income: 45000, payout: 30000 },
                              { name: 'Feb', income: 72000, payout: 40000 },
                              { name: 'Mar', income: 68000, payout: 50000 },
                              { name: 'Apr', income: 91000, payout: 60000 },
                              { name: 'May', income: 105000, payout: 70000 },
                           ]}"""

replacement = """                           data={monthlyChartData}"""

content = content.replace(target, replacement)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


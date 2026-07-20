import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target1 = """       if (userPayments.length < currentRound) { // They must have at least currentRound approved payments to be eligible!"""
replacement1 = """       const paidDays = userPayments.reduce((acc, p) => acc + (p.paymentDays || 1), 0);
       if (paidDays < currentRound) { // They must have at least currentRound approved payments to be eligible!"""
content = content.replace(target1, replacement1)

target2 = """                       if (userPayments.length < currentRound) {"""
replacement2 = """                       const paidDays = userPayments.reduce((acc, p) => acc + (p.paymentDays || 1), 0);
                       if (paidDays < currentRound) {"""
content = content.replace(target2, replacement2)

target3 = """                                    const hasMissingDays = userPayments.length < currentRound;"""
replacement3 = """                                    const paidDays = userPayments.reduce((acc, p) => acc + (p.paymentDays || 1), 0);
                                    const hasMissingDays = paidDays < currentRound;"""
content = content.replace(target3, replacement3)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


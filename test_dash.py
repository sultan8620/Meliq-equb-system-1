import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

target1 = """                    // Filter user payments in this group that are verified (status === 'active')
                    const userActivePayments = payments.filter(p => p.groupId === group.id && p.status === 'active');
                    // Calculate total paid days (using paymentDays, fallback to 1)
                    const totalPaidDays = userActivePayments.reduce((acc, p) => acc + (p.paymentDays || 1), 0);"""

replacement1 = """                    // Filter user payments in this group that are verified (status === 'active' or 'verified')
                    const userActivePayments = payments.filter(p => p.groupId === group.id && (p.status === 'active' || p.status === 'verified'));
                    const totalActiveDays = userActivePayments.reduce((acc, p) => acc + (p.paymentDays || 1), 0);
                    
                    const userPendingPayments = payments.filter(p => p.groupId === group.id && p.status === 'pending');
                    const totalPendingDays = userPendingPayments.reduce((acc, p) => acc + (p.paymentDays || 1), 0);
                    
                    const totalPaidDays = totalActiveDays;
                    const totalAccountedDays = totalActiveDays + totalPendingDays;"""

content = content.replace(target1, replacement1)

target2 = """                    // Calculate days paid in the SELECTED round
                    const paidStepsInSelectedRound = Math.min(
                      stepsPerRound,
                      Math.max(0, totalPaidDays - (selectedTrackerRound - 1) * stepsPerRound)
                    );"""

replacement2 = """                    // Calculate days paid in the SELECTED round
                    const activeStepsInSelectedRound = Math.min(
                      stepsPerRound,
                      Math.max(0, totalActiveDays - (selectedTrackerRound - 1) * stepsPerRound)
                    );
                    
                    const accountedStepsInSelectedRound = Math.min(
                      stepsPerRound,
                      Math.max(0, totalAccountedDays - (selectedTrackerRound - 1) * stepsPerRound)
                    );"""

content = content.replace(target2, replacement2)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

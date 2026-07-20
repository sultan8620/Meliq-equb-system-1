import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 flex font-sans">"""

replacement = """  const monthlyChartData = useMemo(() => {
    const data: { [key: string]: { income: number; payout: number } } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months including current
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data[`${d.getFullYear()}-${d.getMonth()}`] = { income: 0, payout: 0 };
    }

    allPayments.forEach(p => {
      const pDate = p.createdAt?.toDate ? p.createdAt.toDate() : (p.createdAt ? new Date(p.createdAt) : null);
      if (pDate) {
        const key = `${pDate.getFullYear()}-${pDate.getMonth()}`;
        if (data[key]) {
          data[key].income += (p.amount || 0);
        }
      }
    });

    allPayouts.filter(p => p.status === 'active').forEach(p => {
      const pDate = p.createdAt?.toDate ? p.createdAt.toDate() : (p.createdAt ? new Date(p.createdAt) : null);
      if (pDate) {
        const key = `${pDate.getFullYear()}-${pDate.getMonth()}`;
        if (data[key]) {
          data[key].payout += (p.amount || 0);
        }
      }
    });

    return Object.keys(data).sort().map(key => {
      const [year, month] = key.split('-');
      return {
        name: monthNames[parseInt(month)],
        income: data[key].income,
        payout: data[key].payout
      };
    });
  }, [allPayments, allPayouts]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 flex font-sans">"""

content = content.replace(target, replacement)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)


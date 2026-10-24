import React from 'react';

export function calculateFinancialSummary(transactions) {
  const txList = Array.isArray(transactions) ? transactions : [];

  let income = 0;
  let expenses = 0;

  txList.forEach((t) => {
    if (!t) return;
    const amount = parseFloat(t.amount) || 0;
    if (t.type === 'income' || (!t.type && amount > 0)) {
      income += Math.abs(amount);
    } else if (t.type === 'expense' || (!t.type && amount < 0)) {
      expenses += Math.abs(amount);
    }
  });

  const balance = income - expenses;

  return {
    income: income.toFixed(2),
    expenses: expenses.toFixed(2),
    balance: balance.toFixed(2),
    numericBalance: balance,
    numericIncome: income,
    numericExpenses: expenses,
  };
}

function SummaryCards({ transactions = [] }) {
  const summary = calculateFinancialSummary(transactions);
  const isNegativeBalance = summary.numericBalance < 0;

  const cards = [
    {
      title: 'Total Balance',
      value: isNegativeBalance
        ? `-$${Math.abs(summary.numericBalance).toFixed(2)}`
        : `$${summary.balance}`,
      icon: '💳',
      color: isNegativeBalance ? '#ef4444' : '#2563eb',
      bgColor: isNegativeBalance ? '#fef2f2' : '#eff6ff',
    },
    {
      title: 'Income',
      value: `$${summary.income}`,
      icon: '📈',
      color: '#10b981',
      bgColor: '#ecfdf5',
    },
    {
      title: 'Expenses',
      value: `$${summary.expenses}`,
      icon: '📉',
      color: '#ef4444',
      bgColor: '#fef2f2',
    },
  ];

  return (
    <div style={styles.container}>
      {cards.map((card) => (
        <div key={card.title} className="interactive-card" style={styles.card}>
          <div style={{ ...styles.iconContainer, backgroundColor: card.bgColor }}>
            <span style={styles.icon}>{card.icon}</span>
          </div>
          <div style={styles.content}>
            <p style={styles.title}>{card.title}</p>
            <p style={{ ...styles.value, color: card.color }}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: '22px',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  value: {
    margin: '3px 0 0 0',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
    fontVariantNumeric: 'tabular-nums',
  },
};

export default SummaryCards;

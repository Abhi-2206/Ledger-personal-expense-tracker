import React from 'react';

function SummaryCards({ transactions }) {
  const calculateSummary = () => {
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = income - expenses;


    return {
      balance: balance.toFixed(2),
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
    };
  };

  const summary = calculateSummary();

  const cards = [
    {
      title: 'Total Balance',
      value: `$${summary.balance}`,
      icon: '💳',
      color: '#3b82f6',
      bgColor: '#eff6ff',
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
        <div key={card.title} style={styles.card}>
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
    gap: '24px',
    marginBottom: '32px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  iconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '28px',
  },
  content: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  value: {
    margin: '4px 0 0 0',
    fontSize: '24px',
    fontWeight: '700',
  },
};

export default SummaryCards;

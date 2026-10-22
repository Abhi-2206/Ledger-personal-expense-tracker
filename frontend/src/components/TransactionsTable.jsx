import React from 'react';

function TransactionsTable() {
  const transactions = [
    { id: 1, description: 'Grocery Store', category: 'Food', date: '2026-10-22', amount: -85.50 },
    { id: 2, description: 'Salary Deposit', category: 'Income', date: '2026-10-21', amount: 4500.00 },
    { id: 3, description: 'Electric Bill', category: 'Utilities', date: '2026-10-20', amount: -120.00 },
    { id: 4, description: 'Coffee Shop', category: 'Food', date: '2026-10-20', amount: -15.75 },
    { id: 5, description: 'Netflix Subscription', category: 'Entertainment', date: '2026-10-19', amount: -15.99 },
    { id: 6, description: 'Gas Station', category: 'Transport', date: '2026-10-18', amount: -45.00 },
    { id: 7, description: 'Freelance Payment', category: 'Income', date: '2026-10-17', amount: 750.00 },
    { id: 8, description: 'Restaurant', category: 'Food', date: '2026-10-16', amount: -62.30 },
    { id: 9, description: 'Internet Bill', category: 'Utilities', date: '2026-10-15', amount: -79.99 },
    { id: 10, description: 'Pharmacy', category: 'Health', date: '2026-10-14', amount: -28.50 },
  ];

  const formatAmount = (amount) => {
    const formatted = Math.abs(amount).toFixed(2);
    return amount >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (amount) => {
    return amount >= 0 ? '#10b981' : '#ef4444';
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recent Transactions</h2>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>Description</th>
              <th style={styles.headerCell}>Category</th>
              <th style={styles.headerCell}>Date</th>
              <th style={styles.headerCell}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} style={styles.row}>
                <td style={styles.cell}>{transaction.description}</td>
                <td style={styles.cell}>
                  <span style={styles.category}>{transaction.category}</span>
                </td>
                <td style={styles.cell}>{transaction.date}</td>
                <td style={{ ...styles.cell, ...styles.amountCell }}>
                  <span style={{ color: getAmountColor(transaction.amount), fontWeight: '600' }}>
                    {formatAmount(transaction.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    borderBottom: '2px solid #e2e8f0',
  },
  headerCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  row: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s ease',
  },
  cell: {
    padding: '16px',
    fontSize: '15px',
    color: '#334155',
  },
  category: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
  },
  amountCell: {
    textAlign: 'right',
  },
};

export default TransactionsTable;

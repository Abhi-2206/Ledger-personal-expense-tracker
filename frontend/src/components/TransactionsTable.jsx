import React from 'react';

function TransactionsTable({ transactions, onEdit, onDelete, onAdd }) {
  const formatAmount = (amount) => {
    const formatted = Math.abs(amount).toFixed(2);
    return amount >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (amount) => {
    return amount >= 0 ? '#10b981' : '#ef4444';
  };

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentTransactions = sortedTransactions.slice(0, 10);


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Recent Transactions</h2>
        <button onClick={onAdd} style={styles.addButton}>
          + Add Transaction
        </button>
      </div>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>Description</th>
              <th style={styles.headerCell}>Category</th>
              <th style={styles.headerCell}>Date</th>
              <th style={styles.headerCell}>Amount</th>
              <th style={styles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.emptyCell}>
                  No transactions yet. Click "Add Transaction" to get started.
                </td>
              </tr>
            ) : (
              recentTransactions.map((transaction) => (
                <tr key={transaction.id} style={styles.row}>
                  <td style={styles.cell}>{transaction.title}</td>
                  <td style={styles.cell}>
                    <span style={styles.category}>{transaction.category}</span>
                  </td>
                  <td style={styles.cell}>{transaction.date}</td>
                  <td style={{ ...styles.cell, ...styles.amountCell }}>
                    <span style={{ color: getAmountColor(transaction.amount), fontWeight: '600' }}>
                      {formatAmount(transaction.amount)}
                    </span>
                  </td>
                  <td style={styles.actionsCell}>
                    <button
                      onClick={() => onEdit(transaction)}
                      style={styles.editButton}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      style={styles.deleteButton}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
  },
  addButton: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
  emptyCell: {
    padding: '32px',
    textAlign: 'center',
    fontSize: '15px',
    color: '#64748b',
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
  actionsCell: {
    padding: '16px',
    textAlign: 'right',
  },
  editButton: {
    padding: '6px 12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#475569',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px',
    transition: 'all 0.2s',
  },
  deleteButton: {
    padding: '6px 12px',
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default TransactionsTable;

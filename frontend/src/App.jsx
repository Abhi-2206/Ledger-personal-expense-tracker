import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SummaryCards from './components/SummaryCards';
import TransactionsTable from './components/TransactionsTable';
import TransactionForm from './components/TransactionForm';
import BudgetsPage from './components/BudgetsPage';
import SavingsGoalsPage from './components/SavingsGoalsPage';
import RecurringTransactionsPage from './components/RecurringTransactionsPage';
import ReportsPage from './components/ReportsPage';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load transactions on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      if (window.electronAPI && typeof window.electronAPI.getTransactions === 'function') {
        const data = await window.electronAPI.getTransactions();
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const success = await window.electronAPI.deleteTransaction(id);
      if (success) {
        if (editingTransaction && editingTransaction.id === id) {
          setEditingTransaction(null);
          setShowForm(false);
        }
        await loadTransactions();
      } else {
        alert('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction');
    }
  };

  const handleSaveTransaction = async (transactionData) => {
    try {
      if (editingTransaction) {
        // Update existing transaction
        const updated = await window.electronAPI.updateTransaction(
          editingTransaction.id,
          transactionData
        );
        if (updated) {
          await loadTransactions();
          setShowForm(false);
          setEditingTransaction(null);
        } else {
          alert('Failed to update transaction');
        }
      } else {
        // Add new transaction
        const added = await window.electronAPI.addTransaction(transactionData);
        if (added) {
          await loadTransactions();
          setShowForm(false);
          setEditingTransaction(null);
        } else {
          alert('Failed to add transaction');
        }
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  return (
    <div style={styles.app}>
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main style={styles.main}>
        {activePage === 'dashboard' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            {loading ? (
              <p style={styles.placeholderText}>Loading...</p>
            ) : (
              <>
                <SummaryCards transactions={transactions} />
                <TransactionsTable
                  transactions={transactions}
                  onAdd={handleAddTransaction}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  isDashboard={true}
                />
              </>
            )}
          </div>
        )}
        {activePage === 'transactions' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Transactions</h1>
            {loading ? (
              <p style={styles.placeholderText}>Loading...</p>
            ) : (
              <TransactionsTable
                transactions={transactions}
                onAdd={handleAddTransaction}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                isDashboard={false}
              />
            )}
          </div>
        )}
        {activePage === 'budgets' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Budgets</h1>
            <BudgetsPage transactions={transactions} />
          </div>
        )}
        {activePage === 'savings-goals' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Savings Goals</h1>
            <SavingsGoalsPage />
          </div>
        )}
        {activePage === 'recurring' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Recurring Transactions</h1>
            <RecurringTransactionsPage onRefreshTransactions={loadTransactions} />
          </div>
        )}
        {activePage === 'reports' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Reports</h1>
            <ReportsPage transactions={transactions} />
          </div>
        )}
      </main>

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    width: '100%',
    height: '100vh',
    backgroundColor: 'var(--bg-app)',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 36px',
  },
  content: {
    maxWidth: '1160px',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
    margin: '0 0 24px 0',
  },
  placeholderText: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    padding: '32px 0',
  },
};

export default App;

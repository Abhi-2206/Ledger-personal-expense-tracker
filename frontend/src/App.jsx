import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import SummaryCards from './components/SummaryCards';
import TransactionsTable from './components/TransactionsTable';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div style={styles.app}>
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main style={styles.main}>
        {activePage === 'dashboard' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <SummaryCards />
            <TransactionsTable />
          </div>
        )}
        {activePage === 'transactions' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Transactions</h1>
            <p style={styles.placeholderText}>Transactions page coming soon</p>
          </div>
        )}
        {activePage === 'budgets' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Budgets</h1>
            <p style={styles.placeholderText}>Budgets page coming soon</p>
          </div>
        )}
        {activePage === 'reports' && (
          <div style={styles.content}>
            <h1 style={styles.pageTitle}>Reports</h1>
            <p style={styles.placeholderText}>Reports page coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    width: '100%',
    height: '100vh',
    backgroundColor: '#f8fafc',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: '32px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '32px',
  },
  placeholderText: {
    fontSize: '16px',
    color: '#64748b',
  },
};

export default App;

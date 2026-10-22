import React from 'react';

function App() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Ledger — Personal Expense Tracker</h1>
      <p style={styles.subtitle}>Track your expenses with ease</p>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: '2.5rem',
    color: '#333',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#666',
  },
};

export default App;

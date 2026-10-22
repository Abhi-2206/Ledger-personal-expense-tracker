import React from 'react';

function Sidebar({ activePage, onPageChange }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'budgets', label: 'Budgets', icon: '💰' },
    { id: 'reports', label: 'Reports', icon: '📈' },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <h2 style={styles.logoText}>Ledger</h2>
      </div>
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            style={
              activePage === item.id
                ? { ...styles.navItem, ...styles.navItemActive }
                : styles.navItem
            }
          >
            <span style={styles.icon}>{item.icon}</span>
            <span style={styles.label}>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '250px',
    height: '100vh',
    backgroundColor: '#1e293b',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #334155',
  },
  logo: {
    padding: '24px',
    borderBottom: '1px solid #334155',
  },
  logoText: {
    color: '#f8fafc',
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
  },
  nav: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  navItemActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  },
  icon: {
    fontSize: '20px',
  },
  label: {
    textAlign: 'left',
  },
};

export default Sidebar;

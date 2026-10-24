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
        <div style={styles.brandRow}>
          <span style={styles.brandIcon}>💎</span>
          <h2 style={styles.logoText}>Ledger</h2>
        </div>
        <p style={styles.brandSubtitle}>Expense Tracker</p>
      </div>
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={
                isActive
                  ? { ...styles.navItem, ...styles.navItemActive }
                  : styles.navItem
              }
            >
              <span style={styles.icon}>{item.icon}</span>
              <span style={styles.label}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    height: '100vh',
    flexShrink: 0,
    backgroundColor: '#1e293b',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #334155',
  },
  logo: {
    padding: '24px 20px 20px',
    borderBottom: '1px solid #334155',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandIcon: {
    fontSize: '20px',
    lineHeight: 1,
  },
  logoText: {
    color: '#f8fafc',
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.4px',
    margin: 0,
  },
  brandSubtitle: {
    color: '#64748b',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    margin: '4px 0 0 30px',
  },
  nav: {
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
    textAlign: 'left',
    width: '100%',
  },
  navItemActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
  },
  icon: {
    fontSize: '18px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
  },
  label: {
    flex: 1,
    textAlign: 'left',
  },
};

export default Sidebar;

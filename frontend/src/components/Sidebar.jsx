import React from 'react';
import { useTheme } from '../ThemeContext.jsx';

function Sidebar({ activePage, onPageChange }) {
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'budgets', label: 'Budgets', icon: '💰' },
    { id: 'savings-goals', label: 'Savings Goals', icon: '🎯' },
    { id: 'recurring', label: 'Recurring', icon: '🔄' },
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
      <div style={styles.themeToggleContainer}>
        <button
          onClick={toggleTheme}
          style={styles.themeToggle}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <span style={styles.themeIcon}>{theme === 'light' ? '🌙' : '☀️'}</span>
          <span style={styles.themeLabel}>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    height: '100vh',
    flexShrink: 0,
    backgroundColor: 'var(--bg-sidebar)',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--border-subtle)',
  },
  logo: {
    padding: '24px 20px 20px',
    borderBottom: '1px solid var(--border-subtle)',
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
    color: 'var(--text-primary)',
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.4px',
    margin: 0,
  },
  brandSubtitle: {
    color: 'var(--text-muted)',
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
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
    textAlign: 'left',
    width: '100%',
  },
  navItemActive: {
    backgroundColor: 'var(--color-primary) !important',
    color: '#ffffff !important',
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
  themeToggleContainer: {
    padding: '16px 12px',
    borderTop: '1px solid var(--border-subtle)',
  },
  themeToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-body)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  themeIcon: {
    fontSize: '18px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: {
    flex: 1,
    textAlign: 'left',
  },
};

export default Sidebar;

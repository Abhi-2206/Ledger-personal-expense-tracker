import React, { useState, useMemo } from 'react';

function TransactionsTable({
  transactions = [],
  onEdit,
  onDelete,
  onAdd,
  isDashboard = false,
  showFilters = !isDashboard,
  title,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toFixed(2);
    return num >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (amount) => {
    const num = parseFloat(amount) || 0;
    return num >= 0 ? '#10b981' : '#ef4444';
  };

  const txList = Array.isArray(transactions) ? transactions : [];

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    startDate ||
    endDate
  );

  const categoriesList = useMemo(() => {
    const defaultCategories = [
      'Food',
      'Transport',
      'Utilities',
      'Entertainment',
      'Health',
      'Shopping',
      'Salary',
      'Freelance',
      'Investment',
      'Gift',
      'Other',
    ];
    const set = new Set(defaultCategories);
    txList.forEach((t) => {
      if (t && t.category && typeof t.category === 'string' && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [txList]);

  const filteredTransactions = useMemo(() => {
    // Sort transactions latest first (by date, tie-breaking by createdAt/id)
    const sorted = [...txList].sort((a, b) => {
      const dateB = b && b.date ? new Date(b.date).getTime() : 0;
      const dateA = a && a.date ? new Date(a.date).getTime() : 0;
      const dateDiff = dateB - dateA;
      if (dateDiff !== 0) return dateDiff;
      const createdB = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const createdA = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdDiff = createdB - createdA;
      if (createdDiff !== 0) return createdDiff;
      return (b?.id || 0) - (a?.id || 0);
    });

    if (isDashboard || !showFilters) {
      return sorted.slice(0, 10);
    }

    const query = searchTerm.trim().toLowerCase();
    const effectiveStart = startDate && endDate && startDate > endDate ? endDate : startDate;
    const effectiveEnd = startDate && endDate && startDate > endDate ? startDate : endDate;

    return sorted.filter((t) => {
      if (!t) return false;

      // 1. Search filter: title and description (and notes)
      if (query) {
        const titleText = (t.title || '').toLowerCase();
        const descText = (t.description || '').toLowerCase();
        const notesText = (t.notes || '').toLowerCase();
        const matchesQuery =
          titleText.includes(query) ||
          descText.includes(query) ||
          notesText.includes(query);
        if (!matchesQuery) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        const cat = (t.category || '').toLowerCase();
        if (cat !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Transaction type filter
      if (selectedType !== 'all') {
        const amount = parseFloat(t.amount) || 0;
        const isIncome = t.type === 'income' || (!t.type && amount > 0);
        const isExpense = t.type === 'expense' || (!t.type && amount < 0);

        if (selectedType === 'income' && !isIncome) {
          return false;
        }
        if (selectedType === 'expense' && !isExpense) {
          return false;
        }
      }

      // 4. Date range filter (boundary dates inclusive)
      if (effectiveStart || effectiveEnd) {
        const txDate = t.date ? t.date.trim() : '';
        if (!txDate) return false;

        if (effectiveStart && txDate < effectiveStart) {
          return false;
        }
        if (effectiveEnd && txDate > effectiveEnd) {
          return false;
        }
      }

      return true;
    });
  }, [txList, isDashboard, showFilters, searchTerm, selectedCategory, selectedType, startDate, endDate]);

  const displayTitle = title || (isDashboard ? 'Recent Transactions' : 'All Transactions');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{displayTitle}</h2>
        <button onClick={onAdd} style={styles.addButton}>
          + Add Transaction
        </button>
      </div>

      {showFilters && (
        <div style={styles.filterSection}>
          <div style={styles.searchRow}>
            <div style={styles.searchInputContainer}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search transactions by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={styles.clearSearchButton}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={styles.resetButton}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div style={styles.filtersRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div style={styles.resultsCount}>
              Showing {filteredTransactions.length} of {txList.length} transaction{txList.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      )}

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
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.emptyCell}>
                  {hasActiveFilters ? (
                    <div>
                      <p style={{ margin: '0 0 12px 0' }}>
                        No transactions match your search or filter criteria.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        style={styles.resetInlineButton}
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    'No transactions yet. Click "Add Transaction" to get started.'
                  )}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id} style={styles.row}>
                  <td style={styles.cell}>{transaction.title || transaction.description || 'Untitled'}</td>
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
  filterSection: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  searchRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchInputContainer: {
    flex: '1 1 240px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '14px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '9px 36px 9px 36px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  clearSearchButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
  },
  resetButton: {
    padding: '9px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  filtersRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1 1 140px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#334155',
    backgroundColor: '#ffffff',
    outline: 'none',
    height: '38px',
    boxSizing: 'border-box',
  },
  dateInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#334155',
    backgroundColor: '#ffffff',
    outline: 'none',
    height: '38px',
    boxSizing: 'border-box',
  },
  resultsCount: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '2px',
  },
  resetInlineButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
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

import React, { useState, useMemo } from 'react';

function TransactionsTable({
  transactions = [],
  onEdit,
  onDelete,
  onAdd,
  onExport,
  isDashboard = false,
  showFilters = !isDashboard,
  title,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const txList = Array.isArray(transactions) ? transactions : [];

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportStatus(null);

    try {
      if (typeof onExport === 'function') {
        const customResult = await onExport();
        if (customResult && typeof customResult === 'object') {
          if (customResult.canceled) {
            return;
          }
          if (customResult.success) {
            const fileLabel = customResult.filename || customResult.filePath || 'CSV file';
            const emptyNotice = txList.length === 0 ? ' (empty list with headers)' : '';
            setExportStatus({
              type: 'success',
              message: `Successfully exported transactions${emptyNotice} to ${fileLabel}.`,
            });
            return;
          }
          if (customResult.error) {
            setExportStatus({
              type: 'error',
              message: customResult.error,
            });
            return;
          }
        }
        return;
      }

      if (!window.electronAPI || typeof window.electronAPI.exportTransactionsCSV !== 'function') {
        setExportStatus({
          type: 'error',
          message: 'CSV Export is unavailable in this environment.',
        });
        return;
      }

      // Export all saved transactions
      const result = await window.electronAPI.exportTransactionsCSV(txList);

      if (!result) {
        setExportStatus({
          type: 'error',
          message: 'Export failed: No response received from system.',
        });
        return;
      }

      if (result.canceled) {
        // Normal user cancellation - do not show error or success
        return;
      }

      if (result.success) {
        const fileLabel = result.filename || result.filePath || 'CSV file';
        const emptyNotice = txList.length === 0 ? ' (empty list with headers)' : '';
        setExportStatus({
          type: 'success',
          message: `Successfully exported transactions${emptyNotice} to ${fileLabel}.`,
        });
      } else {
        setExportStatus({
          type: 'error',
          message: result.error || 'Failed to export CSV file.',
        });
      }
    } catch (err) {
      console.error('Error during CSV export:', err);
      setExportStatus({
        type: 'error',
        message: err.message || 'An unexpected error occurred while exporting.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toFixed(2);
    return num >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (amount) => {
    const num = parseFloat(amount) || 0;
    return num >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
  };

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
        <div style={styles.headerActions}>
          {!isDashboard && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn-secondary"
              style={isExporting ? { ...styles.exportButton, ...styles.exportButtonDisabled } : styles.exportButton}
              disabled={isExporting}
              title="Export all transactions to CSV"
            >
              <span style={styles.exportIcon}>📥</span>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
          <button onClick={onAdd} className="btn-primary" style={styles.addButton}>
            + Add Transaction
          </button>
        </div>
      </div>

      {exportStatus && (
        <div
          style={exportStatus.type === 'success' ? styles.successBanner : styles.errorBanner}
          role={exportStatus.type === 'error' ? 'alert' : 'status'}
        >
          <span>{exportStatus.message}</span>
          <button
            type="button"
            onClick={() => setExportStatus(null)}
            className="banner-dismiss-btn"
            style={styles.bannerCloseButton}
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

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
                className="btn-secondary"
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
                <tr key={transaction.id} className="ledger-table-row" style={styles.row}>
                  <td style={styles.cell}>{transaction.title || transaction.description || 'Untitled'}</td>
                  <td style={styles.cell}>
                    <span className="category-badge" style={styles.category}>{transaction.category}</span>
                  </td>
                  <td style={{ ...styles.cell, ...styles.dateCell }}>{transaction.date}</td>
                  <td style={{ ...styles.cell, ...styles.amountCell }}>
                    <span style={{ color: getAmountColor(transaction.amount), fontWeight: '600' }}>
                      {formatAmount(transaction.amount)}
                    </span>
                  </td>
                  <td style={styles.actionsCell}>
                    <button
                      onClick={() => onEdit(transaction)}
                      className="btn-action-edit"
                      style={styles.editButton}
                      title="Edit transaction"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      className="btn-delete"
                      style={styles.deleteButton}
                      title="Delete transaction"
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
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
    border: '1px solid var(--border-subtle)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  },
  addButton: {
    padding: '9px 18px',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--bg-surface)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  exportButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    border: '1px solid var(--border-input)',
    backgroundColor: 'var(--bg-surface)',
    color: '#334155',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  exportButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  exportIcon: {
    fontSize: '14px',
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  },
  bannerCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: 'inherit',
    cursor: 'pointer',
    padding: '0 4px',
    marginLeft: '12px',
    lineHeight: 1,
  },
  filterSection: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: 'var(--bg-app)',
    borderRadius: '10px',
    border: '1px solid var(--border-subtle)',
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
    height: '38px',
    padding: '8px 36px 8px 36px',
    borderRadius: '8px',
    border: '1px solid var(--border-input)',
    fontSize: '14px',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-surface)',
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
    height: '38px',
    padding: '8px 16px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-input)',
    borderRadius: '8px',
    color: 'var(--text-body)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
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
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-input)',
    fontSize: '14px',
    color: '#334155',
    backgroundColor: 'var(--bg-surface)',
    outline: 'none',
    height: '38px',
    boxSizing: 'border-box',
  },
  dateInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-input)',
    fontSize: '14px',
    color: '#334155',
    backgroundColor: 'var(--bg-surface)',
    outline: 'none',
    height: '38px',
    boxSizing: 'border-box',
  },
  resultsCount: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  resetInlineButton: {
    padding: '8px 16px',
    backgroundColor: 'var(--color-primary)',
    border: 'none',
    borderRadius: '8px',
    color: 'var(--bg-surface)',
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
    borderBottom: '1px solid var(--border-subtle)',
  },
  headerCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  row: {
    borderBottom: '1px solid #f1f5f9',
  },
  cell: {
    padding: '13px 16px',
    fontSize: '14px',
    color: '#1e293b',
  },
  dateCell: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  emptyCell: {
    padding: '40px 24px',
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  category: {
    backgroundColor: '#f1f5f9',
    color: 'var(--text-body)',
    padding: '3px 9px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  amountCell: {
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '14px',
  },
  actionsCell: {
    padding: '12px 16px',
    textAlign: 'right',
  },
  editButton: {
    padding: '5px 12px',
    border: '1px solid var(--border-input)',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-body)',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px',
    transition: 'all 0.15s ease',
  },
  deleteButton: {
    padding: '5px 12px',
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

export default TransactionsTable;

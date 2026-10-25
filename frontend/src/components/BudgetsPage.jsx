import React, { useState, useEffect, useCallback } from 'react';
import { calculateCategorySpending, formatCurrency } from '../budgetUtils';

// Expense categories — must match TransactionForm.jsx
const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
];

// ─── Status helpers ────────────────────────────────────────────────────────────

function getBudgetStatus(spent, budgeted) {
  if (spent > budgeted) return 'exceeded';
  if (budgeted > 0 && spent / budgeted >= 0.85) return 'warning'; // ≥ 85 % of budget
  return 'ok';
}

const STATUS_CONFIG = {
  exceeded: { color: '#ef4444', bgColor: '#fef2f2', label: 'Exceeded', barColor: '#ef4444' },
  warning:  { color: '#f59e0b', bgColor: '#fffbeb', label: 'Approaching', barColor: '#f59e0b' },
  ok:       { color: '#10b981', bgColor: '#ecfdf5', label: 'On track',   barColor: '#10b981' },
};

// ─── BudgetRow ─────────────────────────────────────────────────────────────────

function BudgetRow({ budget, transactions, year, month, onEdit, onDelete }) {
  const spent = calculateCategorySpending(transactions, budget.category, year, month);
  const remaining = budget.amount - spent;
  const status = getBudgetStatus(spent, budget.amount);
  const cfg = STATUS_CONFIG[status];
  const pct = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;

  return (
    <div className="interactive-card" style={styles.budgetCard}>
      <div style={styles.cardHeader}>
        <div className="category-badge" style={styles.categoryPill}>{budget.category}</div>
        <div style={{ ...styles.statusBadge, backgroundColor: cfg.bgColor, color: cfg.color }}>
          {cfg.label}
        </div>
        <div style={styles.cardActions}>
          <button
            onClick={() => onEdit(budget)}
            className="btn-action-edit"
            style={styles.editButton}
            title="Edit budget"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="btn-delete"
            style={styles.deleteButton}
            title="Delete budget"
          >
            Delete
          </button>
        </div>
      </div>

      <div style={styles.amountsRow}>
        <div style={styles.amountItem}>
          <span style={styles.amountLabel}>Budget</span>
          <span style={styles.amountValue}>{formatCurrency(budget.amount)}</span>
        </div>
        <div style={styles.amountItem}>
          <span style={styles.amountLabel}>Spent</span>
          <span style={{ ...styles.amountValue, color: spent > 0 ? '#ef4444' : '#64748b' }}>
            {formatCurrency(spent)}
          </span>
        </div>
        <div style={styles.amountItem}>
          <span style={styles.amountLabel}>Remaining</span>
          <span style={{ ...styles.amountValue, color: remaining < 0 ? '#ef4444' : '#10b981' }}>
            {remaining < 0 ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${pct}%`,
            backgroundColor: cfg.barColor,
          }}
        />
      </div>
      <div style={styles.progressLabels}>
        <span style={styles.progressPct}>{pct.toFixed(0)}% used</span>
        {status === 'exceeded' && (
          <span style={styles.overBudgetNote}>
            Over by {formatCurrency(spent - budget.amount)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── BudgetForm (inline, not modal) ────────────────────────────────────────────

function BudgetForm({ existingBudgets, editingBudget, onSave, onCancel, isSubmitting }) {
  const [category, setCategory] = useState(editingBudget ? editingBudget.category : '');
  const [amount, setAmount] = useState(editingBudget ? String(editingBudget.amount) : '');
  const [errors, setErrors] = useState({});

  // When switching editing target, refresh form fields
  useEffect(() => {
    setCategory(editingBudget ? editingBudget.category : '');
    setAmount(editingBudget ? String(editingBudget.amount) : '');
    setErrors({});
  }, [editingBudget]);

  const usedCategories = existingBudgets
    .filter((b) => !editingBudget || b.id !== editingBudget.id)
    .map((b) => b.category);

  const availableCategories = EXPENSE_CATEGORIES.filter(
    (cat) => !usedCategories.includes(cat)
  );

  // When editing, the current category is always selectable
  const selectableCategories = editingBudget
    ? EXPENSE_CATEGORIES
    : availableCategories;

  function validate() {
    const errs = {};

    if (!category || !EXPENSE_CATEGORIES.includes(category)) {
      errs.category = 'Please select a valid expense category.';
    } else if (!editingBudget && usedCategories.includes(category)) {
      errs.category = `A budget for "${category}" already exists.`;
    }

    const num = parseFloat(amount);
    if (!amount || !Number.isFinite(num) || num <= 0) {
      errs.amount = 'Amount must be a number greater than zero.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave({ category, amount: parseFloat(amount) });
  }

  return (
    <div style={styles.formCard}>
      <h3 style={styles.formTitle}>
        {editingBudget ? `Edit Budget — ${editingBudget.category}` : 'New Monthly Budget'}
      </h3>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="budget-category">
              Expense Category *
            </label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors((p) => ({ ...p, category: '' }));
              }}
              style={errors.category ? { ...styles.select, ...styles.inputError } : styles.select}
              disabled={!!editingBudget} // category locked when editing
            >
              <option value="">Select category…</option>
              {selectableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <span style={styles.errorMsg}>{errors.category}</span>}
            {!editingBudget && availableCategories.length === 0 && (
              <span style={styles.infoMsg}>All categories already have a budget.</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="budget-amount">
              Monthly Budget Amount *
            </label>
            <input
              id="budget-amount"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((p) => ({ ...p, amount: '' }));
              }}
              style={errors.amount ? { ...styles.input, ...styles.inputError } : styles.input}
              placeholder="0.00"
              step="0.01"
              min="0.01"
            />
            {errors.amount && <span style={styles.errorMsg}>{errors.amount}</span>}
          </div>
        </div>

        <div style={styles.formButtons}>
          <button type="button" onClick={onCancel} className="btn-secondary" style={styles.cancelButton} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" style={styles.saveButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingBudget ? 'Update Budget' : 'Add Budget'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── BudgetsPage ───────────────────────────────────────────────────────────────

function BudgetsPage({ transactions }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');

  // Current month for spending calculation
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const loadBudgets = useCallback(async () => {
    try {
      if (window.electronAPI && typeof window.electronAPI.getBudgets === 'function') {
        const data = await window.electronAPI.getBudgets();
        setBudgets(Array.isArray(data) ? data : []);
      } else {
        setBudgets([]);
      }
    } catch (err) {
      console.error('Error loading budgets:', err);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleAddClick = () => {
    setEditingBudget(null);
    setPageError('');
    setShowForm(true);
  };

  const handleEditClick = (budget) => {
    setEditingBudget(budget);
    setPageError('');
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
    setPageError('');
  };

  const handleSave = async ({ category, amount }) => {
    setIsSubmitting(true);
    setPageError('');
    try {
      let result;
      if (editingBudget) {
        result = await window.electronAPI.updateBudget(editingBudget.id, { amount });
      } else {
        result = await window.electronAPI.addBudget({ category, amount });
      }

      if (result && result.success) {
        await loadBudgets();
        setShowForm(false);
        setEditingBudget(null);
      } else {
        setPageError((result && result.error) || 'Failed to save budget.');
      }
    } catch (err) {
      console.error('Error saving budget:', err);
      setPageError('An unexpected error occurred while saving the budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      const ok = await window.electronAPI.deleteBudget(id);
      if (ok) {
        await loadBudgets();
        // If user was editing the deleted budget, close the form
        if (editingBudget && (editingBudget.id === id || String(editingBudget.id) === String(id))) {
          setShowForm(false);
          setEditingBudget(null);
        }
      } else {
        setPageError('Failed to delete budget.');
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
      setPageError('An unexpected error occurred while deleting the budget.');
    }
  };

  if (loading) {
    return <p style={styles.placeholderText}>Loading budgets…</p>;
  }

  return (
    <div>
      {/* Month header + Add button */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.monthLabel}>Showing budgets for {monthLabel}</p>
        </div>
        {!showForm && (
          <button onClick={handleAddClick} className="btn-primary" style={styles.addButton} id="add-budget-btn">
            + Add Budget
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <BudgetForm
          existingBudgets={budgets}
          editingBudget={editingBudget}
          onSave={handleSave}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Page-level error */}
      {pageError && (
        <div style={styles.errorBanner} role="alert">
          {pageError}
        </div>
      )}

      {/* Empty state */}
      {budgets.length === 0 && !showForm && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>💰</div>
          <p style={styles.emptyTitle}>No budgets yet</p>
          <p style={styles.emptySubtitle}>
            Create a monthly budget for an expense category to start tracking your spending.
          </p>
          <button onClick={handleAddClick} className="btn-primary" style={styles.addButton}>
            + Add Your First Budget
          </button>
        </div>
      )}

      {/* Budget list */}
      {budgets.length > 0 && (
        <div style={styles.budgetList}>
          {budgets.map((budget) => (
            <BudgetRow
              key={budget.id}
              budget={budget}
              transactions={transactions}
              year={year}
              month={month}
              onEdit={handleEditClick}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  // Page layout
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  monthLabel: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  addButton: {
    padding: '9px 18px',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  placeholderText: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    padding: '32px 0',
  },

  // Empty state
  emptyState: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '48px 24px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--border-subtle)',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 8px 0',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '0 0 20px 0',
    maxWidth: '380px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  // Budget list
  budgetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  // Budget card
  budgetCard: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--border-subtle)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  categoryPill: {
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-body)',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardActions: {
    marginLeft: 'auto',
    display: 'flex',
    gap: '8px',
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
    transition: 'all 0.15s ease',
  },
  deleteButton: {
    padding: '5px 12px',
    border: '1px solid var(--color-danger-border)',
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger-hover)',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Amount row
  amountsRow: {
    display: 'flex',
    gap: '32px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },
  amountItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  amountLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  amountValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
    fontVariantNumeric: 'tabular-nums',
  },

  // Progress bar
  progressTrack: {
    height: '8px',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPct: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  overBudgetNote: {
    fontSize: '12px',
    color: 'var(--color-danger)',
    fontWeight: '600',
    fontVariantNumeric: 'tabular-nums',
  },

  // Form card
  formCard: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--border-subtle)',
    marginBottom: '24px',
  },
  formTitle: {
    margin: '0 0 18px 0',
    fontSize: '17px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: '1 1 200px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-body)',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid var(--border-input)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    height: '38px',
    boxSizing: 'border-box',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid var(--border-input)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    color: 'var(--text-primary)',
    height: '38px',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: 'var(--color-danger)',
  },
  errorMsg: {
    fontSize: '12px',
    color: 'var(--color-danger)',
  },
  infoMsg: {
    fontSize: '12px',
    color: 'var(--text-subtle)',
  },
  formButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '4px',
  },
  cancelButton: {
    padding: '9px 18px',
    border: '1px solid var(--border-input)',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-body)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  saveButton: {
    padding: '9px 18px',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Error banner
  errorBanner: {
    backgroundColor: 'var(--color-danger-light)',
    border: '1px solid var(--color-danger-border)',
    color: 'var(--color-danger-hover)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '16px',
    boxShadow: 'var(--shadow-xs)',
  },
};

export default BudgetsPage;

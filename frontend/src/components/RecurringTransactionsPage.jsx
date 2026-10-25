import React, { useState, useEffect, useCallback } from 'react';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

function formatFrequency(frequency) {
  const map = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };
  return map[frequency] || frequency;
}

// ─── RuleRow ─────────────────────────────────────────────────────────────────

function RuleRow({ rule, onEdit, onToggleStatus, onDelete }) {
  const signedAmount = rule.type === 'income' ? rule.amount : -rule.amount;
  const isIncome = rule.type === 'income';
  const isDueSoon = rule.nextDueDate && new Date(rule.nextDueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const isOverdue = rule.nextDueDate && new Date(rule.nextDueDate) < new Date();

  return (
    <div className="interactive-card" style={styles.ruleCard}>
      <div style={styles.cardHeader}>
        <div style={styles.ruleTitle}>{rule.title}</div>
        <div style={{ ...styles.typeBadge, backgroundColor: isIncome ? '#ecfdf5' : '#fef2f2', color: isIncome ? '#059669' : '#dc2626' }}>
          {isIncome ? 'Income' : 'Expense'}
        </div>
        <div style={{ ...styles.statusBadge, backgroundColor: rule.active ? '#eff6ff' : '#f1f5f9', color: rule.active ? 'var(--color-primary)' : 'var(--text-muted)' }}>
          {rule.active ? 'Active' : 'Paused'}
        </div>
        <div style={styles.cardActions}>
          <button
            onClick={() => onToggleStatus(rule.id)}
            className="btn-secondary"
            style={styles.toggleButton}
            title={rule.active ? 'Pause rule' : 'Resume rule'}
          >
            {rule.active ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => onEdit(rule)}
            className="btn-action-edit"
            style={styles.editButton}
            title="Edit rule"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="btn-delete"
            style={styles.deleteButton}
            title="Delete rule"
          >
            Delete
          </button>
        </div>
      </div>

      <div style={styles.detailsRow}>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Amount</span>
          <span style={{ ...styles.detailValue, color: isIncome ? '#059669' : '#dc2626' }}>
            {formatCurrency(signedAmount)}
          </span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Category</span>
          <span style={styles.detailValue}>{rule.category}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Frequency</span>
          <span style={styles.detailValue}>{formatFrequency(rule.frequency)}</span>
        </div>
      </div>

      <div style={styles.datesRow}>
        <div style={styles.dateItem}>
          <span style={styles.dateLabel}>Start Date:</span>
          <span style={styles.dateValue}>{formatDate(rule.startDate)}</span>
        </div>
        {rule.endDate && (
          <div style={styles.dateItem}>
            <span style={styles.dateLabel}>End Date:</span>
            <span style={styles.dateValue}>{formatDate(rule.endDate)}</span>
          </div>
        )}
        <div style={styles.dateItem}>
          <span style={styles.dateLabel}>Next Due:</span>
          <span style={{ ...styles.dateValue, color: isOverdue ? '#dc2626' : isDueSoon ? '#f59e0b' : 'var(--text-body)', fontWeight: isOverdue || isDueSoon ? '600' : '500' }}>
            {formatDate(rule.nextDueDate)}
            {isOverdue && ' (Overdue)'}
            {isDueSoon && !isOverdue && ' (Due Soon)'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── RuleForm (inline, not modal) ─────────────────────────────────────────────

function RuleForm({ editingRule, onSave, onCancel, isSubmitting }) {
  const [title, setTitle] = useState(editingRule ? editingRule.title : '');
  const [amount, setAmount] = useState(editingRule ? String(editingRule.amount) : '');
  const [type, setType] = useState(editingRule ? editingRule.type : 'expense');
  const [category, setCategory] = useState(editingRule ? editingRule.category : '');
  const [frequency, setFrequency] = useState(editingRule ? editingRule.frequency : 'monthly');
  const [startDate, setStartDate] = useState(editingRule ? editingRule.startDate : new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(editingRule ? (editingRule.endDate || '') : '');
  const [errors, setErrors] = useState({});

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
  };

  const frequencies = ['daily', 'weekly', 'monthly', 'yearly'];

  useEffect(() => {
    setTitle(editingRule ? editingRule.title : '');
    setAmount(editingRule ? String(editingRule.amount) : '');
    setType(editingRule ? editingRule.type : 'expense');
    setCategory(editingRule ? editingRule.category : '');
    setFrequency(editingRule ? editingRule.frequency : 'monthly');
    setStartDate(editingRule ? editingRule.startDate : new Date().toISOString().split('T')[0]);
    setEndDate(editingRule ? (editingRule.endDate || '') : '');
    setErrors({});
  }, [editingRule]);

  function validate() {
    const errs = {};

    if (!title || !title.trim()) {
      errs.title = 'Title is required.';
    }

    const num = parseFloat(amount);
    if (!amount || !Number.isFinite(num) || num <= 0) {
      errs.amount = 'Amount must be a number greater than zero.';
    }

    if (!category) {
      errs.category = 'Category is required.';
    }

    if (!startDate) {
      errs.startDate = 'Start date is required.';
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      errs.endDate = 'End date cannot be earlier than start date.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      title: title.trim(),
      amount: parseFloat(amount),
      type,
      category,
      frequency,
      startDate,
      endDate: endDate || null,
    });
  }

  return (
    <div style={styles.formCard}>
      <h3 style={styles.formTitle}>
        {editingRule ? `Edit Recurring Rule — ${editingRule.title}` : 'New Recurring Transaction'}
      </h3>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="rule-title">
              Title *
            </label>
            <input
              id="rule-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: '' }));
              }}
              style={errors.title ? { ...styles.input, ...styles.inputError } : styles.input}
              placeholder="e.g., Monthly Rent"
            />
            {errors.title && <span style={styles.errorMsg}>{errors.title}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="rule-amount">
              Amount *
            </label>
            <input
              id="rule-amount"
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

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="rule-type">
              Type *
            </label>
            <select
              id="rule-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCategory(''); // Reset category when type changes
                if (errors.category) setErrors((p) => ({ ...p, category: '' }));
              }}
              style={styles.select}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="rule-category">
              Category *
            </label>
            <select
              id="rule-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors((p) => ({ ...p, category: '' }));
              }}
              style={errors.category ? { ...styles.select, ...styles.inputError } : styles.select}
            >
              <option value="">Select category…</option>
              {categories[type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <span style={styles.errorMsg}>{errors.category}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="rule-frequency">
              Frequency *
            </label>
            <select
              id="rule-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={styles.select}
            >
              {frequencies.map((freq) => (
                <option key={freq} value={freq}>
                  {formatFrequency(freq)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="rule-start-date">
              Start Date *
            </label>
            <input
              id="rule-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (errors.startDate) setErrors((p) => ({ ...p, startDate: '' }));
                if (errors.endDate) setErrors((p) => ({ ...p, endDate: '' }));
              }}
              style={errors.startDate ? { ...styles.input, ...styles.inputError } : styles.input}
            />
            {errors.startDate && <span style={styles.errorMsg}>{errors.startDate}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="rule-end-date">
              End Date (optional)
            </label>
            <input
              id="rule-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (errors.endDate) setErrors((p) => ({ ...p, endDate: '' }));
              }}
              style={errors.endDate ? { ...styles.input, ...styles.inputError } : styles.input}
            />
            {errors.endDate && <span style={styles.errorMsg}>{errors.endDate}</span>}
          </div>
        </div>

        <div style={styles.formButtons}>
          <button type="button" onClick={onCancel} className="btn-secondary" style={styles.cancelButton} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" style={styles.saveButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingRule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── RecurringTransactionsPage ───────────────────────────────────────────────

function RecurringTransactionsPage({ onRefreshTransactions }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processResult, setProcessResult] = useState(null);

  const loadRules = useCallback(async () => {
    try {
      if (window.electronAPI && typeof window.electronAPI.getRecurringRules === 'function') {
        const data = await window.electronAPI.getRecurringRules();
        setRules(Array.isArray(data) ? data : []);
      } else {
        setRules([]);
      }
    } catch (err) {
      console.error('Error loading recurring rules:', err);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleAddClick = () => {
    setEditingRule(null);
    setPageError('');
    setShowForm(true);
  };

  const handleEditClick = (rule) => {
    setEditingRule(rule);
    setPageError('');
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRule(null);
    setPageError('');
  };

  const handleSave = async (ruleData) => {
    setIsSubmitting(true);
    setPageError('');
    try {
      let result;
      if (editingRule) {
        result = await window.electronAPI.updateRecurringRule(editingRule.id, ruleData);
      } else {
        result = await window.electronAPI.addRecurringRule(ruleData);
      }

      if (result && result.success) {
        await loadRules();
        setShowForm(false);
        setEditingRule(null);
        setSuccessMessage(editingRule ? 'Rule updated successfully.' : 'Rule created successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setPageError((result && result.error) || 'Failed to save rule.');
      }
    } catch (err) {
      console.error('Error saving rule:', err);
      setPageError('An unexpected error occurred while saving the rule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const result = await window.electronAPI.toggleRecurringRuleStatus(id);
      if (result && result.success) {
        await loadRules();
        setSuccessMessage(result.rule.active ? 'Rule activated.' : 'Rule paused.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setPageError((result && result.error) || 'Failed to toggle rule status.');
      }
    } catch (err) {
      console.error('Error toggling rule status:', err);
      setPageError('An unexpected error occurred while toggling the rule status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recurring rule? This action cannot be undone.')) return;
    try {
      const ok = await window.electronAPI.deleteRecurringRule(id);
      if (ok) {
        await loadRules();
        if (editingRule && (editingRule.id === id || String(editingRule.id) === String(id))) {
          setShowForm(false);
          setEditingRule(null);
        }
        setSuccessMessage('Rule deleted successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setPageError('Failed to delete rule.');
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
      setPageError('An unexpected error occurred while deleting the rule.');
    }
  };

  const handleProcessDue = async () => {
    setIsProcessing(true);
    setPageError('');
    setProcessResult(null);
    try {
      const result = await window.electronAPI.processDueTransactions();
      
      if (result && result.success) {
        await loadRules();
        setProcessResult(result);
        setSuccessMessage(`Processed ${result.processed} transaction(s) successfully.`);
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Refresh transactions in parent
        if (onRefreshTransactions) {
          onRefreshTransactions();
        }
      } else {
        setPageError((result && result.error) || 'Failed to process due transactions.');
      }
    } catch (err) {
      console.error('Error processing due transactions:', err);
      setPageError('An unexpected error occurred while processing due transactions.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <p style={styles.placeholderText}>Loading recurring transactions…</p>;
  }

  return (
    <div>
      {/* Page header + Add button */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.pageSubtitle}>Manage recurring income and expense rules</p>
        </div>
        <div style={styles.headerActions}>
          {!showForm && (
            <button
              onClick={handleProcessDue}
              className="btn-primary"
              style={styles.processButton}
              disabled={isProcessing}
              title="Generate transactions for due occurrences"
            >
              {isProcessing ? 'Processing…' : 'Process Due Transactions'}
            </button>
          )}
          {!showForm && (
            <button onClick={handleAddClick} className="btn-primary" style={styles.addButton} id="add-rule-btn">
              + New Rule
            </button>
          )}
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div style={styles.successBanner} role="status">
          {successMessage}
        </div>
      )}

      {/* Process result */}
      {processResult && processResult.processed > 0 && (
        <div style={styles.resultBanner} role="status">
          <strong>Processed {processResult.processed} transaction(s):</strong>
          <ul style={styles.resultList}>
            {processResult.transactions.map((tx) => (
              <li key={tx.id}>
                {tx.title} — {formatCurrency(tx.amount)} on {formatDate(tx.date)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rule form */}
      {showForm && (
        <RuleForm
          editingRule={editingRule}
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
      {rules.length === 0 && !showForm && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔄</div>
          <p style={styles.emptyTitle}>No recurring transactions yet</p>
          <p style={styles.emptySubtitle}>
            Create recurring rules for regular income or expenses to automate transaction tracking.
          </p>
          <button onClick={handleAddClick} className="btn-primary" style={styles.addButton}>
            + Create Your First Rule
          </button>
        </div>
      )}

      {/* Rules list */}
      {rules.length > 0 && (
        <div style={styles.ruleList}>
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onEdit={handleEditClick}
              onToggleStatus={handleToggleStatus}
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
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
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
  processButton: {
    padding: '9px 18px',
    border: 'none',
    backgroundColor: 'var(--color-success)',
    color: 'var(--bg-surface)',
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
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04)',
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

  // Rules list
  ruleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  // Rule card
  ruleCard: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04)',
    border: '1px solid var(--border-subtle)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  ruleTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    flex: 1,
    minWidth: '120px',
  },
  typeBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  toggleButton: {
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
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Details row
  detailsRow: {
    display: 'flex',
    gap: '32px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.2px',
  },

  // Dates row
  datesRow: {
    display: 'flex',
    gap: '24px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap',
  },
  dateItem: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: '13px',
    color: 'var(--text-body)',
    fontWeight: '600',
  },

  // Form card
  formCard: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04)',
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
  errorMsg: {
    fontSize: '12px',
    color: 'var(--color-danger)',
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
    color: 'var(--bg-surface)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Success banner
  successBanner: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#059669',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '16px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  },

  // Result banner
  resultBanner: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '16px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  },
  resultList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },

  // Error banner
  errorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '16px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  },
};

export default RecurringTransactionsPage;

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

// ─── GoalRow ───────────────────────────────────────────────────────────────────

function GoalRow({ goal, onEdit, onDelete, onAddContribution }) {
  const currentAmount = Number(goal.currentAmount) || 0;
  const targetAmount = Number(goal.targetAmount) || 0;
  const remaining = Math.max(targetAmount - currentAmount, 0);
  const percentage = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const isComplete = currentAmount >= targetAmount;
  const isOverfunded = currentAmount > targetAmount;

  const statusColor = isOverfunded ? '#8b5cf6' : isComplete ? 'var(--color-success)' : '#3b82f6';
  const statusLabel = isOverfunded ? 'Overfunded' : isComplete ? 'Completed' : 'In Progress';

  return (
    <div className="interactive-card" style={styles.goalCard}>
      <div style={styles.cardHeader}>
        <div style={styles.goalName}>{goal.name}</div>
        <div style={{ ...styles.statusBadge, backgroundColor: isComplete ? '#ecfdf5' : '#eff6ff', color: statusColor }}>
          {statusLabel}
        </div>
        <div style={styles.cardActions}>
          <button
            onClick={() => onAddContribution(goal)}
            className="btn-primary"
            style={styles.contributeButton}
            title="Add contribution"
          >
            + Add Contribution
          </button>
          <button
            onClick={() => onEdit(goal)}
            className="btn-action-edit"
            style={styles.editButton}
            title="Edit goal"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="btn-delete"
            style={styles.deleteButton}
            title="Delete goal"
          >
            Delete
          </button>
        </div>
      </div>

      <div style={styles.amountsRow}>
        <div style={styles.amountItem}>
          <span style={styles.amountLabel}>Target</span>
          <span style={styles.amountValue}>{formatCurrency(targetAmount)}</span>
        </div>
        <div style={styles.amountItem}>
          <span style={styles.amountLabel}>Saved</span>
          <span style={{ ...styles.amountValue, color: statusColor }}>
            {formatCurrency(currentAmount)}
          </span>
        </div>
        <div style={styles.amountItem}>
          <span style={styles.amountLabel}>Remaining</span>
          <span style={{ ...styles.amountValue, color: remaining === 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>
            {remaining === 0 ? 'Done' : formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${percentage}%`,
            backgroundColor: statusColor,
          }}
        />
      </div>
      <div style={styles.progressLabels}>
        <span style={styles.progressPct}>{percentage.toFixed(0)}% complete</span>
        {isOverfunded && (
          <span style={styles.overfundedNote}>
            Over by {formatCurrency(currentAmount - targetAmount)}
          </span>
        )}
      </div>

      {goal.targetDate && (
        <div style={styles.targetDateRow}>
          <span style={styles.targetDateLabel}>Target Date:</span>
          <span style={styles.targetDateValue}>{formatDate(goal.targetDate)}</span>
        </div>
      )}
    </div>
  );
}

// ─── GoalForm (inline, not modal) ──────────────────────────────────────────────

function GoalForm({ editingGoal, onSave, onCancel, isSubmitting }) {
  const [name, setName] = useState(editingGoal ? editingGoal.name : '');
  const [targetAmount, setTargetAmount] = useState(editingGoal ? String(editingGoal.targetAmount) : '');
  const [targetDate, setTargetDate] = useState(editingGoal ? (editingGoal.targetDate || '') : '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setName(editingGoal ? editingGoal.name : '');
    setTargetAmount(editingGoal ? String(editingGoal.targetAmount) : '');
    setTargetDate(editingGoal ? (editingGoal.targetDate || '') : '');
    setErrors({});
  }, [editingGoal]);

  function validate() {
    const errs = {};

    if (!name || !name.trim()) {
      errs.name = 'Goal name is required.';
    }

    const num = parseFloat(targetAmount);
    if (!targetAmount || !Number.isFinite(num) || num <= 0) {
      errs.targetAmount = 'Target amount must be a number greater than zero.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      targetDate: targetDate || null,
    });
  }

  return (
    <div style={styles.formCard}>
      <h3 style={styles.formTitle}>
        {editingGoal ? `Edit Goal — ${editingGoal.name}` : 'New Savings Goal'}
      </h3>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="goal-name">
              Goal Name *
            </label>
            <input
              id="goal-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: '' }));
              }}
              style={errors.name ? { ...styles.input, ...styles.inputError } : styles.input}
              placeholder="e.g., Emergency Fund"
            />
            {errors.name && <span style={styles.errorMsg}>{errors.name}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="goal-target-amount">
              Target Amount *
            </label>
            <input
              id="goal-target-amount"
              type="number"
              value={targetAmount}
              onChange={(e) => {
                setTargetAmount(e.target.value);
                if (errors.targetAmount) setErrors((p) => ({ ...p, targetAmount: '' }));
              }}
              style={errors.targetAmount ? { ...styles.input, ...styles.inputError } : styles.input}
              placeholder="0.00"
              step="0.01"
              min="0.01"
            />
            {errors.targetAmount && <span style={styles.errorMsg}>{errors.targetAmount}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="goal-target-date">
              Target Date (optional)
            </label>
            <input
              id="goal-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.formButtons}>
          <button type="button" onClick={onCancel} className="btn-secondary" style={styles.cancelButton} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" style={styles.saveButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingGoal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── ContributionForm (inline, not modal) ───────────────────────────────────────

function ContributionForm({ goal, onSave, onCancel, isSubmitting }) {
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setAmount('');
    setErrors({});
  }, [goal]);

  function validate() {
    const errs = {};

    const num = parseFloat(amount);
    if (!amount || !Number.isFinite(num) || num <= 0) {
      errs.amount = 'Contribution amount must be a number greater than zero.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave(parseFloat(amount));
  }

  return (
    <div style={styles.formCard}>
      <h3 style={styles.formTitle}>Add Contribution — {goal.name}</h3>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel} htmlFor="contribution-amount">
              Contribution Amount *
            </label>
            <input
              id="contribution-amount"
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
              autoFocus
            />
            {errors.amount && <span style={styles.errorMsg}>{errors.amount}</span>}
          </div>
        </div>

        <div style={styles.formButtons}>
          <button type="button" onClick={onCancel} className="btn-secondary" style={styles.cancelButton} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" style={styles.saveButton} disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add Contribution'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── SavingsGoalsPage ─────────────────────────────────────────────────────────

function SavingsGoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadGoals = useCallback(async () => {
    try {
      if (window.electronAPI && typeof window.electronAPI.getGoals === 'function') {
        const data = await window.electronAPI.getGoals();
        setGoals(Array.isArray(data) ? data : []);
      } else {
        setGoals([]);
      }
    } catch (err) {
      console.error('Error loading goals:', err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleAddClick = () => {
    setEditingGoal(null);
    setPageError('');
    setShowForm(true);
  };

  const handleEditClick = (goal) => {
    setEditingGoal(goal);
    setPageError('');
    setShowForm(true);
  };

  const handleAddContributionClick = (goal) => {
    setContributingGoal(goal);
    setPageError('');
    setShowContributionForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowContributionForm(false);
    setEditingGoal(null);
    setContributingGoal(null);
    setPageError('');
  };

  const handleSaveGoal = async (goalData) => {
    setIsSubmitting(true);
    setPageError('');
    try {
      let result;
      if (editingGoal) {
        result = await window.electronAPI.updateGoal(editingGoal.id, goalData);
      } else {
        result = await window.electronAPI.addGoal(goalData);
      }

      if (result && result.success) {
        await loadGoals();
        setShowForm(false);
        setEditingGoal(null);
        setSuccessMessage(editingGoal ? 'Goal updated successfully.' : 'Goal created successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setPageError((result && result.error) || 'Failed to save goal.');
      }
    } catch (err) {
      console.error('Error saving goal:', err);
      setPageError('An unexpected error occurred while saving the goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveContribution = async (amount) => {
    setIsSubmitting(true);
    setPageError('');
    try {
      const result = await window.electronAPI.addGoalContribution(contributingGoal.id, amount);

      if (result && result.success) {
        await loadGoals();
        setShowContributionForm(false);
        setContributingGoal(null);
        setSuccessMessage(`Contribution of ${formatCurrency(amount)} added successfully.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setPageError((result && result.error) || 'Failed to add contribution.');
      }
    } catch (err) {
      console.error('Error adding contribution:', err);
      setPageError('An unexpected error occurred while adding the contribution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) return;
    try {
      const ok = await window.electronAPI.deleteGoal(id);
      if (ok) {
        await loadGoals();
        if (editingGoal && (editingGoal.id === id || String(editingGoal.id) === String(id))) {
          setShowForm(false);
          setEditingGoal(null);
        }
        if (contributingGoal && (contributingGoal.id === id || String(contributingGoal.id) === String(id))) {
          setShowContributionForm(false);
          setContributingGoal(null);
        }
      } else {
        setPageError('Failed to delete goal.');
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
      setPageError('An unexpected error occurred while deleting the goal.');
    }
  };

  if (loading) {
    return <p style={styles.placeholderText}>Loading savings goals…</p>;
  }

  return (
    <div>
      {/* Page header + Add button */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.pageSubtitle}>Track your savings goals and contributions</p>
        </div>
        {!showForm && !showContributionForm && (
          <button onClick={handleAddClick} className="btn-primary" style={styles.addButton} id="add-goal-btn">
            + New Goal
          </button>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div style={styles.successBanner} role="status">
          {successMessage}
        </div>
      )}

      {/* Goal form */}
      {showForm && (
        <GoalForm
          editingGoal={editingGoal}
          onSave={handleSaveGoal}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Contribution form */}
      {showContributionForm && (
        <ContributionForm
          goal={contributingGoal}
          onSave={handleSaveContribution}
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
      {goals.length === 0 && !showForm && !showContributionForm && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🎯</div>
          <p style={styles.emptyTitle}>No savings goals yet</p>
          <p style={styles.emptySubtitle}>
            Create a savings goal to start tracking your progress toward your financial targets.
          </p>
          <button onClick={handleAddClick} className="btn-primary" style={styles.addButton}>
            + Create Your First Goal
          </button>
        </div>
      )}

      {/* Goals list */}
      {goals.length > 0 && (
        <div style={styles.goalList}>
          {goals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              onEdit={handleEditClick}
              onDelete={handleDelete}
              onAddContribution={handleAddContributionClick}
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
  pageSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-muted)',
    fontWeight: '500',
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

  // Goals list
  goalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  // Goal card
  goalCard: {
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
  goalName: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    flex: 1,
    minWidth: '120px',
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
  contributeButton: {
    padding: '5px 12px',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--bg-surface)',
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
    backgroundColor: '#f1f5f9',
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
  overfundedNote: {
    fontSize: '12px',
    color: '#8b5cf6',
    fontWeight: '600',
    fontVariantNumeric: 'tabular-nums',
  },

  // Target date row
  targetDateRow: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  targetDateLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  targetDateValue: {
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

export default SavingsGoalsPage;

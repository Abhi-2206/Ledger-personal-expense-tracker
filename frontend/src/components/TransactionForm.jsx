import React, { useState, useEffect } from 'react';

function TransactionForm({ transaction, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title || '',
        amount: transaction.amount ? Math.abs(transaction.amount).toString() : '',
        type: transaction.amount >= 0 ? 'income' : 'expense',
        category: transaction.category || '',
        date: transaction.date || new Date().toISOString().split('T')[0],
        notes: transaction.notes || '',
      });
    }
  }, [transaction]);

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const amount = parseFloat(formData.amount);
    const signedAmount = formData.type === 'income' ? amount : -amount;

    const transactionData = {
      title: formData.title.trim(),
      amount: signedAmount,
      category: formData.category,
      date: formData.date,
      notes: formData.notes.trim(),
    };

    onSave(transactionData);
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h2 style={styles.title}>
          {transaction ? 'Edit Transaction' : 'Add New Transaction'}
        </h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={errors.title ? { ...styles.input, ...styles.inputError } : styles.input}
              placeholder="e.g., Grocery shopping"
            />
            {errors.title && <span style={styles.error}>{errors.title}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Amount *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              style={errors.amount ? { ...styles.input, ...styles.inputError } : styles.input}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            {errors.amount && <span style={styles.error}>{errors.amount}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Type *</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={handleChange}
                  style={styles.radio}
                />
                Income
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={handleChange}
                  style={styles.radio}
                />
                Expense
              </label>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={errors.category ? { ...styles.select, ...styles.inputError } : styles.select}
            >
              <option value="">Select category</option>
              {categories[formData.type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span style={styles.error}>{errors.category}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              style={errors.date ? { ...styles.input, ...styles.inputError } : styles.input}
            />
            {errors.date && <span style={styles.error}>{errors.date}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Notes (optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Additional details..."
              rows="3"
            />
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={styles.saveButton}
            >
              {transaction ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '28px 32px',
    width: '90%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-body)',
  },
  input: {
    padding: '9px 12px',
    border: '1px solid var(--border-input)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-surface)',
  },
  inputError: {
    borderColor: 'var(--color-danger)',
  },
  select: {
    padding: '9px 12px',
    border: '1px solid var(--border-input)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
  },
  textarea: {
    padding: '9px 12px',
    border: '1px solid var(--border-input)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
  },
  error: {
    fontSize: '12px',
    color: 'var(--color-danger)',
  },
  radioGroup: {
    display: 'flex',
    gap: '24px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#334155',
    cursor: 'pointer',
  },
  radio: {
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '6px',
  },
  cancelButton: {
    flex: 1,
    padding: '10px 20px',
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
    flex: 1,
    padding: '10px 20px',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--bg-surface)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

export default TransactionForm;

import React, { useState, useMemo } from 'react';
import { calculateFinancialSummary } from './SummaryCards';
import { formatCurrency } from '../budgetUtils';

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Return the 'YYYY-MM' string for today, used as the default month value
 * for the native <input type="month"> control.
 * Builds purely from local-date parts to avoid any UTC offset shifting.
 */
function todayMonthValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Parse a 'YYYY-MM' string into { year: number, month: number } (1-based).
 * Returns null for invalid input.
 */
function parseMonthValue(value) {
  if (!value || typeof value !== 'string') return null;
  const [ys, ms] = value.split('-');
  const year = parseInt(ys, 10);
  const month = parseInt(ms, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

/**
 * Filter transactions to only those within the given calendar month.
 * Safe against missing / malformed dates — those transactions are excluded.
 * Does NOT mutate the input array.
 *
 * @param {Array}  transactions  All transactions from state
 * @param {string} monthValue    'YYYY-MM'
 * @returns {Array}
 */
function filterToMonth(transactions, monthValue) {
  if (!Array.isArray(transactions) || !monthValue) return [];
  const prefix = `${monthValue}-`; // e.g. '2026-10-'
  return transactions.filter((t) => {
    if (!t) return false;
    const d = (t.date || '').trim();
    // d must start with 'YYYY-MM-' AND have at least one more character (the day)
    return d.startsWith(prefix) && d.length > prefix.length;
  });
}

/**
 * Build a category breakdown from a list of expense transactions.
 * Returns an array sorted descending by amount:
 *   [{ category, amount, percentage }]
 */
function buildCategoryBreakdown(expenseTransactions, totalExpenses) {
  const map = {};
  expenseTransactions.forEach((t) => {
    if (!t) return;
    const cat = (t.category || 'Uncategorised').trim();
    const amount = parseFloat(t.amount) || 0;
    map[cat] = (map[cat] || 0) + Math.abs(amount);
  });

  return Object.entries(map)
    .map(([category, amount]) => ({
      category,
      amount,
      // Guard against division by zero; clamp to [0, 100]
      percentage: totalExpenses > 0
        ? Math.min(100, Math.max(0, (amount / totalExpenses) * 100))
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Human-readable label for a 'YYYY-MM' value, e.g. "October 2026".
 */
function monthLabel(value) {
  const parsed = parseMonthValue(value);
  if (!parsed) return value;
  // Build a Date at noon local time on the 1st to avoid any DST edge cases
  const d = new Date(parsed.year, parsed.month - 1, 1, 12);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ title, value, icon, color, bgColor }) {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.iconContainer, backgroundColor: bgColor }}>
        <span style={styles.cardIcon}>{icon}</span>
      </div>
      <div style={styles.cardContent}>
        <p style={styles.cardTitle}>{title}</p>
        <p style={{ ...styles.cardValue, color }}>{value}</p>
      </div>
    </div>
  );
}

function CategoryBar({ category, amount, percentage }) {
  return (
    <div style={styles.categoryRow}>
      <div style={styles.catLabelRow}>
        <span style={styles.catName}>{category}</span>
        <span style={styles.catAmount}>{formatCurrency(amount)}</span>
        <span style={styles.catPct}>{percentage.toFixed(1)}%</span>
      </div>
      <div style={styles.barTrack}>
        <div
          style={{
            ...styles.barFill,
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

// ─── ReportsPage ──────────────────────────────────────────────────────────────

function ReportsPage({ transactions }) {
  const [selectedMonth, setSelectedMonth] = useState(todayMonthValue);

  // ── 1. Filter to selected month ───────────────────────────────────────────
  const monthTransactions = useMemo(
    () => filterToMonth(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  // ── 2. Monthly summary (reuse existing utility from SummaryCards.jsx) ─────
  const summary = useMemo(
    () => calculateFinancialSummary(monthTransactions),
    [monthTransactions]
  );

  // ── 3. Expense-only transactions for this month ───────────────────────────
  const expenseTransactions = useMemo(
    () =>
      monthTransactions.filter((t) => {
        if (!t) return false;
        const amount = parseFloat(t.amount) || 0;
        return t.type === 'expense' || (!t.type && amount < 0);
      }),
    [monthTransactions]
  );

  // ── 4. Category breakdown ─────────────────────────────────────────────────
  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(expenseTransactions, summary.numericExpenses),
    [expenseTransactions, summary.numericExpenses]
  );

  // ── render ────────────────────────────────────────────────────────────────
  const netIsNegative = summary.numericBalance < 0;
  const netFormatted = netIsNegative
    ? `-${formatCurrency(Math.abs(summary.numericBalance))}`
    : formatCurrency(summary.numericBalance);

  return (
    <div>
      {/* ── Month selector ── */}
      <div style={styles.monthSelectorRow}>
        <label htmlFor="report-month" style={styles.monthLabel}>
          Reporting month
        </label>
        <input
          id="report-month"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={styles.monthInput}
          max={todayMonthValue()}
        />
        <span style={styles.monthDisplay}>{monthLabel(selectedMonth)}</span>
      </div>

      {/* ── Summary cards ── */}
      <div style={styles.cardsGrid}>
        <SummaryCard
          title="Monthly Income"
          value={`$${summary.income}`}
          icon="📈"
          color="#10b981"
          bgColor="#ecfdf5"
        />
        <SummaryCard
          title="Monthly Expenses"
          value={`$${summary.expenses}`}
          icon="📉"
          color="#ef4444"
          bgColor="#fef2f2"
        />
        <SummaryCard
          title="Net Balance"
          value={netFormatted}
          icon="💳"
          color={netIsNegative ? '#ef4444' : '#3b82f6'}
          bgColor={netIsNegative ? '#fef2f2' : '#eff6ff'}
        />
      </div>

      {/* ── Category breakdown ── */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Expenses by Category</h2>
          {categoryBreakdown.length > 0 && (
            <span style={styles.totalChip}>
              Total: {formatCurrency(summary.numericExpenses)}
            </span>
          )}
        </div>

        {categoryBreakdown.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <p style={styles.emptyTitle}>No expenses for {monthLabel(selectedMonth)}</p>
            <p style={styles.emptySubtitle}>
              Add expense transactions for this month to see a breakdown here.
            </p>
          </div>
        ) : (
          <div style={styles.breakdownList}>
            {categoryBreakdown.map(({ category, amount, percentage }) => (
              <CategoryBar
                key={category}
                category={category}
                amount={amount}
                percentage={percentage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = {
  // Month selector
  monthSelectorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
    flexWrap: 'wrap',
  },
  monthLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  monthInput: {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
  },
  monthDisplay: {
    fontSize: '15px',
    color: '#64748b',
    fontWeight: '500',
  },

  // Summary cards grid — matches SummaryCards.jsx layout
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  iconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIcon: {
    fontSize: '28px',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  cardValue: {
    margin: '4px 0 0 0',
    fontSize: '24px',
    fontWeight: '700',
  },

  // Section
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
  },
  totalChip: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
  },

  // Category breakdown list
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // Individual category row
  categoryRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  catLabelRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  catName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  catAmount: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ef4444',
    whiteSpace: 'nowrap',
  },
  catPct: {
    fontSize: '13px',
    color: '#94a3b8',
    width: '44px',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  barTrack: {
    height: '10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: '5px',
    transition: 'width 0.3s ease',
    minWidth: 0,
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '40px 24px',
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    maxWidth: '360px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};

export default ReportsPage;

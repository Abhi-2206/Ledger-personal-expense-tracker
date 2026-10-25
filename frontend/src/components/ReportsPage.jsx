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
    <div className="interactive-card" style={styles.card}>
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
          color="var(--color-success)"
          bgColor="var(--color-success-light)"
        />
        <SummaryCard
          title="Monthly Expenses"
          value={`$${summary.expenses}`}
          icon="📉"
          color="var(--color-danger)"
          bgColor="var(--color-danger-light)"
        />
        <SummaryCard
          title="Net Balance"
          value={netFormatted}
          icon="💳"
          color={netIsNegative ? 'var(--color-danger)' : 'var(--color-primary)'}
          bgColor={netIsNegative ? 'var(--color-danger-light)' : 'var(--color-primary-light)'}
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
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  monthLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  monthInput: {
    height: '38px',
    padding: '8px 12px',
    border: '1px solid var(--border-input)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-surface)',
    outline: 'none',
    cursor: 'pointer',
  },
  monthDisplay: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },

  // Summary cards grid — matches SummaryCards.jsx layout
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  card: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
    border: '1px solid var(--border-subtle)',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIcon: {
    fontSize: '22px',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardValue: {
    margin: '3px 0 0 0',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
    fontVariantNumeric: 'tabular-nums',
  },

  // Section
  section: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04)',
    border: '1px solid var(--border-subtle)',
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
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  },
  totalChip: {
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-body)',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    fontVariantNumeric: 'tabular-nums',
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
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    flex: 1,
  },
  catAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-danger)',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  catPct: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    width: '44px',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  barTrack: {
    height: '8px',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
    minWidth: 0,
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '40px 24px',
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
    margin: 0,
    maxWidth: '380px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};

export default ReportsPage;

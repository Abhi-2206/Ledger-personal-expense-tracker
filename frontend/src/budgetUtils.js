/**
 * Shared spending calculation utilities.
 * Used by the Budgets page to calculate actual spending from transactions.
 * Mirrors the type convention in TransactionForm.jsx and SummaryCards.jsx:
 *   - t.type === 'expense' means expense; amount is negative or t.type is set.
 *   - t.date is a 'YYYY-MM-DD' string.
 */

/**
 * Calculate the total expense spending for a given category and calendar month
 * from a list of transactions.
 *
 * @param {Array} transactions - All transactions (from state / IPC)
 * @param {string} category    - The category to match (case-insensitive)
 * @param {number} year        - The 4-digit calendar year  (e.g. 2026)
 * @param {number} month       - The 1-based calendar month (e.g. 10 for October)
 * @returns {number} Total spending as a non-negative number
 */
export function calculateCategorySpending(transactions, category, year, month) {
  if (!Array.isArray(transactions) || !category) return 0;

  const catLower = category.trim().toLowerCase();
  // Zero-pad month to match 'YYYY-MM-DD'
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

  let total = 0;

  transactions.forEach((t) => {
    if (!t) return;

    // Must be an expense (using the same convention as SummaryCards/TransactionsTable)
    const amount = parseFloat(t.amount) || 0;
    const isExpense = t.type === 'expense' || (!t.type && amount < 0);
    if (!isExpense) return;

    // Must match the category
    const txCat = (t.category || '').trim().toLowerCase();
    if (txCat !== catLower) return;

    // Must be in the target month: t.date is 'YYYY-MM-DD'
    const txDate = (t.date || '').trim();
    if (!txDate.startsWith(monthPrefix)) return;

    total += Math.abs(amount);
  });

  return total;
}

/**
 * Format a number as a currency string using the app's existing convention.
 * Matches the `$X.XX` format used in SummaryCards.jsx and TransactionsTable.jsx.
 *
 * @param {number} amount
 * @returns {string} e.g. "$12.50"
 */
export function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return `$${Math.abs(num).toFixed(2)}`;
}

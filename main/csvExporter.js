const path = require('path');
const fs = require('fs');

/**
 * Escapes a single CSV field value according to RFC 4180 rules:
 * - If the value contains comma (,), double quote ("), carriage return (\r), or newline (\n),
 *   it must be enclosed in double quotes.
 * - Any double quote character inside a quoted field must be escaped by doubling it ("").
 * - Null and undefined values produce empty string.
 *
 * @param {any} value
 * @returns {string}
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Safely extracts Title and Description from a transaction object,
 * handling models where title and description are separate, where notes is used,
 * or where only a single description field exists.
 *
 * @param {object} t
 * @returns {{ title: string, description: string }}
 */
function extractTitleAndDescription(t) {
  if (!t || typeof t !== 'object') {
    return { title: '', description: '' };
  }

  const hasTitle = t.title !== undefined && t.title !== null && String(t.title).trim() !== '';
  const hasNotes = t.notes !== undefined && t.notes !== null && String(t.notes).trim() !== '';
  const hasDescription = t.description !== undefined && t.description !== null && String(t.description).trim() !== '';

  if (hasTitle) {
    const title = String(t.title);
    const description = hasNotes ? String(t.notes) : (hasDescription ? String(t.description) : '');
    return { title, description };
  }

  // If title is missing but description exists, use description as title
  if (hasDescription) {
    const title = String(t.description);
    const description = hasNotes ? String(t.notes) : '';
    return { title, description };
  }

  if (hasNotes) {
    return { title: '', description: String(t.notes) };
  }

  return { title: '', description: '' };
}

/**
 * Serializes a single transaction object into a CSV row string.
 *
 * Columns in order:
 * 1. Date
 * 2. Title
 * 3. Description
 * 4. Category
 * 5. Type
 * 6. Amount
 *
 * @param {object} t
 * @returns {string}
 */
function serializeTransactionToCSVRow(t) {
  if (!t || typeof t !== 'object') {
    return ['', '', '', '', 'expense', '0.00'].map(escapeCSVField).join(',');
  }

  const date = t.date ? String(t.date).trim() : '';
  const { title, description } = extractTitleAndDescription(t);
  const category = t.category ? String(t.category).trim() : '';

  // Determine type: if t.type is provided, use it; otherwise infer from amount sign
  let type = '';
  if (t.type) {
    type = String(t.type).toLowerCase();
  } else {
    const rawNum = t.amount !== undefined && t.amount !== null ? parseFloat(t.amount) : 0;
    type = rawNum >= 0 ? 'income' : 'expense';
  }

  // Preserve amount as a non-negative numeric value formatted to 2 decimals
  let amountStr = '0.00';
  if (t.amount !== undefined && t.amount !== null) {
    const num = parseFloat(t.amount);
    if (!isNaN(num)) {
      amountStr = Math.abs(num).toFixed(2);
    }
  }

  return [date, title, description, category, type, amountStr]
    .map(escapeCSVField)
    .join(',');
}

/**
 * Generates full RFC 4180 CSV string with header row and CRLF line endings.
 *
 * @param {Array<object>} transactions
 * @returns {string}
 */
function generateCSV(transactions = []) {
  const headers = ['Date', 'Title', 'Description', 'Category', 'Type', 'Amount'];
  const headerRow = headers.map(escapeCSVField).join(',');

  const txList = Array.isArray(transactions) ? transactions : [];
  const rows = txList.map(serializeTransactionToCSVRow);

  return [headerRow, ...rows].join('\r\n') + '\r\n';
}

/**
 * Native Electron export workflow:
 * 1. Opens dialog.showSaveDialog with suggested filename
 * 2. If cancelled, returns { success: false, canceled: true }
 * 3. Serializes transactions and writes UTF-8 file
 * 4. Returns { success: true, filePath, filename, count } or failure error
 *
 * @param {Array<object>} transactions
 * @param {object} options
 * @returns {Promise<{ success: boolean, canceled: boolean, filePath?: string, filename?: string, error?: string, count?: number }>}
 */
async function exportTransactionsCSV(transactions = [], options = {}) {
  // Lazily require electron to allow standalone testing outside of Electron runtime
  const { dialog, BrowserWindow } = require('electron');

  const dateStr = new Date().toISOString().split('T')[0];
  const defaultFilename = options.defaultFilename || `ledger-transactions-${dateStr}.csv`;

  const dialogOptions = {
    title: options.title || 'Export Transactions as CSV',
    defaultPath: defaultFilename,
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  };

  let saveDialogResult;
  try {
    const win = BrowserWindow.getFocusedWindow();
    saveDialogResult = win
      ? await dialog.showSaveDialog(win, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions);
  } catch (dialogErr) {
    console.error('Error opening save dialog:', dialogErr);
    return {
      success: false,
      canceled: false,
      error: 'Could not open save dialog.',
    };
  }

  if (!saveDialogResult || saveDialogResult.canceled || !saveDialogResult.filePath) {
    return {
      success: false,
      canceled: true,
    };
  }

  const filePath = saveDialogResult.filePath;

  try {
    const csvContent = generateCSV(transactions);
    await fs.promises.writeFile(filePath, csvContent, 'utf8');

    return {
      success: true,
      canceled: false,
      filePath,
      filename: path.basename(filePath),
      count: Array.isArray(transactions) ? transactions.length : 0,
    };
  } catch (writeErr) {
    console.error('Error writing CSV file:', writeErr);
    return {
      success: false,
      canceled: false,
      filePath,
      error: 'Failed to write CSV file to destination.',
    };
  }
}

module.exports = {
  escapeCSVField,
  extractTitleAndDescription,
  serializeTransactionToCSVRow,
  generateCSV,
  exportTransactionsCSV,
};

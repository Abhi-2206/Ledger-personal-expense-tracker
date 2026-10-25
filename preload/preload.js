const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected Electron APIs to the renderer process via contextBridge.
 * Keeps nodeIntegration disabled and contextIsolation enabled.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ─── Transactions ────────────────────────────────────────────────────────────

  /**
   * Fetch all saved transactions.
   * @returns {Promise<Array<object>>}
   */
  getTransactions: () => ipcRenderer.invoke('get-transactions'),

  /**
   * Create a new transaction.
   * @param {object} transaction
   * @returns {Promise<object|null>}
   */
  addTransaction: (transaction) => ipcRenderer.invoke('add-transaction', transaction),

  /**
   * Update an existing transaction by ID.
   * @param {number|string} id
   * @param {object} transaction
   * @returns {Promise<object|null>}
   */
  updateTransaction: (id, transaction) => ipcRenderer.invoke('update-transaction', id, transaction),

  /**
   * Delete a transaction by ID.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  deleteTransaction: (id) => ipcRenderer.invoke('delete-transaction', id),

  // ─── Budgets ─────────────────────────────────────────────────────────────────

  /**
   * Fetch all saved monthly category budgets.
   * @returns {Promise<Array<object>>}
   */
  getBudgets: () => ipcRenderer.invoke('get-budgets'),

  /**
   * Create a new monthly category budget.
   * @param {{ category: string, amount: number }} budgetData
   * @returns {Promise<{ success: boolean, budget?: object, error?: string }>}
   */
  addBudget: (budgetData) => ipcRenderer.invoke('add-budget', budgetData),

  /**
   * Update an existing monthly category budget amount by ID.
   * @param {number|string} id
   * @param {{ amount: number }} budgetData
   * @returns {Promise<{ success: boolean, budget?: object, error?: string }>}
   */
  updateBudget: (id, budgetData) => ipcRenderer.invoke('update-budget', id, budgetData),

  /**
   * Delete a monthly category budget by ID.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  deleteBudget: (id) => ipcRenderer.invoke('delete-budget', id),

  // ─── CSV Export ──────────────────────────────────────────────────────────────

  /**
   * Export transactions as an RFC 4180 CSV file via native save dialog.
   * @param {Array<object>} [transactions]
   * @returns {Promise<{ success: boolean, canceled: boolean, filePath?: string, filename?: string, count?: number, error?: string }>}
   */
  exportTransactionsCSV: (transactions) => ipcRenderer.invoke('export-transactions-csv', transactions),
});

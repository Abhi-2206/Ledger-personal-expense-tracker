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

  // ─── Savings Goals ───────────────────────────────────────────────────────────

  /**
   * Fetch all saved savings goals.
   * @returns {Promise<Array<object>>}
   */
  getGoals: () => ipcRenderer.invoke('get-goals'),

  /**
   * Create a new savings goal.
   * @param {{ name: string, targetAmount: number, targetDate?: string }} goalData
   * @returns {Promise<{ success: boolean, goal?: object, error?: string }>}
   */
  addGoal: (goalData) => ipcRenderer.invoke('add-goal', goalData),

  /**
   * Update an existing goal's name, targetAmount, or targetDate.
   * Preserves currentAmount (contributions).
   * @param {number|string} id
   * @param {{ name?: string, targetAmount?: number, targetDate?: string }} goalData
   * @returns {Promise<{ success: boolean, goal?: object, error?: string }>}
   */
  updateGoal: (id, goalData) => ipcRenderer.invoke('update-goal', id, goalData),

  /**
   * Add a contribution amount to a goal's currentAmount.
   * @param {number|string} id
   * @param {number} amount
   * @returns {Promise<{ success: boolean, goal?: object, error?: string }>}
   */
  addGoalContribution: (id, amount) => ipcRenderer.invoke('add-goal-contribution', id, amount),

  /**
   * Delete a savings goal by ID.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  deleteGoal: (id) => ipcRenderer.invoke('delete-goal', id),

  // ─── Recurring Transactions ─────────────────────────────────────────────────

  /**
   * Fetch all saved recurring transaction rules.
   * @returns {Promise<Array<object>>}
   */
  getRecurringRules: () => ipcRenderer.invoke('get-recurring-rules'),

  /**
   * Create a new recurring transaction rule.
   * @param {{ title: string, amount: number, type: 'income'|'expense', category: string, frequency: 'daily'|'weekly'|'monthly'|'yearly', startDate: string, endDate?: string }} ruleData
   * @returns {Promise<{ success: boolean, rule?: object, error?: string }>}
   */
  addRecurringRule: (ruleData) => ipcRenderer.invoke('add-recurring-rule', ruleData),

  /**
   * Update an existing recurring rule.
   * @param {number|string} id
   * @param {{ title?: string, amount?: number, type?: 'income'|'expense', category?: string, frequency?: 'daily'|'weekly'|'monthly'|'yearly', startDate?: string, endDate?: string }} ruleData
   * @returns {Promise<{ success: boolean, rule?: object, error?: string }>}
   */
  updateRecurringRule: (id, ruleData) => ipcRenderer.invoke('update-recurring-rule', id, ruleData),

  /**
   * Toggle a rule's active/paused status.
   * @param {number|string} id
   * @returns {Promise<{ success: boolean, rule?: object, error?: string }>}
   */
  toggleRecurringRuleStatus: (id) => ipcRenderer.invoke('toggle-recurring-rule-status', id),

  /**
   * Delete a recurring rule by ID.
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  deleteRecurringRule: (id) => ipcRenderer.invoke('delete-recurring-rule', id),

  /**
   * Process due transactions for all active recurring rules.
   * Generates normal transactions and advances next due dates.
   * @returns {Promise<{ success: boolean, processed: number, transactions: Array<object>, error?: string }>}
   */
  processDueTransactions: () => ipcRenderer.invoke('process-due-transactions'),
});

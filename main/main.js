const path = require('path');
const transactionManager = require('./transactionManager');
const budgetManager = require('./budgetManager');
const goalsManager = require('./goalsManager');
const recurringManager = require('./recurringManager');
const csvExporter = require('./csvExporter');

// Electron exposes its APIs when running in the main process
// We need to check if we're in the Electron main process
const isElectronMain = process.versions && process.versions.electron;

if (!isElectronMain) {
  console.error('This file must be run with Electron, not Node.js directly');
  process.exit(1);
}

// In Electron main process, require('electron') returns the actual exports
const { app, BrowserWindow, ipcMain } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // In production, load from built files
    win.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Initialize managers with user data path
  try {
    const userDataPath = app.getPath('userData');
    transactionManager.initialize(userDataPath);
    budgetManager.initialize(userDataPath);
    goalsManager.initialize(userDataPath);
    recurringManager.initialize(userDataPath);
  } catch (initErr) {
    console.error('Error initializing data managers:', initErr.message);
  }

  createWindow();

  // IPC handlers for transaction operations
  ipcMain.handle('get-transactions', () => {
    try {
      const transactions = transactionManager.getAllTransactions();
      return Array.isArray(transactions) ? transactions : [];
    } catch (error) {
      console.error('Error in get-transactions IPC handler:', error.message);
      return [];
    }
  });

  ipcMain.handle('add-transaction', (event, transaction) => {
    if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction)) {
      console.error('Invalid transaction data provided to add-transaction IPC handler');
      return null;
    }
    try {
      const result = transactionManager.addTransaction(transaction);
      return result || null;
    } catch (error) {
      console.error('Error in add-transaction IPC handler:', error.message);
      return null;
    }
  });

  ipcMain.handle('update-transaction', (event, id, transaction) => {
    if (id === undefined || id === null) {
      console.error('Transaction ID is required for update-transaction IPC handler');
      return null;
    }
    if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction)) {
      console.error('Invalid transaction data provided to update-transaction IPC handler');
      return null;
    }
    try {
      const result = transactionManager.updateTransaction(id, transaction);
      return result || null;
    } catch (error) {
      console.error('Error in update-transaction IPC handler:', error.message);
      return null;
    }
  });

  ipcMain.handle('delete-transaction', (event, id) => {
    if (id === undefined || id === null) {
      console.error('Transaction ID is required for delete-transaction IPC handler');
      return false;
    }
    try {
      return Boolean(transactionManager.deleteTransaction(id));
    } catch (error) {
      console.error('Error in delete-transaction IPC handler:', error.message);
      return false;
    }
  });

  // IPC handlers for budget operations
  ipcMain.handle('get-budgets', () => {
    try {
      const budgets = budgetManager.getAllBudgets();
      return Array.isArray(budgets) ? budgets : [];
    } catch (error) {
      console.error('Error in get-budgets IPC handler:', error.message);
      return [];
    }
  });

  ipcMain.handle('add-budget', (event, budgetData) => {
    if (!budgetData || typeof budgetData !== 'object' || Array.isArray(budgetData)) {
      return { success: false, error: 'Invalid budget data.' };
    }
    try {
      return budgetManager.addBudget(budgetData);
    } catch (error) {
      console.error('Error in add-budget IPC handler:', error.message);
      return { success: false, error: 'Failed to add budget.' };
    }
  });

  ipcMain.handle('update-budget', (event, id, budgetData) => {
    if (id === undefined || id === null) {
      return { success: false, error: 'Budget ID is required.' };
    }
    if (!budgetData || typeof budgetData !== 'object' || Array.isArray(budgetData)) {
      return { success: false, error: 'Invalid budget data.' };
    }
    try {
      return budgetManager.updateBudget(id, budgetData);
    } catch (error) {
      console.error('Error in update-budget IPC handler:', error.message);
      return { success: false, error: 'Failed to update budget.' };
    }
  });

  ipcMain.handle('delete-budget', (event, id) => {
    if (id === undefined || id === null) {
      return false;
    }
    try {
      return Boolean(budgetManager.deleteBudget(id));
    } catch (error) {
      console.error('Error in delete-budget IPC handler:', error.message);
      return false;
    }
  });

  // IPC handlers for savings goal operations
  ipcMain.handle('get-goals', () => {
    try {
      const goals = goalsManager.getAllGoals();
      return Array.isArray(goals) ? goals : [];
    } catch (error) {
      console.error('Error in get-goals IPC handler:', error.message);
      return [];
    }
  });

  ipcMain.handle('add-goal', (event, goalData) => {
    if (!goalData || typeof goalData !== 'object' || Array.isArray(goalData)) {
      return { success: false, error: 'Invalid goal data.' };
    }
    try {
      return goalsManager.addGoal(goalData);
    } catch (error) {
      console.error('Error in add-goal IPC handler:', error.message);
      return { success: false, error: 'Failed to add goal.' };
    }
  });

  ipcMain.handle('update-goal', (event, id, goalData) => {
    if (id === undefined || id === null) {
      return { success: false, error: 'Goal ID is required.' };
    }
    if (!goalData || typeof goalData !== 'object' || Array.isArray(goalData)) {
      return { success: false, error: 'Invalid goal data.' };
    }
    try {
      return goalsManager.updateGoal(id, goalData);
    } catch (error) {
      console.error('Error in update-goal IPC handler:', error.message);
      return { success: false, error: 'Failed to update goal.' };
    }
  });

  ipcMain.handle('add-goal-contribution', (event, id, amount) => {
    if (id === undefined || id === null) {
      return { success: false, error: 'Goal ID is required.' };
    }
    try {
      return goalsManager.addContribution(id, amount);
    } catch (error) {
      console.error('Error in add-goal-contribution IPC handler:', error.message);
      return { success: false, error: 'Failed to record contribution.' };
    }
  });

  ipcMain.handle('delete-goal', (event, id) => {
    if (id === undefined || id === null) {
      return false;
    }
    try {
      return Boolean(goalsManager.deleteGoal(id));
    } catch (error) {
      console.error('Error in delete-goal IPC handler:', error.message);
      return false;
    }
  });

  // IPC handlers for recurring transaction operations
  ipcMain.handle('get-recurring-rules', () => {
    try {
      const rules = recurringManager.getAllRules();
      return Array.isArray(rules) ? rules : [];
    } catch (error) {
      console.error('Error in get-recurring-rules IPC handler:', error.message);
      return [];
    }
  });

  ipcMain.handle('add-recurring-rule', (event, ruleData) => {
    if (!ruleData || typeof ruleData !== 'object' || Array.isArray(ruleData)) {
      return { success: false, error: 'Invalid rule data.' };
    }
    try {
      return recurringManager.addRule(ruleData);
    } catch (error) {
      console.error('Error in add-recurring-rule IPC handler:', error.message);
      return { success: false, error: 'Failed to add recurring rule.' };
    }
  });

  ipcMain.handle('update-recurring-rule', (event, id, ruleData) => {
    if (id === undefined || id === null) {
      return { success: false, error: 'Rule ID is required.' };
    }
    if (!ruleData || typeof ruleData !== 'object' || Array.isArray(ruleData)) {
      return { success: false, error: 'Invalid rule data.' };
    }
    try {
      return recurringManager.updateRule(id, ruleData);
    } catch (error) {
      console.error('Error in update-recurring-rule IPC handler:', error.message);
      return { success: false, error: 'Failed to update recurring rule.' };
    }
  });

  ipcMain.handle('toggle-recurring-rule-status', (event, id) => {
    if (id === undefined || id === null) {
      return { success: false, error: 'Rule ID is required.' };
    }
    try {
      return recurringManager.toggleRuleStatus(id);
    } catch (error) {
      console.error('Error in toggle-recurring-rule-status IPC handler:', error.message);
      return { success: false, error: 'Failed to toggle rule status.' };
    }
  });

  ipcMain.handle('delete-recurring-rule', (event, id) => {
    if (id === undefined || id === null) {
      return false;
    }
    try {
      return Boolean(recurringManager.deleteRule(id));
    } catch (error) {
      console.error('Error in delete-recurring-rule IPC handler:', error.message);
      return false;
    }
  });

  ipcMain.handle('process-due-transactions', () => {
    try {
      return recurringManager.processDueTransactions(transactionManager);
    } catch (error) {
      console.error('Error in process-due-transactions IPC handler:', error.message);
      return { success: false, error: 'Failed to process due transactions.' };
    }
  });

  // IPC handler for CSV export
  ipcMain.handle('export-transactions-csv', async (event, passedTransactions) => {
    try {
      let transactions;
      if (Array.isArray(passedTransactions)) {
        transactions = passedTransactions;
      } else {
        transactions = transactionManager.getAllTransactions();
      }
      return await csvExporter.exportTransactionsCSV(transactions);
    } catch (error) {
      console.error('Error in export-transactions-csv IPC handler:', error.message);
      return {
        success: false,
        canceled: false,
        error: 'Failed to export transactions as CSV.',
      };
    }
  });
});

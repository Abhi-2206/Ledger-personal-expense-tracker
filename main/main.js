const path = require('path');
const transactionManager = require('./transactionManager');
const budgetManager = require('./budgetManager');
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

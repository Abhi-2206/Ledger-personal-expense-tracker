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
  const userDataPath = app.getPath('userData');
  transactionManager.initialize(userDataPath);
  budgetManager.initialize(userDataPath);

  createWindow();

  // IPC handlers for transaction operations
  ipcMain.handle('get-transactions', () => {
    return transactionManager.getAllTransactions();
  });

  ipcMain.handle('add-transaction', (event, transaction) => {
    return transactionManager.addTransaction(transaction);
  });

  ipcMain.handle('update-transaction', (event, id, transaction) => {
    return transactionManager.updateTransaction(id, transaction);
  });

  ipcMain.handle('delete-transaction', (event, id) => {
    return transactionManager.deleteTransaction(id);
  });

  // IPC handlers for budget operations
  ipcMain.handle('get-budgets', () => {
    return budgetManager.getAllBudgets();
  });

  ipcMain.handle('add-budget', (event, budgetData) => {
    // Validate in main process before delegating
    if (!budgetData || typeof budgetData !== 'object') {
      return { success: false, error: 'Invalid budget data.' };
    }
    return budgetManager.addBudget(budgetData);
  });

  ipcMain.handle('update-budget', (event, id, budgetData) => {
    if (id === undefined || id === null) {
      return { success: false, error: 'Budget ID is required.' };
    }
    if (!budgetData || typeof budgetData !== 'object') {
      return { success: false, error: 'Invalid budget data.' };
    }
    return budgetManager.updateBudget(id, budgetData);
  });

  ipcMain.handle('delete-budget', (event, id) => {
    if (id === undefined || id === null) {
      return false;
    }
    return budgetManager.deleteBudget(id);
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
      console.error('Error in export-transactions-csv IPC handler:', error);
      return {
        success: false,
        canceled: false,
        error: error.message || 'Failed to export transactions as CSV.',
      };
    }
  });
});

const path = require('path');
const transactionManager = require('./transactionManager');

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
  // Initialize transaction manager with user data path
  transactionManager.initialize(app.getPath('userData'));
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
});

const path = require('path');
const transactionManager = require('./transactionManager');

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

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
  createWindow();
});

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

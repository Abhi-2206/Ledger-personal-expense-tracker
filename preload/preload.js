const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Transaction CRUD operations
  getTransactions: () => ipcRenderer.invoke('get-transactions'),
  addTransaction: (transaction) => ipcRenderer.invoke('add-transaction', transaction),
  updateTransaction: (id, transaction) => ipcRenderer.invoke('update-transaction', id, transaction),
  deleteTransaction: (id) => ipcRenderer.invoke('delete-transaction', id),
});

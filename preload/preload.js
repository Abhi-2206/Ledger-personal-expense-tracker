const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder for future IPC communication
  // Example: sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  // Example: onMessage: (channel, callback) => ipcRenderer.on(channel, callback),
});

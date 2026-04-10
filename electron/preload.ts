import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  query: (channel: string, data?: unknown) =>
    ipcRenderer.invoke(channel, data),

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Printing
  printKitchenTicket: (data: unknown) => ipcRenderer.invoke('print:kitchen-ticket', data),

  openCashDrawer: () => ipcRenderer.invoke('cash-drawer:open'),
});

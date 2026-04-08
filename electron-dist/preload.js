"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations
    query: (channel, data) => electron_1.ipcRenderer.invoke(channel, data),
    // App info
    getVersion: () => electron_1.ipcRenderer.invoke('get-version'),
});

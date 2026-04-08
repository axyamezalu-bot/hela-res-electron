import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase } from './database/connection';
import { registerUserHandlers } from './ipc/userHandlers';
import { registerProductHandlers } from './ipc/productHandlers';
import { registerClientHandlers } from './ipc/clientHandlers';
import { registerSaleHandlers } from './ipc/saleHandlers';
import { registerCashRegisterHandlers } from './ipc/cashRegisterHandlers';
import { registerCreditHandlers } from './ipc/creditHandlers';
import { registerWasteHandlers } from './ipc/wasteHandlers';
import { registerSupplierHandlers } from './ipc/supplierHandlers';
import { registerSalesReportHandlers } from './ipc/salesReportHandlers';
import { registerPartialCutHandlers } from './ipc/partialCutHandlers';
import { registerExpenseHandlers } from './ipc/expenseHandlers';
import { registerDepositHandlers } from './ipc/depositHandlers';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'HELA POS',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  registerUserHandlers();
  registerProductHandlers();
  registerClientHandlers();
  registerSaleHandlers();
  registerCashRegisterHandlers();
  registerCreditHandlers();
  registerWasteHandlers();
  registerSupplierHandlers();
  registerSalesReportHandlers();
  registerPartialCutHandlers();
  registerExpenseHandlers();
  registerDepositHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

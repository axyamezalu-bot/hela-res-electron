import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase } from './database/connection';
import { registerUserHandlers } from './ipc/userHandlers';
import { registerWasteHandlers } from './ipc/wasteHandlers';
import { registerRestaurantTableHandlers } from './ipc/restaurantTableHandlers';
import { registerMenuHandlers } from './ipc/menuHandlers';
import { registerOrderHandlers } from './ipc/orderHandlers';
import { registerShiftHandlers } from './ipc/shiftHandlers';

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
    title: 'HELA RES',
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
  registerWasteHandlers();
  registerRestaurantTableHandlers();
  registerMenuHandlers();
  registerOrderHandlers();
  registerShiftHandlers();

  ipcMain.handle('print:kitchen-ticket', async (_event, data: {
    tableNumber: number;
    tableName: string;
    waiterName: string;
    orderId: string;
    items: Array<{ name: string; quantity: number; notes?: string }>;
  }) => {
    try {
      const { PosPrinter } = require('electron-pos-printer');
      const printData: any[] = [
        { type: 'text', value: '*** COCINA ***', style: { fontWeight: '700', textAlign: 'center', fontSize: '18px' } },
        { type: 'text', value: `Mesa ${data.tableNumber} - ${data.tableName}`, style: { textAlign: 'center', fontSize: '14px' } },
        { type: 'text', value: `Mesero: ${data.waiterName}`, style: { fontSize: '12px' } },
        { type: 'text', value: new Date().toLocaleTimeString('es-MX'), style: { fontSize: '12px' } },
        { type: 'text', value: '--------------------------------', style: {} },
        ...data.items.flatMap(item => [
          { type: 'text', value: `${item.quantity}x ${item.name}`, style: { fontWeight: '600', fontSize: '14px' } },
          ...(item.notes ? [{ type: 'text', value: `   >> ${item.notes}`, style: { fontSize: '12px', color: '#666' } }] : []),
        ]),
        { type: 'text', value: '--------------------------------', style: {} },
        { type: 'text', value: `Folio: ${data.orderId.slice(-6).toUpperCase()}`, style: { fontSize: '11px', textAlign: 'right' } },
      ];
      await PosPrinter.print(printData, { preview: true, pageSize: '80mm', copies: 1 });
      return { success: true };
    } catch (error) {
      console.error('Print error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('cash-drawer:open', async () => {
    try {
      const { PosPrinter } = require('electron-pos-printer');
      await PosPrinter.print([
        { type: 'text', value: ' ', style: {} }
      ], {
        preview: false,
        pageSize: '80mm',
        copies: 1,
        silent: true,
      });
      return { success: true };
    } catch (error) {
      console.log('Cash drawer: no printer configured', error);
      return { success: false, error: String(error) };
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

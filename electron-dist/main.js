"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const connection_1 = require("./database/connection");
const userHandlers_1 = require("./ipc/userHandlers");
const wasteHandlers_1 = require("./ipc/wasteHandlers");
const restaurantTableHandlers_1 = require("./ipc/restaurantTableHandlers");
const menuHandlers_1 = require("./ipc/menuHandlers");
const orderHandlers_1 = require("./ipc/orderHandlers");
const shiftHandlers_1 = require("./ipc/shiftHandlers");
const isDev = !electron_1.app.isPackaged;
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: 'HELA POS',
        show: false,
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    (0, connection_1.initDatabase)();
    (0, userHandlers_1.registerUserHandlers)();
    (0, wasteHandlers_1.registerWasteHandlers)();
    (0, restaurantTableHandlers_1.registerRestaurantTableHandlers)();
    (0, menuHandlers_1.registerMenuHandlers)();
    (0, orderHandlers_1.registerOrderHandlers)();
    (0, shiftHandlers_1.registerShiftHandlers)();
    electron_1.ipcMain.handle('print:kitchen-ticket', async (_event, data) => {
        try {
            const { PosPrinter } = require('electron-pos-printer');
            const printData = [
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
        }
        catch (error) {
            console.error('Print error:', error);
            return { success: false, error: String(error) };
        }
    });
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});

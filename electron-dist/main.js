"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const connection_1 = require("./database/connection");
const userHandlers_1 = require("./ipc/userHandlers");
const productHandlers_1 = require("./ipc/productHandlers");
const clientHandlers_1 = require("./ipc/clientHandlers");
const saleHandlers_1 = require("./ipc/saleHandlers");
const cashRegisterHandlers_1 = require("./ipc/cashRegisterHandlers");
const creditHandlers_1 = require("./ipc/creditHandlers");
const wasteHandlers_1 = require("./ipc/wasteHandlers");
const supplierHandlers_1 = require("./ipc/supplierHandlers");
const salesReportHandlers_1 = require("./ipc/salesReportHandlers");
const partialCutHandlers_1 = require("./ipc/partialCutHandlers");
const expenseHandlers_1 = require("./ipc/expenseHandlers");
const depositHandlers_1 = require("./ipc/depositHandlers");
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
    (0, productHandlers_1.registerProductHandlers)();
    (0, clientHandlers_1.registerClientHandlers)();
    (0, saleHandlers_1.registerSaleHandlers)();
    (0, cashRegisterHandlers_1.registerCashRegisterHandlers)();
    (0, creditHandlers_1.registerCreditHandlers)();
    (0, wasteHandlers_1.registerWasteHandlers)();
    (0, supplierHandlers_1.registerSupplierHandlers)();
    (0, salesReportHandlers_1.registerSalesReportHandlers)();
    (0, partialCutHandlers_1.registerPartialCutHandlers)();
    (0, expenseHandlers_1.registerExpenseHandlers)();
    (0, depositHandlers_1.registerDepositHandlers)();
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});

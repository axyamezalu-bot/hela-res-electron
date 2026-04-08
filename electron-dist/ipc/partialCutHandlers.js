"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPartialCutHandlers = registerPartialCutHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerPartialCutHandlers() {
    electron_1.ipcMain.handle('partialCuts:getByDate', (_event, date) => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM cash_partial_cuts WHERE cash_register_date = ? ORDER BY cut_time ASC').all(date);
    });
    electron_1.ipcMain.handle('partialCuts:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO cash_partial_cuts (
        id, cash_register_date, cashier_id, cashier_name,
        initial_amount, sales_cash, sales_credit,
        deposits, expenses, physical_cash,
        expected_cash, difference, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.cashRegisterDate, data.cashierId, data.cashierName, data.initialAmount, data.salesCash, data.salesCredit, data.deposits, data.expenses, data.physicalCash, data.expectedCash, data.difference, data.notes ?? null);
        return db.prepare('SELECT * FROM cash_partial_cuts WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('partialCuts:delete', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('DELETE FROM cash_partial_cuts WHERE id = ?').run(id);
        return { success: true };
    });
}

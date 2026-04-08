"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShiftHandlers = registerShiftHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerShiftHandlers() {
    electron_1.ipcMain.handle('shifts:getActive', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM shifts WHERE active = 1 LIMIT 1').get();
    });
    electron_1.ipcMain.handle('shifts:open', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO shifts (id, date, user_id, user_name) VALUES (?, ?, ?, ?)
    `).run(id, data.date, data.user_id, data.user_name);
        return db.prepare('SELECT * FROM shifts WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('shifts:close', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const grandTotal = data.total_cash + data.total_card;
        db.prepare(`
      UPDATE shifts SET
        closed_at = datetime('now'),
        active = 0,
        total_cash = ?,
        total_card = ?,
        grand_total = ?,
        total_orders = ?
      WHERE id = ?
    `).run(data.total_cash, data.total_card, grandTotal, data.total_orders, data.id);
        return db.prepare('SELECT * FROM shifts WHERE id = ?').get(data.id);
    });
    electron_1.ipcMain.handle('shifts:getHistory', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM shifts ORDER BY opened_at DESC LIMIT 30').all();
    });
}

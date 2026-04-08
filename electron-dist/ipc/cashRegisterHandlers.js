"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCashRegisterHandlers = registerCashRegisterHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerCashRegisterHandlers() {
    electron_1.ipcMain.handle('cash:getUnclosed', () => {
        const db = (0, connection_1.getDatabase)();
        const row = db.prepare('SELECT * FROM cash_registers WHERE closed = 0 ORDER BY created_at DESC LIMIT 1').get();
        if (!row)
            return null;
        return {
            date: row.date,
            startingAmount: row.starting_amount,
            userId: row.user_id,
            userName: row.user_name,
        };
    });
    electron_1.ipcMain.handle('cash:open', (_event, payload) => {
        const db = (0, connection_1.getDatabase)();
        const openCash = db.prepare('SELECT * FROM cash_registers WHERE date = ? AND closed = 0 ORDER BY created_at DESC LIMIT 1').get(payload.date);
        if (openCash) {
            return {
                date: openCash.date,
                startingAmount: openCash.starting_amount,
                userId: openCash.user_id,
                userName: openCash.user_name,
            };
        }
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO cash_registers (id, date, starting_amount, closed, user_id, user_name)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(id, payload.date, payload.amount, payload.userId, payload.userName);
        return {
            date: payload.date,
            startingAmount: payload.amount,
            userId: payload.userId,
            userName: payload.userName,
        };
    });
    electron_1.ipcMain.handle('cash:close', (_event, date) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare(`
      UPDATE cash_registers
      SET closed = 1, closed_at = datetime('now')
      WHERE date = ? AND closed = 0
    `).run(date);
        return { success: true };
    });
    electron_1.ipcMain.handle('cash:getClosedDates', () => {
        const db = (0, connection_1.getDatabase)();
        const rows = db.prepare(`
      SELECT DISTINCT date FROM cash_registers
      WHERE closed = 1
      AND date NOT IN (
        SELECT date FROM cash_registers WHERE closed = 0
      )
    `).all();
        return rows.map(r => r.date);
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDepositHandlers = registerDepositHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerDepositHandlers() {
    electron_1.ipcMain.handle('deposits:getByDate', (_event, date) => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM deposits WHERE cash_register_date = ? ORDER BY created_at ASC').all(date);
    });
    electron_1.ipcMain.handle('deposits:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO deposits (id, cash_register_date, amount, concept, user_id, user_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.cashRegisterDate, data.amount, data.concept, data.userId, data.userName);
        return db.prepare('SELECT * FROM deposits WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('deposits:delete', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('DELETE FROM deposits WHERE id = ?').run(id);
        return { success: true };
    });
}

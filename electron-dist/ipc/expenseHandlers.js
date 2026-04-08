"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerExpenseHandlers = registerExpenseHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerExpenseHandlers() {
    electron_1.ipcMain.handle('expenses:getByDate', (_event, date) => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM expenses WHERE cash_register_date = ? ORDER BY created_at ASC').all(date);
    });
    electron_1.ipcMain.handle('expenses:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO expenses (id, cash_register_date, amount, category, description, user_id, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.cashRegisterDate, data.amount, data.category, data.description, data.userId, data.userName);
        return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('expenses:delete', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
        return { success: true };
    });
}

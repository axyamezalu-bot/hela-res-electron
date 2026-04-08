"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWasteHandlers = registerWasteHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerWasteHandlers() {
    electron_1.ipcMain.handle('waste:getAll', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM waste_records ORDER BY date DESC').all();
    });
    electron_1.ipcMain.handle('waste:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO waste_records (id, product_id, product_name, product_code,
        quantity, reason, user_id, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.productId, data.productName, data.productCode, data.quantity, data.reason, data.userId, data.userName);
        db.prepare(`
      UPDATE products SET stock = stock - ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(data.quantity, data.productId);
        return db.prepare('SELECT * FROM waste_records WHERE id = ?').get(id);
    });
}

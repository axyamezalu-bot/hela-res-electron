"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWasteHandlers = registerWasteHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerWasteHandlers() {
    // Inventario
    electron_1.ipcMain.handle('inventory:getAll', () => {
        return (0, connection_1.getDatabase)().prepare('SELECT * FROM inventory_items ORDER BY name').all();
    });
    electron_1.ipcMain.handle('inventory:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO inventory_items (id, name, unit, stock, min_stock)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.name, data.unit, data.stock, data.min_stock);
        return db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('inventory:update', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare(`
      UPDATE inventory_items
      SET name=?, unit=?, stock=?, min_stock=?, updated_at=datetime('now')
      WHERE id=?
    `).run(data.name, data.unit, data.stock, data.min_stock, data.id);
        return db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(data.id);
    });
    electron_1.ipcMain.handle('inventory:delete', (_event, id) => {
        (0, connection_1.getDatabase)().prepare('DELETE FROM inventory_items WHERE id = ?').run(id);
        return { success: true };
    });
    electron_1.ipcMain.handle('inventory:addStock', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare(`
      UPDATE inventory_items
      SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?
    `).run(data.amount, data.id);
        return db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(data.id);
    });
    // Mermas
    electron_1.ipcMain.handle('waste:getAll', () => {
        return (0, connection_1.getDatabase)().prepare(`
      SELECT w.*, i.unit
      FROM waste_records w
      LEFT JOIN inventory_items i ON w.item_id = i.id
      ORDER BY w.date DESC
    `).all();
    });
    electron_1.ipcMain.handle('waste:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        const tx = db.transaction(() => {
            db.prepare(`
        INSERT INTO waste_records (id, item_id, item_name, quantity, reason, user_id, user_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.item_id, data.item_name, data.quantity, data.reason, data.user_id, data.user_name);
            db.prepare(`
        UPDATE inventory_items
        SET stock = MAX(0, stock - ?), updated_at = datetime('now')
        WHERE id = ?
      `).run(data.quantity, data.item_id);
        });
        tx();
        return db.prepare('SELECT * FROM waste_records WHERE id = ?').get(id);
    });
}

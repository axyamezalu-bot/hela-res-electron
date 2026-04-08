"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOrderHandlers = registerOrderHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerOrderHandlers() {
    electron_1.ipcMain.handle('orders:getActive', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare(`
      SELECT o.*, rt.number AS table_number
      FROM orders o
      JOIN restaurant_tables rt ON o.table_id = rt.id
      WHERE o.status = 'abierta'
      ORDER BY o.opened_at
    `).all();
    });
    electron_1.ipcMain.handle('orders:getByTable', (_event, tableId) => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare(`
      SELECT * FROM orders WHERE table_id = ? AND status = 'abierta' LIMIT 1
    `).get(tableId);
    });
    electron_1.ipcMain.handle('orders:getItems', (_event, orderId) => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at').all(orderId);
    });
    electron_1.ipcMain.handle('orders:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        const tx = db.transaction(() => {
            db.prepare(`
        INSERT INTO orders (id, table_id, table_name, waiter_id, waiter_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, data.table_id, data.table_name, data.waiter_id, data.waiter_name);
            db.prepare(`UPDATE restaurant_tables SET status = 'ocupada' WHERE id = ?`).run(data.table_id);
        });
        tx();
        return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('orders:addItem', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        const tx = db.transaction(() => {
            db.prepare(`
        INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, quantity, unit_price, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.order_id, data.menu_item_id, data.menu_item_name, data.quantity, data.unit_price, data.notes ?? null);
            db.prepare('UPDATE orders SET total = total + ? WHERE id = ?')
                .run(data.quantity * data.unit_price, data.order_id);
        });
        tx();
        return db.prepare('SELECT * FROM order_items WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('orders:removeItem', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const tx = db.transaction(() => {
            db.prepare('DELETE FROM order_items WHERE id = ?').run(data.item_id);
            db.prepare('UPDATE orders SET total = total - ? WHERE id = ?')
                .run(data.quantity * data.unit_price, data.order_id);
        });
        tx();
        return { success: true };
    });
    electron_1.ipcMain.handle('orders:sendToKitchen', (_event, orderId) => {
        const db = (0, connection_1.getDatabase)();
        const items = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ? AND sent_to_kitchen = 0
    `).all(orderId);
        db.prepare(`
      UPDATE order_items SET sent_to_kitchen = 1 WHERE order_id = ? AND sent_to_kitchen = 0
    `).run(orderId);
        return items;
    });
    electron_1.ipcMain.handle('orders:requestBill', (_event, { table_id }) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare(`UPDATE restaurant_tables SET status = 'cuenta_pedida' WHERE id = ?`).run(table_id);
        return { success: true };
    });
    electron_1.ipcMain.handle('orders:close', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const tx = db.transaction(() => {
            db.prepare(`
        UPDATE orders SET status = 'cobrada', payment_method = ?, closed_at = datetime('now')
        WHERE id = ?
      `).run(data.payment_method, data.order_id);
            db.prepare(`UPDATE restaurant_tables SET status = 'libre' WHERE id = ?`).run(data.table_id);
        });
        tx();
        return db.prepare('SELECT * FROM orders WHERE id = ?').get(data.order_id);
    });
    electron_1.ipcMain.handle('orders:cancel', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const tx = db.transaction(() => {
            db.prepare(`
        UPDATE orders SET status = 'cancelada', closed_at = datetime('now') WHERE id = ?
      `).run(data.order_id);
            db.prepare(`UPDATE restaurant_tables SET status = 'libre' WHERE id = ?`).run(data.table_id);
        });
        tx();
        return { success: true };
    });
}

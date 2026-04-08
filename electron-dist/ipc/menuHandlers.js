"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMenuHandlers = registerMenuHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerMenuHandlers() {
    electron_1.ipcMain.handle('menu:getCategories', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM menu_categories WHERE active = 1 ORDER BY sort_order').all();
    });
    electron_1.ipcMain.handle('menu:createCategory', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO menu_categories (id, name, color, sort_order) VALUES (?, ?, ?, ?)
    `).run(id, data.name, data.color, data.sort_order);
        return db.prepare('SELECT * FROM menu_categories WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('menu:deleteCategory', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('UPDATE menu_categories SET active = 0 WHERE id = ?').run(id);
        return { success: true };
    });
    electron_1.ipcMain.handle('menu:getItems', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare(`
      SELECT mi.*, mc.name AS category_name
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.available = 1
      ORDER BY mc.sort_order, mi.sort_order
    `).all();
    });
    electron_1.ipcMain.handle('menu:getAllItems', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare(`
      SELECT mi.*, mc.name AS category_name
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      ORDER BY mc.sort_order, mi.sort_order
    `).all();
    });
    electron_1.ipcMain.handle('menu:createItem', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO menu_items (id, category_id, name, description, price, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.category_id, data.name, data.description ?? null, data.price, data.sort_order);
        return db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('menu:updateItem', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare(`
      UPDATE menu_items
      SET name = ?, description = ?, price = ?, available = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(data.name, data.description ?? null, data.price, data.available ? 1 : 0, data.id);
        return db.prepare('SELECT * FROM menu_items WHERE id = ?').get(data.id);
    });
    electron_1.ipcMain.handle('menu:deleteItem', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('UPDATE menu_items SET available = 0 WHERE id = ?').run(id);
        return { success: true };
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProductHandlers = registerProductHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerProductHandlers() {
    electron_1.ipcMain.handle('products:getAll', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM products ORDER BY name ASC').all();
    });
    electron_1.ipcMain.handle('products:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO products (id, code, name, category, brand, description,
        purchase_price, price, initial_stock, stock, min_stock, sale_unit, price_per_kg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.code, data.name, data.category, data.brand ?? null, data.description ?? null, data.purchasePrice, data.price, data.initialStock, data.stock, data.minStock, data.saleUnit, data.pricePerKg ?? null);
        return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('products:update', (_event, payload) => {
        const db = (0, connection_1.getDatabase)();
        const { id, ...data } = payload;
        const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        if (!existing)
            throw new Error('Producto no encontrado');
        db.prepare(`
      UPDATE products SET
        code = ?, name = ?, category = ?, brand = ?, description = ?,
        purchase_price = ?, price = ?, initial_stock = ?, stock = ?,
        min_stock = ?, sale_unit = ?, price_per_kg = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(data.code ?? existing.code, data.name ?? existing.name, data.category ?? existing.category, data.brand ?? existing.brand, data.description ?? existing.description, data.purchasePrice ?? existing.purchase_price, data.price ?? existing.price, data.initialStock ?? existing.initial_stock, data.stock ?? existing.stock, data.minStock ?? existing.min_stock, data.saleUnit ?? existing.sale_unit, data.pricePerKg ?? existing.price_per_kg, id);
        return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('products:updateStock', (_event, payload) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare(`
      UPDATE products SET stock = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(payload.stock, payload.id);
        return db.prepare('SELECT * FROM products WHERE id = ?').get(payload.id);
    });
    electron_1.ipcMain.handle('products:delete', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('DELETE FROM products WHERE id = ?').run(id);
        return { success: true };
    });
}

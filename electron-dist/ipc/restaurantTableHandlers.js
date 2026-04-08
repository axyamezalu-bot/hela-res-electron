"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRestaurantTableHandlers = registerRestaurantTableHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerRestaurantTableHandlers() {
    electron_1.ipcMain.handle('tables:getAll', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM restaurant_tables WHERE active = 1 ORDER BY number').all();
    });
    electron_1.ipcMain.handle('tables:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO restaurant_tables (id, number, name, x, y, width, height, shape, seats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.number, data.name, data.x, data.y, data.width, data.height, data.shape, data.seats);
        return db.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('tables:updatePosition', (_event, { id, x, y }) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('UPDATE restaurant_tables SET x = ?, y = ? WHERE id = ?').run(x, y, id);
        return { success: true };
    });
    electron_1.ipcMain.handle('tables:updateStatus', (_event, { id, status }) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('UPDATE restaurant_tables SET status = ? WHERE id = ?').run(status, id);
        return { success: true };
    });
    electron_1.ipcMain.handle('tables:update', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare(`
      UPDATE restaurant_tables SET number = ?, name = ?, seats = ?, shape = ? WHERE id = ?
    `).run(data.number, data.name, data.seats, data.shape, data.id);
        return db.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(data.id);
    });
    electron_1.ipcMain.handle('tables:delete', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('UPDATE restaurant_tables SET active = 0 WHERE id = ?').run(id);
        return { success: true };
    });
}

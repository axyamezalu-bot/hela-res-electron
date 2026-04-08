"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClientHandlers = registerClientHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerClientHandlers() {
    electron_1.ipcMain.handle('clients:getAll', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM clients ORDER BY first_name ASC').all();
    });
    electron_1.ipcMain.handle('clients:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO clients (id, code, first_name, last_name, neighborhood,
        street, street_number, business_name, rfc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.code, data.firstName, data.lastName, data.neighborhood, data.street, data.streetNumber, data.businessName ?? null, data.rfc ?? null);
        return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('clients:update', (_event, payload) => {
        const db = (0, connection_1.getDatabase)();
        const { id, ...data } = payload;
        const ex = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
        if (!ex)
            throw new Error('Cliente no encontrado');
        db.prepare(`
      UPDATE clients SET
        first_name = ?, last_name = ?, neighborhood = ?,
        street = ?, street_number = ?, business_name = ?, rfc = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(data.firstName ?? ex.first_name, data.lastName ?? ex.last_name, data.neighborhood ?? ex.neighborhood, data.street ?? ex.street, data.streetNumber ?? ex.street_number, data.businessName ?? ex.business_name, data.rfc ?? ex.rfc, id);
        return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('clients:delete', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('DELETE FROM clients WHERE id = ?').run(id);
        return { success: true };
    });
    electron_1.ipcMain.handle('clients:getNextCode', () => {
        const db = (0, connection_1.getDatabase)();
        const last = db.prepare('SELECT code FROM clients ORDER BY code DESC LIMIT 1').get();
        if (!last)
            return 'C001';
        const num = parseInt(last.code.replace('C', '')) + 1;
        return 'C' + String(num).padStart(3, '0');
    });
}

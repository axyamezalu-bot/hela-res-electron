"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSupplierHandlers = registerSupplierHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerSupplierHandlers() {
    electron_1.ipcMain.handle('suppliers:getAll', () => {
        const db = (0, connection_1.getDatabase)();
        const suppliers = db.prepare('SELECT * FROM suppliers WHERE active = 1 ORDER BY name ASC').all();
        return suppliers.map(s => {
            const visitDays = db.prepare('SELECT day FROM supplier_visit_days WHERE supplier_id = ?').all(s.id);
            const products = db.prepare('SELECT * FROM supplier_products WHERE supplier_id = ?').all(s.id);
            return { ...s, visitDays: visitDays.map(v => v.day), products };
        });
    });
    electron_1.ipcMain.handle('suppliers:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO suppliers (id, name, business_name, rfc, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.businessName ?? null, data.rfc ?? null, data.phone, data.email ?? null, data.address ?? null, data.notes ?? null);
        for (const day of (data.visitDays ?? [])) {
            db.prepare('INSERT INTO supplier_visit_days (id, supplier_id, day) VALUES (?, ?, ?)').run(crypto.randomUUID(), id, day);
        }
        const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
        const visitDays = db.prepare('SELECT day FROM supplier_visit_days WHERE supplier_id = ?').all(id);
        return { ...supplier, visitDays: visitDays.map((v) => v.day), products: [] };
    });
    electron_1.ipcMain.handle('suppliers:update', (_event, payload) => {
        const db = (0, connection_1.getDatabase)();
        const { id, visitDays, ...data } = payload;
        const ex = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
        if (!ex)
            throw new Error('Proveedor no encontrado');
        db.prepare(`
      UPDATE suppliers SET
        name = ?, business_name = ?, rfc = ?, phone = ?,
        email = ?, address = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(data.name ?? ex.name, data.businessName ?? ex.business_name, data.rfc ?? ex.rfc, data.phone ?? ex.phone, data.email ?? ex.email, data.address ?? ex.address, data.notes ?? ex.notes, id);
        if (visitDays !== undefined) {
            db.prepare('DELETE FROM supplier_visit_days WHERE supplier_id = ?').run(id);
            for (const day of visitDays) {
                db.prepare('INSERT INTO supplier_visit_days (id, supplier_id, day) VALUES (?, ?, ?)').run(crypto.randomUUID(), id, day);
            }
        }
        const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
        const days = db.prepare('SELECT day FROM supplier_visit_days WHERE supplier_id = ?').all(id);
        const products = db.prepare('SELECT * FROM supplier_products WHERE supplier_id = ?').all(id);
        return { ...updated, visitDays: days.map((v) => v.day), products };
    });
    electron_1.ipcMain.handle('suppliers:delete', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare("UPDATE suppliers SET active = 0, updated_at = datetime('now') WHERE id = ?").run(id);
        return { success: true };
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCreditHandlers = registerCreditHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerCreditHandlers() {
    electron_1.ipcMain.handle('credits:getAll', () => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM credit_accounts ORDER BY created_at DESC').all();
    });
    electron_1.ipcMain.handle('credits:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO credit_accounts (id, client_name, client_code, description,
        total_amount, paid_amount, pending_amount, status, debt_date, last_payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.clientName, data.clientCode, data.description, data.totalAmount, data.paidAmount, data.pendingAmount, data.status, data.debtDate, data.lastPaymentDate);
        return db.prepare('SELECT * FROM credit_accounts WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('credits:registerPayment', (_event, payload) => {
        const db = (0, connection_1.getDatabase)();
        const credit = db.prepare('SELECT * FROM credit_accounts WHERE id = ?').get(payload.id);
        if (!credit)
            throw new Error('Crédito no encontrado');
        const newPaid = credit.paid_amount + payload.amount;
        const newPending = credit.total_amount - newPaid;
        const newStatus = newPending <= 0 ? 'Pagado'
            : newPaid > 0 ? 'Pago Parcial' : 'Pendiente';
        db.prepare(`
      UPDATE credit_accounts SET
        paid_amount = ?, pending_amount = ?, status = ?,
        last_payment_date = date('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(newPaid, Math.max(0, newPending), newStatus, payload.id);
        return db.prepare('SELECT * FROM credit_accounts WHERE id = ?').get(payload.id);
    });
}

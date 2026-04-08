"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSaleHandlers = registerSaleHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerSaleHandlers() {
    electron_1.ipcMain.handle('sales:getAll', () => {
        const db = (0, connection_1.getDatabase)();
        const sales = db.prepare('SELECT * FROM sales ORDER BY date DESC').all();
        return sales.map(sale => {
            const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
            const folioRow = db.prepare('SELECT folio FROM sale_folios WHERE sale_id = ?').get(sale.id);
            return {
                ...sale,
                folio: folioRow?.folio ?? '—',
                items: items.map(item => ({
                    product: {
                        id: item.product_id,
                        code: item.product_code,
                        name: item.product_name,
                        price: item.unit_price,
                        saleUnit: item.sale_unit,
                        purchasePrice: item.purchase_price ?? 0,
                    },
                    quantity: item.quantity,
                })),
            };
        });
    });
    electron_1.ipcMain.handle('sales:create', (_event, payload) => {
        const db = (0, connection_1.getDatabase)();
        const { sale, items } = payload;
        const saleId = crypto.randomUUID();
        db.prepare(`
      INSERT INTO sales (id, date, total, payment_method, delivery_method,
        client_id, client_name, user_id, user_name, status, original_sale_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(saleId, sale.date, sale.total, sale.paymentMethod, sale.deliveryMethod, sale.clientId ?? null, sale.clientName ?? null, sale.userId ?? null, sale.userName, sale.status, sale.originalSaleId ?? null);
        for (const item of items) {
            const itemId = crypto.randomUUID();
            db.prepare(`
        INSERT INTO sale_items (id, sale_id, product_id, product_name,
          product_code, quantity, unit_price, sale_unit, purchase_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(itemId, saleId, item.product.id, item.product.name, item.product.code, item.quantity, item.product.price, item.product.saleUnit, item.product.purchasePrice ?? 0);
            db.prepare(`
        UPDATE products SET stock = stock - ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(item.quantity, item.product.id);
        }
        // Generar folio correlativo
        const lastFolio = db.prepare('SELECT folio FROM sale_folios ORDER BY id DESC LIMIT 1').get();
        let nextNum = 1;
        if (lastFolio) {
            nextNum = parseInt(lastFolio.folio.replace('VTA-', '')) + 1;
        }
        const folio = 'VTA-' + String(nextNum).padStart(6, '0');
        db.prepare('INSERT INTO sale_folios (sale_id, folio) VALUES (?, ?)').run(saleId, folio);
        const created = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
        const createdItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);
        return {
            ...created,
            folio,
            items: createdItems.map(i => ({
                product: {
                    id: i.product_id, code: i.product_code,
                    name: i.product_name, price: i.unit_price,
                    saleUnit: i.sale_unit,
                    purchasePrice: i.purchase_price ?? 0,
                },
                quantity: i.quantity,
            })),
        };
    });
    electron_1.ipcMain.handle('sales:updateStatus', (_event, payload) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('UPDATE sales SET status = ? WHERE id = ?').run(payload.status, payload.id);
        return { success: true };
    });
    electron_1.ipcMain.handle('sales:cancel', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
        for (const item of items) {
            db.prepare(`
        UPDATE products SET stock = stock + ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(item.quantity, item.product_id);
        }
        db.prepare("UPDATE sales SET status = 'cancelada' WHERE id = ?").run(id);
        return { success: true };
    });
}

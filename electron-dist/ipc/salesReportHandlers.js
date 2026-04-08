"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSalesReportHandlers = registerSalesReportHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
function registerSalesReportHandlers() {
    electron_1.ipcMain.handle('reports:getAll', () => {
        const db = (0, connection_1.getDatabase)();
        const reports = db.prepare('SELECT * FROM sales_reports ORDER BY created_at DESC').all();
        return reports.map(report => {
            const sales = db.prepare(`
        SELECT s.*, sf.folio
        FROM sales s
        LEFT JOIN sale_folios sf ON sf.sale_id = s.id
        WHERE date(s.date) >= ? AND date(s.date) <= ?
        ORDER BY s.date ASC
      `).all(report.start_date, report.end_date);
            const salesWithItems = sales.map(sale => {
                const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
                return {
                    ...sale,
                    folio: sale.folio ?? '—',
                    items: items.map((item) => ({
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
            return { ...report, sales: salesWithItems };
        });
    });
    electron_1.ipcMain.handle('reports:create', (_event, data) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare(`
      INSERT INTO sales_reports (id, type, date, start_date, end_date,
        total_cash, total_credit, grand_total, total_sales,
        credit_covered, credit_pending, closed_by_user_id, closed_by_user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.id, data.type, data.date, data.startDate, data.endDate, data.totalCash, data.totalCredit, data.grandTotal, data.totalSales, data.creditCovered, data.creditPending, data.closedByUserId ?? null, data.closedByUserName);
        return db.prepare('SELECT * FROM sales_reports WHERE id = ?').get(data.id);
    });
}

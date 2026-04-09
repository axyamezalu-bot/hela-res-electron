import { ipcMain } from 'electron';
import { getDatabase } from '../database/connection';

export function registerShiftHandlers() {
  ipcMain.handle('shifts:getActive', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM shifts WHERE active = 1 LIMIT 1').get();
  });

  ipcMain.handle('shifts:open', (_event, data: { date: string; user_id: string; user_name: string }) => {
    const db = getDatabase();
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO shifts (id, date, user_id, user_name) VALUES (?, ?, ?, ?)
    `).run(id, data.date, data.user_id, data.user_name);
    return db.prepare('SELECT * FROM shifts WHERE id = ?').get(id);
  });

  ipcMain.handle('shifts:close', (_event, data: {
    id: string;
    total_cash: number;
    total_card: number;
    total_orders: number;
  }) => {
    const db = getDatabase();
    const grandTotal = data.total_cash + data.total_card;
    db.prepare(`
      UPDATE shifts SET
        closed_at = datetime('now'),
        active = 0,
        total_cash = ?,
        total_card = ?,
        grand_total = ?,
        total_orders = ?
      WHERE id = ?
    `).run(data.total_cash, data.total_card, grandTotal, data.total_orders, data.id);
    return db.prepare('SELECT * FROM shifts WHERE id = ?').get(data.id);
  });

  ipcMain.handle('shifts:getHistory', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM shifts ORDER BY opened_at DESC LIMIT 30').all();
  });

  ipcMain.handle('shifts:getOrdersByDate', (_event, date: string) => {
    const db = getDatabase();
    return db.prepare(`
      SELECT o.*, rt.number as table_number
      FROM orders o
      JOIN restaurant_tables rt ON o.table_id = rt.id
      WHERE date(o.opened_at) = date(?)
        AND o.status = 'cobrada'
      ORDER BY o.closed_at DESC
    `).all(date);
  });
}

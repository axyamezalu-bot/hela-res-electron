import { ipcMain } from 'electron';
import { getDatabase } from '../database/connection';

export function registerWasteHandlers() {

  ipcMain.handle('waste:getAll', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM waste_records ORDER BY date DESC').all();
  });

  ipcMain.handle('waste:create', (_event, data: {
    productId: string; productName: string; productCode: string;
    quantity: number; reason: string; userId: string; userName: string;
  }) => {
    const db = getDatabase();
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO waste_records (id, product_id, product_name, product_code,
        quantity, reason, user_id, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.productId, data.productName, data.productCode,
      data.quantity, data.reason, data.userId, data.userName);
    db.prepare(`
      UPDATE products SET stock = stock - ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(data.quantity, data.productId);
    return db.prepare('SELECT * FROM waste_records WHERE id = ?').get(id);
  });
}

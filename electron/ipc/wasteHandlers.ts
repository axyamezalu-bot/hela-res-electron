import { ipcMain } from 'electron';
import { getDatabase } from '../database/connection';

export function registerWasteHandlers() {
  // Inventario
  ipcMain.handle('inventory:getAll', () => {
    return getDatabase().prepare(
      'SELECT * FROM inventory_items ORDER BY name'
    ).all();
  });

  ipcMain.handle('inventory:create', (_event, data: {
    name: string; unit: string; stock: number; min_stock: number;
  }) => {
    const db = getDatabase();
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO inventory_items (id, name, unit, stock, min_stock)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.name, data.unit, data.stock, data.min_stock);
    return db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
  });

  ipcMain.handle('inventory:update', (_event, data: {
    id: string; name: string; unit: string; stock: number; min_stock: number;
  }) => {
    const db = getDatabase();
    db.prepare(`
      UPDATE inventory_items
      SET name=?, unit=?, stock=?, min_stock=?, updated_at=datetime('now')
      WHERE id=?
    `).run(data.name, data.unit, data.stock, data.min_stock, data.id);
    return db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(data.id);
  });

  ipcMain.handle('inventory:delete', (_event, id: string) => {
    getDatabase().prepare('DELETE FROM inventory_items WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('inventory:addStock', (_event, data: { id: string; amount: number }) => {
    const db = getDatabase();
    db.prepare(`
      UPDATE inventory_items
      SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?
    `).run(data.amount, data.id);
    return db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(data.id);
  });

  // Mermas
  ipcMain.handle('waste:getAll', () => {
    return getDatabase().prepare(`
      SELECT w.*, i.unit
      FROM waste_records w
      LEFT JOIN inventory_items i ON w.item_id = i.id
      ORDER BY w.date DESC
    `).all();
  });

  ipcMain.handle('waste:create', (_event, data: {
    item_id: string; item_name: string;
    quantity: number; reason: string;
    user_id: string; user_name: string;
  }) => {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO waste_records (id, item_id, item_name, quantity, reason, user_id, user_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.item_id, data.item_name, data.quantity,
             data.reason, data.user_id, data.user_name);
      db.prepare(`
        UPDATE inventory_items
        SET stock = MAX(0, stock - ?), updated_at = datetime('now')
        WHERE id = ?
      `).run(data.quantity, data.item_id);
    });
    tx();
    return db.prepare('SELECT * FROM waste_records WHERE id = ?').get(id);
  });
}
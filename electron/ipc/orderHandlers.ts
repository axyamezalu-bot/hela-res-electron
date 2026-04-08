import { ipcMain } from 'electron';
import { getDatabase } from '../database/connection';

export function registerOrderHandlers() {
  ipcMain.handle('orders:getActive', () => {
    const db = getDatabase();
    return db.prepare(`
      SELECT o.*, rt.number AS table_number
      FROM orders o
      JOIN restaurant_tables rt ON o.table_id = rt.id
      WHERE o.status = 'abierta'
      ORDER BY o.opened_at
    `).all();
  });

  ipcMain.handle('orders:getByTable', (_event, tableId: string) => {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM orders WHERE table_id = ? AND status = 'abierta' LIMIT 1
    `).get(tableId);
  });

  ipcMain.handle('orders:getItems', (_event, orderId: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at').all(orderId);
  });

  ipcMain.handle('orders:create', (_event, data: {
    table_id: string;
    table_name: string;
    waiter_id: string;
    waiter_name: string;
  }) => {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO orders (id, table_id, table_name, waiter_id, waiter_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, data.table_id, data.table_name, data.waiter_id, data.waiter_name);
      db.prepare(`UPDATE restaurant_tables SET status = 'ocupada' WHERE id = ?`).run(data.table_id);
    });
    tx();
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  });

  ipcMain.handle('orders:addItem', (_event, data: {
    order_id: string;
    menu_item_id: string;
    menu_item_name: string;
    unit_price: number;
    quantity: number;
    notes?: string;
  }) => {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, quantity, unit_price, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.order_id, data.menu_item_id, data.menu_item_name, data.quantity, data.unit_price, data.notes ?? null);
      db.prepare('UPDATE orders SET total = total + ? WHERE id = ?')
        .run(data.quantity * data.unit_price, data.order_id);
    });
    tx();
    return db.prepare('SELECT * FROM order_items WHERE id = ?').get(id);
  });

  ipcMain.handle('orders:removeItem', (_event, data: {
    item_id: string;
    order_id: string;
    quantity: number;
    unit_price: number;
  }) => {
    const db = getDatabase();
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM order_items WHERE id = ?').run(data.item_id);
      db.prepare('UPDATE orders SET total = total - ? WHERE id = ?')
        .run(data.quantity * data.unit_price, data.order_id);
    });
    tx();
    return { success: true };
  });

  ipcMain.handle('orders:sendToKitchen', (_event, orderId: string) => {
    const db = getDatabase();
    const items = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ? AND sent_to_kitchen = 0
    `).all(orderId);
    db.prepare(`
      UPDATE order_items SET sent_to_kitchen = 1 WHERE order_id = ? AND sent_to_kitchen = 0
    `).run(orderId);
    return items;
  });

  ipcMain.handle('orders:requestBill', (_event, { table_id }: { table_id: string }) => {
    const db = getDatabase();
    db.prepare(`UPDATE restaurant_tables SET status = 'cuenta_pedida' WHERE id = ?`).run(table_id);
    return { success: true };
  });

  ipcMain.handle('orders:close', (_event, data: {
    order_id: string;
    table_id: string;
    payment_method: string;
  }) => {
    const db = getDatabase();
    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE orders SET status = 'cobrada', payment_method = ?, closed_at = datetime('now')
        WHERE id = ?
      `).run(data.payment_method, data.order_id);
      db.prepare(`UPDATE restaurant_tables SET status = 'libre' WHERE id = ?`).run(data.table_id);
    });
    tx();
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(data.order_id);
  });

  ipcMain.handle('orders:cancel', (_event, data: { order_id: string; table_id: string }) => {
    const db = getDatabase();
    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE orders SET status = 'cancelada', closed_at = datetime('now') WHERE id = ?
      `).run(data.order_id);
      db.prepare(`UPDATE restaurant_tables SET status = 'libre' WHERE id = ?`).run(data.table_id);
    });
    tx();
    return { success: true };
  });
}

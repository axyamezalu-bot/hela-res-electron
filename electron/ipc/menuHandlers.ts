import { ipcMain } from 'electron';
import { getDatabase } from '../database/connection';

export function registerMenuHandlers() {
  ipcMain.handle('menu:getCategories', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM menu_categories WHERE active = 1 ORDER BY sort_order').all();
  });

  ipcMain.handle('menu:createCategory', (_event, data: { name: string; color: string; sort_order: number }) => {
    const db = getDatabase();
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO menu_categories (id, name, color, sort_order) VALUES (?, ?, ?, ?)
    `).run(id, data.name, data.color, data.sort_order);
    return db.prepare('SELECT * FROM menu_categories WHERE id = ?').get(id);
  });

  ipcMain.handle('menu:deleteCategory', (_event, id: string) => {
    const db = getDatabase();
    db.prepare('UPDATE menu_categories SET active = 0 WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('menu:getItems', () => {
    const db = getDatabase();
    return db.prepare(`
      SELECT mi.*, mc.name AS category_name
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.available = 1
      ORDER BY mc.sort_order, mi.sort_order
    `).all();
  });

  ipcMain.handle('menu:getAllItems', () => {
    const db = getDatabase();
    return db.prepare(`
      SELECT mi.*, mc.name AS category_name
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      ORDER BY mc.sort_order, mi.sort_order
    `).all();
  });

  ipcMain.handle('menu:createItem', (_event, data: {
    category_id: string;
    name: string;
    description?: string;
    price: number;
    sort_order: number;
  }) => {
    const db = getDatabase();
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO menu_items (id, category_id, name, description, price, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.category_id, data.name, data.description ?? null, data.price, data.sort_order);
    return db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  });

  ipcMain.handle('menu:updateItem', (_event, data: {
    id: string;
    name: string;
    description?: string;
    price: number;
    available: boolean;
  }) => {
    const db = getDatabase();
    db.prepare(`
      UPDATE menu_items
      SET name = ?, description = ?, price = ?, available = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(data.name, data.description ?? null, data.price, data.available ? 1 : 0, data.id);
    return db.prepare('SELECT * FROM menu_items WHERE id = ?').get(data.id);
  });

  ipcMain.handle('menu:deleteItem', (_event, id: string) => {
    const db = getDatabase();
    db.prepare('UPDATE menu_items SET available = 0 WHERE id = ?').run(id);
    return { success: true };
  });
}

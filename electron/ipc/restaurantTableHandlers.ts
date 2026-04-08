import { ipcMain } from 'electron';
import { getDatabase } from '../database/connection';

export function registerRestaurantTableHandlers() {
  ipcMain.handle('tables:getAll', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM restaurant_tables WHERE active = 1 ORDER BY number').all();
  });

  ipcMain.handle('tables:create', (_event, data: {
    number: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    shape: 'rectangle' | 'circle';
    seats: number;
  }) => {
    const db = getDatabase();
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO restaurant_tables (id, number, name, x, y, width, height, shape, seats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.number, data.name, data.x, data.y, data.width, data.height, data.shape, data.seats);
    return db.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(id);
  });

  ipcMain.handle('tables:updatePosition', (_event, { id, x, y }: { id: string; x: number; y: number }) => {
    const db = getDatabase();
    db.prepare('UPDATE restaurant_tables SET x = ?, y = ? WHERE id = ?').run(x, y, id);
    return { success: true };
  });

  ipcMain.handle('tables:updateStatus', (_event, { id, status }: { id: string; status: string }) => {
    const db = getDatabase();
    db.prepare('UPDATE restaurant_tables SET status = ? WHERE id = ?').run(status, id);
    return { success: true };
  });

  ipcMain.handle('tables:update', (_event, data: {
    id: string;
    number: number;
    name: string;
    seats: number;
    shape: 'rectangle' | 'circle';
  }) => {
    const db = getDatabase();
    db.prepare(`
      UPDATE restaurant_tables SET number = ?, name = ?, seats = ?, shape = ? WHERE id = ?
    `).run(data.number, data.name, data.seats, data.shape, data.id);
    return db.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(data.id);
  });

  ipcMain.handle('tables:delete', (_event, id: string) => {
    const db = getDatabase();
    db.prepare('UPDATE restaurant_tables SET active = 0 WHERE id = ?').run(id);
    return { success: true };
  });
}

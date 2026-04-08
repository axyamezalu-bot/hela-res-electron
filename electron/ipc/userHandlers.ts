import { ipcMain } from 'electron';
import { getDatabase } from '../database/connection';
import bcrypt from 'bcryptjs';

export function registerUserHandlers() {
  // Obtener todos los usuarios
  ipcMain.handle('users:getAll', () => {
    const db = getDatabase();
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    return users;
  });

  // Obtener usuario por ID
  ipcMain.handle('users:getById', (_event, id: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  });

  // Crear usuario
  ipcMain.handle('users:create', async (_event, userData: {
    username: string;
    fullName: string;
    email?: string;
    phone?: string;
    password: string;
    pin?: string;
    role: string;
    isAdmin: boolean;
  }) => {
    const db = getDatabase();
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const pinHash = userData.pin ? await bcrypt.hash(userData.pin, 10) : null;
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO users (id, username, full_name, email, phone, password_hash, pin_hash, role, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userData.username,
      userData.fullName,
      userData.email ?? null,
      userData.phone ?? null,
      passwordHash,
      pinHash,
      userData.role,
      userData.isAdmin ? 1 : 0
    );

    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  });

  // Actualizar usuario
  ipcMain.handle('users:update', async (_event, payload: {
    id: string;
    username?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    pin?: string;
    role?: string;
    isAdmin?: boolean;
  }) => {
    const { id, ...userData } = payload;
    const db = getDatabase();
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!existing) throw new Error('Usuario no encontrado');

    const passwordHash = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : existing.password_hash;

    const pinHash = userData.pin
      ? await bcrypt.hash(userData.pin, 10)
      : existing.pin_hash;

    db.prepare(`
      UPDATE users SET
        username = ?,
        full_name = ?,
        email = ?,
        phone = ?,
        password_hash = ?,
        pin_hash = ?,
        role = ?,
        is_admin = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      userData.username ?? existing.username,
      userData.fullName ?? existing.full_name,
      userData.email ?? existing.email,
      userData.phone ?? existing.phone,
      passwordHash,
      pinHash,
      userData.role ?? existing.role,
      userData.isAdmin !== undefined ? (userData.isAdmin ? 1 : 0) : existing.is_admin,
      id
    );

    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  });

  // Eliminar usuario
  ipcMain.handle('users:delete', (_event, id: string) => {
    const db = getDatabase();
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return { success: true };
  });

  // Login — verificar contraseña
  ipcMain.handle('users:login', async (_event, { username, password }: { username: string; password: string }) => {
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;

    return user;
  });

  // Verificar PIN
  ipcMain.handle('users:verifyPin', async (_event, { userId, pin }: { userId: string; pin: string }) => {
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user || !user.pin_hash) return false;

    return await bcrypt.compare(pin, user.pin_hash);
  });
}

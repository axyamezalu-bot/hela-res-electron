"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserHandlers = registerUserHandlers;
const electron_1 = require("electron");
const connection_1 = require("../database/connection");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
function registerUserHandlers() {
    // Obtener todos los usuarios
    electron_1.ipcMain.handle('users:getAll', () => {
        const db = (0, connection_1.getDatabase)();
        const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
        return users;
    });
    // Obtener usuario por ID
    electron_1.ipcMain.handle('users:getById', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    });
    // Crear usuario
    electron_1.ipcMain.handle('users:create', async (_event, userData) => {
        const db = (0, connection_1.getDatabase)();
        const passwordHash = await bcryptjs_1.default.hash(userData.password, 10);
        const pinHash = userData.pin ? await bcryptjs_1.default.hash(userData.pin, 10) : null;
        const id = crypto.randomUUID();
        db.prepare(`
      INSERT INTO users (id, username, full_name, email, phone, password_hash, pin_hash, role, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userData.username, userData.fullName, userData.email ?? null, userData.phone ?? null, passwordHash, pinHash, userData.role, userData.isAdmin ? 1 : 0);
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    });
    // Actualizar usuario
    electron_1.ipcMain.handle('users:update', async (_event, payload) => {
        const { id, ...userData } = payload;
        const db = (0, connection_1.getDatabase)();
        const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        if (!existing)
            throw new Error('Usuario no encontrado');
        const passwordHash = userData.password
            ? await bcryptjs_1.default.hash(userData.password, 10)
            : existing.password_hash;
        const pinHash = userData.pin
            ? await bcryptjs_1.default.hash(userData.pin, 10)
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
    `).run(userData.username ?? existing.username, userData.fullName ?? existing.full_name, userData.email ?? existing.email, userData.phone ?? existing.phone, passwordHash, pinHash, userData.role ?? existing.role, userData.isAdmin !== undefined ? (userData.isAdmin ? 1 : 0) : existing.is_admin, id);
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    });
    // Eliminar usuario
    electron_1.ipcMain.handle('users:delete', (_event, id) => {
        const db = (0, connection_1.getDatabase)();
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        return { success: true };
    });
    // Login — verificar contraseña
    electron_1.ipcMain.handle('users:login', async (_event, { username, password }) => {
        const db = (0, connection_1.getDatabase)();
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user)
            return null;
        const valid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!valid)
            return null;
        return user;
    });
    // Verificar PIN
    electron_1.ipcMain.handle('users:verifyPin', async (_event, { userId, pin }) => {
        const db = (0, connection_1.getDatabase)();
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user || !user.pin_hash)
            return false;
        return await bcryptjs_1.default.compare(pin, user.pin_hash);
    });
}

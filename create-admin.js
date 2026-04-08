const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'hela-pos-pro', 'helapos.db');
const db = new Database(dbPath);

const hash = bcrypt.hashSync('admin123', 10);
const pinHash = bcrypt.hashSync('123456', 10);
const id = require('crypto').randomUUID();

db.prepare(
  'INSERT INTO users (id, username, full_name, email, role, is_admin, password_hash, pin_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
).run(id, 'admin', 'Axel Meza', 'axel@hela.mx', 'Dueño', 1, hash, pinHash);

console.log('Usuario creado:', id);
db.close();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
function runMigrations(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      username TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      password_hash TEXT NOT NULL,
      pin_hash TEXT,
      role TEXT NOT NULL CHECK(role IN ('Dueño','Administrador','Mesero')),
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      number INTEGER NOT NULL,
      name TEXT NOT NULL,
      x REAL NOT NULL DEFAULT 100,
      y REAL NOT NULL DEFAULT 100,
      width REAL NOT NULL DEFAULT 120,
      height REAL NOT NULL DEFAULT 80,
      shape TEXT NOT NULL DEFAULT 'rectangle' CHECK(shape IN ('rectangle','circle')),
      seats INTEGER NOT NULL DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'libre' CHECK(status IN ('libre','ocupada','cuenta_pedida')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS menu_categories (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3B82F6',
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      category_id TEXT NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL CHECK(price >= 0),
      available INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      table_id TEXT NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
      table_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'abierta' CHECK(status IN ('abierta','cobrada','cancelada')),
      waiter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      waiter_name TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT,
      notes TEXT,
      opened_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id TEXT REFERENCES menu_items(id) ON DELETE SET NULL,
      menu_item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
      unit_price REAL NOT NULL,
      notes TEXT,
      sent_to_kitchen INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'unidad' CHECK(unit IN ('unidad','kg','g','l','ml')),
      stock REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS waste_records (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      item_id TEXT REFERENCES inventory_items(id) ON DELETE SET NULL,
      item_name TEXT NOT NULL,
      quantity REAL NOT NULL CHECK(quantity > 0),
      reason TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      date TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT NOT NULL,
      opened_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      total_cash REAL NOT NULL DEFAULT 0,
      total_card REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      total_orders INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );
  `);
}

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
      role TEXT NOT NULL CHECK(role IN ('Dueño','Administrador','Cajero')),
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      description TEXT,
      purchase_price REAL NOT NULL,
      price REAL NOT NULL,
      initial_stock INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 0,
      sale_unit TEXT NOT NULL DEFAULT 'unidad'
        CHECK(sale_unit IN ('unidad','kg','g')),
      price_per_kg REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      code TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      neighborhood TEXT NOT NULL,
      street TEXT NOT NULL,
      street_number TEXT NOT NULL,
      business_name TEXT,
      rfc TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      date TEXT NOT NULL DEFAULT (datetime('now')),
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      delivery_method TEXT NOT NULL DEFAULT 'pickup',
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      client_name TEXT,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'normal'
        CHECK(status IN ('normal','modificada','cancelada')),
      original_sale_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      sale_unit TEXT NOT NULL DEFAULT 'unidad'
    );
    CREATE TABLE IF NOT EXISTS credit_accounts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      client_name TEXT NOT NULL,
      client_code TEXT NOT NULL,
      description TEXT NOT NULL,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      pending_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pendiente'
        CHECK(status IN ('Pago Parcial','Vencido','Pagado','Pendiente')),
      debt_date TEXT NOT NULL,
      last_payment_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cash_registers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      date TEXT NOT NULL UNIQUE,
      starting_amount REAL NOT NULL DEFAULT 0,
      closed INTEGER NOT NULL DEFAULT 0,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT NOT NULL,
      closed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS waste_records (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      reason TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      business_name TEXT,
      rfc TEXT,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT,
      address TEXT,
      notes TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS supplier_visit_days (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      UNIQUE(supplier_id, day)
    );
    CREATE TABLE IF NOT EXISTS supplier_products (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      purchase_price REAL NOT NULL CHECK(purchase_price >= 0),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(supplier_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS sales_reports (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_cash REAL NOT NULL DEFAULT 0,
      total_credit REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      total_sales INTEGER NOT NULL DEFAULT 0,
      credit_covered REAL NOT NULL DEFAULT 0,
      credit_pending REAL NOT NULL DEFAULT 0,
      closed_by_user_id TEXT,
      closed_by_user_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      cash_register_date TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      concept TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      cash_register_date TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL CHECK(category IN ('Pago a proveedor','Compra de insumos','Otros')),
      description TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cash_partial_cuts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      cash_register_date TEXT NOT NULL,
      cut_time TEXT NOT NULL DEFAULT (datetime('now')),
      cashier_id TEXT NOT NULL,
      cashier_name TEXT NOT NULL,
      initial_amount REAL NOT NULL DEFAULT 0,
      sales_cash REAL NOT NULL DEFAULT 0,
      sales_credit REAL NOT NULL DEFAULT 0,
      deposits REAL NOT NULL DEFAULT 0,
      expenses REAL NOT NULL DEFAULT 0,
      physical_cash REAL NOT NULL DEFAULT 0,
      expected_cash REAL NOT NULL DEFAULT 0,
      difference REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cash_registers_new (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      date TEXT NOT NULL,
      starting_amount REAL NOT NULL DEFAULT 0,
      closed INTEGER NOT NULL DEFAULT 0,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT NOT NULL,
      closed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO cash_registers_new
      SELECT * FROM cash_registers;
    DROP TABLE IF EXISTS cash_registers_old;
    ALTER TABLE cash_registers RENAME TO cash_registers_old;
    ALTER TABLE cash_registers_new RENAME TO cash_registers;
    DROP TABLE IF EXISTS cash_registers_old;
    CREATE TABLE IF NOT EXISTS sale_folios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id TEXT NOT NULL UNIQUE,
      folio TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
    try {
        db.exec('ALTER TABLE sale_items ADD COLUMN purchase_price REAL NOT NULL DEFAULT 0');
    }
    catch {
        // columna ya existe, ignorar
    }
}

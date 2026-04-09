"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getDatabase = getDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const migrations_1 = require("./migrations");
let db = null;
function initDatabase() {
    const userDataPath = electron_1.app.getPath('userData');
    const dbPath = path_1.default.join(userDataPath, 'helares.db');
    db = new better_sqlite3_1.default(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    (0, migrations_1.runMigrations)(db);
    return db;
}
function getDatabase() {
    if (!db)
        throw new Error('Database not initialized');
    return db;
}

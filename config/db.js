// backend/config/db.js
const Database = require("better-sqlite3");

const db = new Database("app.db");

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    tag TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    gmail_message_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, gmail_message_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Helpers de usuario actual (ligado al Gmail conectado)
function getCurrentUserEmail() {
  return process.env.PRIMARY_EMAIL || null;
}

function getCurrentUserId() {
  const email = getCurrentUserEmail();
  if (!email) return null;

  const row = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  return row ? row.id : null;
}

module.exports = {
  db,
  getCurrentUserId,
  getCurrentUserEmail,
};

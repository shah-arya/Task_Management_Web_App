// backend/db.js
//require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:[YOUR-PASSWORD]@db.phcwkuvbgniekiwsszvt.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        description TEXT DEFAULT '',
        status      TEXT DEFAULT 'pending',
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Postgres tables are ready');
  } catch (err) {
    console.error('❌ Postgres init error:', err);
    process.exit(1);
  }
})();

module.exports = pool;




/*
const sqlite3 = require('sqlite3').verbose();

// new vars
const path = require('path');
const os = require('os');

//const DBSOURCE = "db.sqlite";

// updated dbsource
const DBSOURCE = process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'db.sqlite')
  : path.join(__dirname, 'db.sqlite');

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  } else {
    console.log('Connected to the SQLite database.');

    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`, (err) => {
      if (err) console.error(err);
    });

    // Create tasks table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
      if (err) console.error(err);
    });
  }
});

module.exports = db;
*/
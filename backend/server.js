// backend/server.js
// require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const pool     = require('./db');
const serverless = require('serverless-http');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = "161c408c36b3e05027e7898dceab8c6382b5aca8f84b2249d8261bf3070ad404";
if (!SECRET_KEY) {
  console.error('❌ Missing JWT_SECRET');
  process.exit(1);
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  jwt.verify(token, SECRET_KEY, (err, payload) => {
    if (err) return res.status(403).json({ message: 'Token invalid' });
    req.user = payload;
    next();
  });
}

// REGISTER
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!(username && password))
    return res.status(400).json({ message: 'Username and password required' });

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, hash]
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    // unique_violation
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!(username && password))
    return res.status(400).json({ message: 'Username and password required' });

  try {
    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET TASKS
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

// CREATE TASK
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, title, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

// UPDATE TASK
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  try {
    const found = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (found.rows.length === 0)
      return res.status(404).json({ message: 'Task not found' });

    const task = found.rows[0];
    const result = await pool.query(
      `UPDATE tasks
         SET title = $1,
             description = $2,
             status = $3,
             updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        title     || task.title,
        description || task.description,
        status    || task.status,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

// DELETE TASK
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: 'Task not found or not authorized' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = serverless(app);








/*
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const serverless = require('serverless-http');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = "161c408c36b3e05027e7898dceab8c6382b5aca8f84b2249d8261bf3070ad404"; // a secure key for production

// Middleware to verify the JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalid' });
    req.user = user;
    next();
  });
}

// Register a new user
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!(username && password)) return res.status(400).json({ message: 'Username and password required' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const insert = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.run(insert, [username, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      return res.status(500).json({ message: 'Database error' });
    }
    return res.status(201).json({ message: 'User registered successfully' });
  });
});

// Logins the user
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!(username && password)) return res.status(400).json({ message: 'Username and password required' });

  const query = 'SELECT * FROM users WHERE username = ?';
  db.get(query, [username], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token });
  });
});

// Get all tasks for the logged-in user
app.get('/api/tasks', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC';
  db.all(query, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// Creates a new task
app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  const query = 'INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)';
  db.run(query, [req.user.id, title, description || ''], function (err) {
    if (err) return res.status(500).json({ message: 'Database error' });

    db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.status(201).json(row);
    });
  });
});

// Updates a task
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const { title, description, status } = req.body;

  const selectQuery = 'SELECT * FROM tasks WHERE id = ? AND user_id = ?';
  db.get(selectQuery, [taskId, req.user.id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!row) return res.status(404).json({ message: 'Task not found' });

    const updateQuery = `UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(updateQuery, [title || row.title, description || row.description, status || row.status, taskId], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, updatedRow) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(updatedRow);
      });
    });
  });
});

// Deletes a task
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;

  const query = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
  db.run(query, [taskId, req.user.id], function (err) {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Task not found or not authorized' });
    res.json({ message: 'Task deleted' });
  });
});

// Starts the server
// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Server started on port ${PORT}`);
// });
module.exports = serverless(app);
*/
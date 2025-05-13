const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = "b968f75b5f570a71b58e166b8f29c13017da9c3052468f248118ec93a7c1deb2"; // secure key for production

// Middleware to verify JWT token
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

// Register new user
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

// Login user
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

// Get all tasks for logged-in user
app.get('/api/tasks', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC';
  db.all(query, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// Create new task
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

// Update a task
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

// Delete a task
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;

  const query = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
  db.run(query, [taskId, req.user.id], function (err) {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Task not found or not authorized' });
    res.json({ message: 'Task deleted' });
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

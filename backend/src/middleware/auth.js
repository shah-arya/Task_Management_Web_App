import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

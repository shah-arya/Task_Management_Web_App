import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Health-check & DB test route
app.get('/api/health', async (req, res) => {
  try {
    // Simple query to verify Prisma can read Users
    const users = await prisma.user.findMany();
    res.json({ status: 'OK', usersCount: users.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

import authRoutes from './routes/auth.js';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

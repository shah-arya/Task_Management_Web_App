import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { sendEmail } from '../utils/mailer.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const router = express.Router();

// 1) SIGNUP → generate OTP & email it
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password required' });

  // hash & create user
  const passwordHash = await bcrypt.hash(password, 10);
  const otpToken   = uuid().slice(0,6);              // 6-char OTP
  const otpExpires = new Date(Date.now() + 10*60000); // 10 minutes

  try {
    await prisma.user.create({
      data: { email, passwordHash, otpToken, otpExpires }
    });
    // send OTP
    await sendEmail(email, 'Your Verification Code', `Your code is: ${otpToken}`);
    res.status(201).json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(400).json({ error: 'Email already in use' });
  }
});

// 2) VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const user = await prisma.user.findUnique({ where: { email }});
  if (!user || user.otpToken !== otp || user.otpExpires < new Date())
    return res.status(400).json({ error: 'Invalid or expired OTP' });

  await prisma.user.update({
    where: { email },
    data: { isVerified: true, otpToken: null, otpExpires: null }
  });
  res.json({ message: 'Email verified successfully' });
});

// 3) LOGIN → issue JWT cookie
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email }});
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  if (!user.isVerified) return res.status(403).json({ error: 'Email not verified' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  // set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   7 * 24 * 3600 * 1000
  });
  res.json({ message: 'Logged in' });
});

// 4) LOGOUT (optional)
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

export default router;

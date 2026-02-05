import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import authStorage from '../services/authStorage.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pmt-secret-key-change-in-prod';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Auth bypass: active in development, disabled in production
// Set BYPASS_AUTH=true in .env to force-enable in any environment
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV !== 'production';

// 1. Register (Ordinary Email)
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const existing = await authStorage.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await authStorage.createUser(email, hash, null, name);

    // Auto-login
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res
      .status(201)
      .json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 2. Login (Ordinary Email)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await authStorage.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.hash) {
      return res.status(400).json({ error: 'Please login with Google' });
    }

    const isMatch = await bcrypt.compare(password, user.hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. Google Login
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, sub: googleId, name } = payload;

    let user = await authStorage.findUserByEmail(email);

    if (!user) {
      // Create new user linked to Google
      user = await authStorage.createUser(email, null, googleId, name);
    } else if (!user.gid) {
      // Link existing account? (For now, just allow login)
      // Ideally we'd update the user with the GID, but let's keep it simple
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error('Google Auth Error:', e);
    res.status(400).json({ error: 'Google authentication failed' });
  }
});

// Middleware for protecting routes
export const authenticateToken = (req, res, next) => {
  // 🚧 BYPASS: Skip authentication when BYPASS_AUTH is enabled
  if (BYPASS_AUTH) {
    req.user = { id: 'bypass-user', email: 'user@local.dev' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export default router;

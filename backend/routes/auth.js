import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

export const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fararud-partners-secret-2025';
const JWT_EXPIRES = '7d';

// ── POST /api/auth/register ──────────────────────────────────────────────────
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, city, country, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Ad, email və şifrə mütləqdir.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifrə ən az 6 simvol olmalıdır.' });
    }

    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM hotel_partners WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Bu email artıq qeydiyyatdadır.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new hotel partner (auto-approved immediately)
    const result = await pool.query(
      `INSERT INTO hotel_partners 
        (name, email, password_hash, phone, city, country, address, is_approved, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE)
       RETURNING id, name, email, phone, city, country, is_approved, is_active, created_at`,
      [name, email.toLowerCase(), password_hash, phone || null, city || null, country || 'Iran', address || null]
    );

    const hotel = result.rows[0];

    const token = jwt.sign(
      { id: hotel.id, email: hotel.email, name: hotel.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    console.log(`✅ [Register] Yeni otel qeydiyyatı: ${hotel.name} (${hotel.email})`);
    res.status(201).json({ success: true, token, hotel });

  } catch (err) {
    console.error('[Register Error]', err.message);
    res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email və şifrə daxil edin.' });
    }

    const result = await pool.query(
      'SELECT * FROM hotel_partners WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır.' });
    }

    const hotel = result.rows[0];

    const isValid = await bcrypt.compare(password, hotel.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır.' });
    }

    const token = jwt.sign(
      { id: hotel.id, email: hotel.email, name: hotel.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const { password_hash, ...hotelData } = hotel;

    console.log(`✅ [Login] Otel giriş etdi: ${hotel.name}`);
    res.json({ success: true, token, hotel: hotelData });

  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
import { authMiddleware } from '../middleware/auth.js';

authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, city, country, address, description, stars, amenities, images, website, is_approved, is_active, created_at FROM hotel_partners WHERE id = $1',
      [req.hotel.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Otel tapılmadı.' });
    }
    res.json({ success: true, hotel: result.rows[0] });
  } catch (err) {
    console.error('[Me Error]', err.message);
    res.status(500).json({ error: 'Xəta baş verdi.' });
  }
});

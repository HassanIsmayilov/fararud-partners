import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db/pool.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads/rooms');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `room-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Yalnız şəkil və video faylları qəbul olunur!'));
  },
});

export const roomsRouter = express.Router();

// ── GET /api/rooms — All my rooms ────────────────────────────────────────────
roomsRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM hotel_rooms WHERE hotel_id = $1 ORDER BY created_at DESC`,
      [req.hotel.id]
    );
    res.json({ success: true, rooms: result.rows });
  } catch (err) {
    console.error('[Rooms GET Error]', err.message);
    res.status(500).json({ error: 'Xəta baş verdi.' });
  }
});

// ── POST /api/rooms — Create a room ──────────────────────────────────────────
roomsRouter.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name, type, price_per_night, currency,
      capacity, bed_type, size_sqm, floor,
      amenities, total_rooms
    } = req.body;

    if (!name || !price_per_night) {
      return res.status(400).json({ error: 'Otaq adı və qiymət mütləqdir.' });
    }

    const result = await pool.query(
      `INSERT INTO hotel_rooms 
        (hotel_id, name, type, price_per_night, currency, capacity, bed_type, size_sqm, floor, amenities, total_rooms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.hotel.id,
        name,
        type || 'standard',
        parseFloat(price_per_night),
        currency || 'USD',
        parseInt(capacity) || 2,
        bed_type || null,
        size_sqm ? parseInt(size_sqm) : null,
        floor ? parseInt(floor) : null,
        JSON.stringify(amenities || []),
        parseInt(total_rooms) || 1,
      ]
    );

    res.status(201).json({ success: true, room: result.rows[0] });
  } catch (err) {
    console.error('[Rooms POST Error]', err.message);
    res.status(500).json({ error: 'Otaq yaradılarkən xəta baş verdi.' });
  }
});

// ── PUT /api/rooms/:id — Update a room ───────────────────────────────────────
roomsRouter.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, price_per_night, currency,
      capacity, bed_type, size_sqm, floor,
      amenities, total_rooms, is_available
    } = req.body;

    // Check ownership
    const check = await pool.query(
      'SELECT id FROM hotel_rooms WHERE id = $1 AND hotel_id = $2',
      [id, req.hotel.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Otaq tapılmadı.' });
    }

    const result = await pool.query(
      `UPDATE hotel_rooms SET
        name            = COALESCE($1, name),
        type            = COALESCE($2, type),
        price_per_night = COALESCE($3, price_per_night),
        currency        = COALESCE($4, currency),
        capacity        = COALESCE($5, capacity),
        bed_type        = COALESCE($6, bed_type),
        size_sqm        = COALESCE($7, size_sqm),
        floor           = COALESCE($8, floor),
        amenities       = COALESCE($9::jsonb, amenities),
        total_rooms     = COALESCE($10, total_rooms),
        is_available    = COALESCE($11, is_available)
       WHERE id = $12 AND hotel_id = $13
       RETURNING *`,
      [
        name || null, type || null,
        price_per_night ? parseFloat(price_per_night) : null,
        currency || null,
        capacity ? parseInt(capacity) : null,
        bed_type || null,
        size_sqm ? parseInt(size_sqm) : null,
        floor ? parseInt(floor) : null,
        amenities ? JSON.stringify(amenities) : null,
        total_rooms ? parseInt(total_rooms) : null,
        is_available !== undefined ? is_available : null,
        id, req.hotel.id
      ]
    );

    res.json({ success: true, room: result.rows[0] });
  } catch (err) {
    console.error('[Rooms PUT Error]', err.message);
    res.status(500).json({ error: 'Güncəlləmə xətası.' });
  }
});

// ── DELETE /api/rooms/:id — Delete a room ────────────────────────────────────
roomsRouter.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM hotel_rooms WHERE id = $1 AND hotel_id = $2 RETURNING id',
      [id, req.hotel.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Otaq tapılmadı.' });
    }
    res.json({ success: true, message: 'Otaq silindi.' });
  } catch (err) {
    console.error('[Rooms DELETE Error]', err.message);
    res.status(500).json({ error: 'Silmə xətası.' });
  }
});

// ── POST /api/rooms/:id/upload — Upload room image ───────────────────────────
roomsRouter.post('/:id/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Şəkil göndərilməyib.' });

    const imageUrl = `/uploads/rooms/${req.file.filename}`;

    await pool.query(
      `UPDATE hotel_rooms SET images = COALESCE(images, '[]'::jsonb) || $1::jsonb WHERE id = $2 AND hotel_id = $3`,
      [JSON.stringify([imageUrl]), id, req.hotel.id]
    );

    res.json({ success: true, url: imageUrl });
  } catch (err) {
    console.error('[Room Upload Error]', err.message);
    res.status(500).json({ error: 'Şəkil yükləmə xətası.' });
  }
});

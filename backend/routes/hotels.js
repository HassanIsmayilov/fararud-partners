import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db/pool.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads/hotels');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `hotel-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Yalnız şəkil və video faylları qəbul olunur!'));
  },
});

export const hotelsRouter = express.Router();

// ── GET /api/hotels/me — My hotel profile ───────────────────────────────────
hotelsRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, city, country, address, description, 
              stars, amenities, images, website, latitude, longitude,
              is_approved, is_active, created_at, updated_at
       FROM hotel_partners WHERE id = $1`,
      [req.hotel.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Otel tapılmadı.' });
    }
    res.json({ success: true, hotel: result.rows[0] });
  } catch (err) {
    console.error('[Hotels/me Error]', err.message);
    res.status(500).json({ error: 'Xəta baş verdi.' });
  }
});

// ── PUT /api/hotels/me — Update my hotel profile ────────────────────────────
hotelsRouter.put('/me', authMiddleware, async (req, res) => {
  try {
    const {
      name, phone, city, country, address, description,
      stars, amenities, website, latitude, longitude
    } = req.body;

    const result = await pool.query(
      `UPDATE hotel_partners SET
        name        = COALESCE($1, name),
        phone       = COALESCE($2, phone),
        city        = COALESCE($3, city),
        country     = COALESCE($4, country),
        address     = COALESCE($5, address),
        description = COALESCE($6, description),
        stars       = COALESCE($7, stars),
        amenities   = COALESCE($8::jsonb, amenities),
        website     = COALESCE($9, website),
        latitude    = COALESCE($10, latitude),
        longitude   = COALESCE($11, longitude)
       WHERE id = $12
       RETURNING id, name, email, phone, city, country, address, description,
                 stars, amenities, images, website, latitude, longitude,
                 is_approved, is_active, updated_at`,
      [
        name || null, phone || null, city || null, country || null,
        address || null, description || null,
        stars ? parseInt(stars) : null,
        amenities ? JSON.stringify(amenities) : null,
        website || null,
        latitude || null, longitude || null,
        req.hotel.id
      ]
    );

    res.json({ success: true, hotel: result.rows[0] });
  } catch (err) {
    console.error('[Hotels Update Error]', err.message);
    res.status(500).json({ error: 'Güncəlləmə zamanı xəta baş verdi.' });
  }
});

// ── POST /api/hotels/upload — Upload hotel image ─────────────────────────────
hotelsRouter.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Şəkil göndərilməyib.' });
    }

    const imageUrl = `/uploads/hotels/${req.file.filename}`;

    // Add image URL to hotel's images array
    await pool.query(
      `UPDATE hotel_partners 
       SET images = COALESCE(images, '[]'::jsonb) || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify([imageUrl]), req.hotel.id]
    );

    res.json({ success: true, url: imageUrl });
  } catch (err) {
    console.error('[Upload Error]', err.message);
    res.status(500).json({ error: 'Şəkil yükləmə xətası.' });
  }
});

// ── DELETE /api/hotels/images — Remove a hotel image ─────────────────────────
hotelsRouter.delete('/images', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL göndərilməyib.' });

    await pool.query(
      `UPDATE hotel_partners
       SET images = COALESCE((
         SELECT jsonb_agg(elem)
         FROM jsonb_array_elements(COALESCE(images, '[]'::jsonb)) elem
         WHERE elem::text != $1 AND elem #>> '{}' != $2
       ), '[]'::jsonb)
       WHERE id = $3`,
      [JSON.stringify(url), url, req.hotel.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Delete Image Error]', err.message);
    res.status(500).json({ error: 'Şəkil silmə xətası.' });
  }
});

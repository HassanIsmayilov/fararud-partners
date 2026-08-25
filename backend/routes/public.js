import express from 'express';
import pool from '../db/pool.js';

export const publicRouter = express.Router();

// ── GET /api/public/hotels — All approved hotels ─────────────────────────────
publicRouter.get('/hotels', async (req, res) => {
  try {
    const { city, country, stars, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        h.id, h.name, h.city, h.country, h.address, h.description,
        h.stars, h.amenities, h.images, h.website, h.latitude, h.longitude,
        h.created_at,
        COUNT(r.id) AS room_count,
        MIN(r.price_per_night) AS min_price,
        MAX(r.price_per_night) AS max_price
      FROM hotel_partners h
      LEFT JOIN hotel_rooms r ON r.hotel_id = h.id AND r.is_available = TRUE
      WHERE h.is_approved = TRUE AND h.is_active = TRUE
    `;
    const params = [];
    let paramIdx = 1;

    if (city) {
      query += ` AND LOWER(h.city) = LOWER($${paramIdx++})`;
      params.push(city);
    }
    if (country) {
      query += ` AND LOWER(h.country) = LOWER($${paramIdx++})`;
      params.push(country);
    }
    if (stars) {
      query += ` AND h.stars = $${paramIdx++}`;
      params.push(parseInt(stars));
    }

    query += ` GROUP BY h.id ORDER BY h.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json({ success: true, hotels: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('[Public Hotels Error]', err.message);
    res.status(500).json({ error: 'Xəta baş verdi.' });
  }
});

// ── GET /api/public/hotels/:id — Single hotel with rooms ─────────────────────
publicRouter.get('/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hotelResult = await pool.query(
      `SELECT 
        id, name, city, country, address, description,
        stars, amenities, images, website, latitude, longitude, created_at
       FROM hotel_partners
       WHERE id = $1 AND is_approved = TRUE AND is_active = TRUE`,
      [id]
    );

    if (hotelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Otel tapılmadı.' });
    }

    const roomsResult = await pool.query(
      `SELECT 
        id, name, type, price_per_night, currency, capacity,
        bed_type, size_sqm, floor, amenities, images, total_rooms, is_available
       FROM hotel_rooms
       WHERE hotel_id = $1 AND is_available = TRUE
       ORDER BY price_per_night ASC`,
      [id]
    );

    res.json({
      success: true,
      hotel: hotelResult.rows[0],
      rooms: roomsResult.rows,
    });
  } catch (err) {
    console.error('[Public Hotel Detail Error]', err.message);
    res.status(500).json({ error: 'Xəta baş verdi.' });
  }
});

// ── GET /api/public/cities — All available cities ────────────────────────────
publicRouter.get('/cities', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT city, country, COUNT(*) as hotel_count
       FROM hotel_partners
       WHERE is_approved = TRUE AND is_active = TRUE AND city IS NOT NULL
       GROUP BY city, country
       ORDER BY hotel_count DESC`
    );
    res.json({ success: true, cities: result.rows });
  } catch (err) {
    console.error('[Public Cities Error]', err.message);
    res.status(500).json({ error: 'Xəta baş verdi.' });
  }
});

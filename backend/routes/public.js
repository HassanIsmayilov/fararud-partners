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
      WHERE (h.is_active = TRUE OR h.is_active IS NULL)
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
       WHERE id = $1 AND (is_active = TRUE OR is_active IS NULL)`,
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
       WHERE (is_active = TRUE OR is_active IS NULL) AND city IS NOT NULL
       GROUP BY city, country
       ORDER BY hotel_count DESC`
    );
    res.json({ success: true, cities: result.rows });
  } catch (err) {
    console.error('[Public Cities Error]', err.message);
    res.status(500).json({ error: 'Xəta baş verdi.' });
  }
});

// ── POST /api/public/bookings — Customer submits new booking request ────────
publicRouter.post('/bookings', async (req, res) => {
  try {
    const {
      hotel_id,
      room_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      adults = 1,
      children = 0,
      rooms_count = 1,
      total_price,
      currency = 'USD',
      special_requests = ''
    } = req.body;

    if (!hotel_id || !guest_name || !guest_phone || !check_in || !check_out || !total_price) {
      return res.status(400).json({ error: 'Bütün vacib xanaları doldurun.' });
    }

    // Generate unique booking code e.g. FR-748291
    const booking_code = 'FR-' + Math.floor(100000 + Math.random() * 900000);

    const result = await pool.query(
      `INSERT INTO hotel_bookings (
        booking_code, hotel_id, room_id, guest_name, guest_email, guest_phone,
        check_in, check_out, adults, children, rooms_count, total_price,
        currency, special_requests, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
      RETURNING *`,
      [
        booking_code, hotel_id, room_id || null, guest_name, guest_email || '', guest_phone,
        check_in, check_out, parseInt(adults), parseInt(children), parseInt(rooms_count),
        parseFloat(total_price), currency, special_requests
      ]
    );

    console.log(`🏨 [Yeni Rezervasiya Sorğusu] Kod: ${booking_code} | Qonaq: ${guest_name}`);
    res.status(201).json({
      success: true,
      message: 'Rezervasiya sorğunuz qəbul edildi və otelə göndərildi.',
      booking: result.rows[0]
    });
  } catch (err) {
    console.error('[Public Booking Submit Error]', err.message);
    res.status(500).json({ error: 'Rezervasiya zamanı xəta baş verdi.' });
  }
});

// ── GET /api/public/bookings/:code — Customer checks booking status ─────────
publicRouter.get('/bookings/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      `SELECT 
        b.id, b.booking_code, b.guest_name, b.check_in, b.check_out,
        b.adults, b.children, b.total_price, b.currency, b.status, b.created_at,
        h.name AS hotel_name, h.city AS hotel_city, h.phone AS hotel_phone,
        r.name AS room_name
       FROM hotel_bookings b
       JOIN hotel_partners h ON h.id = b.hotel_id
       LEFT JOIN hotel_rooms r ON r.id = b.room_id
       WHERE b.booking_code = $1`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rezervasiya tapılmadı.' });
    }

    res.json({ success: true, booking: result.rows[0] });
  } catch (err) {
    console.error('[Public Booking Check Error]', err.message);
    res.status(500).json({ error: 'Xəta baş verdi.' });
  }
});

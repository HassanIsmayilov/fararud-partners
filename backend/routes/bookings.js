import express from 'express';
import pool from '../db/pool.js';
import { authMiddleware } from '../middleware/auth.js';

export const bookingsRouter = express.Router();

// ── GET /api/bookings — All bookings for authenticated hotel ─────────────────
bookingsRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        b.id, b.booking_code, b.guest_name, b.guest_email, b.guest_phone,
        b.check_in, b.check_out, b.adults, b.children, b.rooms_count,
        b.total_price, b.currency, b.special_requests, b.status, b.created_at,
        r.name AS room_name, r.type AS room_type
       FROM hotel_bookings b
       LEFT JOIN hotel_rooms r ON r.id = b.room_id
       WHERE b.hotel_id = $1
       ORDER BY b.created_at DESC`,
      [req.hotel.id]
    );

    res.json({ success: true, bookings: result.rows });
  } catch (err) {
    console.error('[Bookings GET Error]', err.message);
    res.status(500).json({ error: 'Rezervasiyaları yükləmək mümkün olmadı.' });
  }
});

// ── PATCH /api/bookings/:id/status — Partner confirms / rejects booking ─────
bookingsRouter.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed', 'rejected', 'completed'

    if (!['pending', 'confirmed', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Etibarsız status.' });
    }

    const result = await pool.query(
      `UPDATE hotel_bookings 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND hotel_id = $3
       RETURNING *`,
      [status, id, req.hotel.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rezervasiya tapılmadı.' });
    }

    console.log(`✅ [Booking Status Updated] ID: ${id} -> ${status}`);
    res.json({ success: true, booking: result.rows[0] });
  } catch (err) {
    console.error('[Booking Status Update Error]', err.message);
    res.status(500).json({ error: 'Statusu dəyişmək mümkün olmadı.' });
  }
});

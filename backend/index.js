import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db/pool.js';
import { authRouter } from './routes/auth.js';
import { hotelsRouter } from './routes/hotels.js';
import { roomsRouter } from './routes/rooms.js';
import { publicRouter } from './routes/public.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4001;

// ── Initialize Database ──────────────────────────────────────────────────────
await initDB().catch(err => console.error('[DB Init]', err.message));

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5174', 'http://localhost:5173', 'https://fararud.vercel.app', 'https://fararud-partners.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toLocaleTimeString('az-AZ');
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/public', publicRouter);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'FARARUD Hotel Partner Portal API',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/hotels/me',
      'PUT  /api/hotels/me',
      'POST /api/hotels/upload',
      'GET  /api/rooms',
      'POST /api/rooms',
      'PUT  /api/rooms/:id',
      'DELETE /api/rooms/:id',
      'GET  /api/public/hotels',
      'GET  /api/public/hotels/:id',
      'GET  /api/public/cities',
    ],
  });
});

// ── Error Handlers ───────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Endpoint tapılmadı' }));
app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(500).json({ error: 'Server xətası', message: err.message });
});

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏨 FARARUD Hotel Partner Portal API — http://localhost:${PORT}`);
  console.log(`   🔐 Auth:   POST /api/auth/register | /api/auth/login`);
  console.log(`   🏨 Hotels: GET/PUT /api/hotels/me`);
  console.log(`   🛏️  Rooms:  GET/POST/PUT/DELETE /api/rooms`);
  console.log(`   🌐 Public: GET /api/public/hotels\n`);
});

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

let pool = null;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL tapılmadı! .env faylını yoxlayın.');
} else {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('❌ [PostgreSQL Pool Error]:', err.message);
  });
}

export async function initDB() {
  if (!pool) return false;
  try {
    const client = await pool.connect();
    console.log('✅ [PostgreSQL] Verilənlər bazasına uğurla qoşuldu!');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('✅ [PostgreSQL] Cədvəllər (hotel_partners, hotel_rooms) yoxlandı.');
    }

    client.release();
    return true;
  } catch (err) {
    console.error('❌ [PostgreSQL Init Error]:', err.message);
    return false;
  }
}

export default pool;

-- Hotel Partner Portal Database Schema
-- Run this once to initialize tables

-- ─── Hotel Partners (registered hotel companies) ────────────────────────────
CREATE TABLE IF NOT EXISTS hotel_partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  phone         VARCHAR(50),
  address       TEXT,
  city          VARCHAR(100),
  country       VARCHAR(100)  DEFAULT 'Iran',
  description   TEXT,
  stars         INTEGER       CHECK (stars BETWEEN 1 AND 5),
  amenities     JSONB         DEFAULT '[]',
  images        JSONB         DEFAULT '[]',
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  website       VARCHAR(255),
  is_approved   BOOLEAN       DEFAULT FALSE,
  is_active     BOOLEAN       DEFAULT TRUE,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── Hotel Rooms ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         UUID NOT NULL REFERENCES hotel_partners(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  type             VARCHAR(100) DEFAULT 'standard',
  price_per_night  DECIMAL(10,2) NOT NULL,
  currency         VARCHAR(10)  DEFAULT 'USD',
  capacity         INTEGER      DEFAULT 2,
  bed_type         VARCHAR(100),
  size_sqm         INTEGER,
  floor            INTEGER,
  amenities        JSONB        DEFAULT '[]',
  images           JSONB        DEFAULT '[]',
  total_rooms      INTEGER      DEFAULT 1,
  is_available     BOOLEAN      DEFAULT TRUE,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hotel_partners_city     ON hotel_partners(city);
CREATE INDEX IF NOT EXISTS idx_hotel_partners_approved ON hotel_partners(is_approved);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel_id    ON hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_available   ON hotel_rooms(is_available);

-- ─── Auto-update updated_at trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_hotel_partners_updated_at ON hotel_partners;
CREATE TRIGGER update_hotel_partners_updated_at
  BEFORE UPDATE ON hotel_partners
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_hotel_rooms_updated_at ON hotel_rooms;
CREATE TRIGGER update_hotel_rooms_updated_at
  BEFORE UPDATE ON hotel_rooms
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

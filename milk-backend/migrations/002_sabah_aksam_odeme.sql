-- Migration 002: Sabah/aksam sagim modeli, IBAN, genel not, fiyat gosterimi
-- Bu dosya, DAHA ONCE schema.sql ile kurulmus bir veritabanini gunceller.
-- Yeni kurulumlarda buna gerek yok, schema.sql zaten guncel.

-- producer_settings: sabah/aksam saatleri, iban, genel not ekle
ALTER TABLE producer_settings
  ADD COLUMN IF NOT EXISTS morning_start TIME NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS morning_end   TIME NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS evening_start TIME NOT NULL DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS evening_end   TIME NOT NULL DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS iban          VARCHAR(34),
  ADD COLUMN IF NOT EXISTS general_note  TEXT;

-- Artik kullanilmayan sabit kesim saatini kaldir (yerini sagim saatleri aldi)
ALTER TABLE producer_settings DROP COLUMN IF EXISTS cutoff_hour;

-- subscriptions: hangi seansa (sabah/aksam) ait oldugunu belirt
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS session VARCHAR(10) NOT NULL DEFAULT 'morning'
    CHECK (session IN ('morning', 'evening'));

-- orders: seans, secilen saat ve siparis anindaki fiyat
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS session       VARCHAR(10) NOT NULL DEFAULT 'morning'
    CHECK (session IN ('morning', 'evening')),
  ADD COLUMN IF NOT EXISTS delivery_time TIME NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS price_lt_at_order NUMERIC(6,2);

-- Eski "gunde tek siparis" kisitini kaldirip yerine "gunde+seans basina tek siparis" koy
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_delivery_date_key;
ALTER TABLE orders
  ADD CONSTRAINT orders_customer_date_session_key UNIQUE (customer_id, delivery_date, session);

-- Artik toplanmayan teslimat adresini kaldir (teslimat yok, alim var)
ALTER TABLE users DROP COLUMN IF EXISTS address;

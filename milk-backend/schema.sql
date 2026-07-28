-- Süt sipariş uygulaması - veritabanı şeması
-- Tek üretici modeli: sistemde bir tane 'producer' rolündeki kullanıcı olduğu varsayılır.
-- Günde iki sağım (sabah/akşam) modeli.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  role          VARCHAR(10) NOT NULL CHECK (role IN ('customer', 'producer')),
  full_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  fcm_token     TEXT,                 -- push bildirim için Expo push token
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Üreticinin genel ayarları: kapasite, sabah/akşam satış saatleri, fiyat, IBAN, genel not.
-- Tek satır olması beklenir (tek üretici modeli).
CREATE TABLE IF NOT EXISTS producer_settings (
  id                  SERIAL PRIMARY KEY,
  producer_id         INTEGER NOT NULL REFERENCES users(id),
  daily_capacity_lt   NUMERIC(6,2),       -- NULL = sinirsiz
  morning_start       TIME NOT NULL DEFAULT '07:00',
  morning_end         TIME NOT NULL DEFAULT '08:00',
  evening_start       TIME NOT NULL DEFAULT '19:00',
  evening_end         TIME NOT NULL DEFAULT '20:00',
  price_per_lt        NUMERIC(6,2),
  iban                VARCHAR(34),
  general_note        TEXT               -- orn. "Siselerinizi kendiniz getiriniz"
);

-- Tekrarlayan abonelikler ("her sabah 2 litre")
CREATE TABLE IF NOT EXISTS subscriptions (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER NOT NULL REFERENCES users(id),
  session       VARCHAR(10) NOT NULL CHECK (session IN ('morning', 'evening')),
  quantity_lt   NUMERIC(5,2) NOT NULL CHECK (quantity_lt > 0),
  days_of_week  SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}', -- 1=Pzt ... 7=Paz
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date      DATE,                    -- NULL = suresiz
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Hem tek seferlik hem abonelikten otomatik uretilen gunluk siparis kayitlari
CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL PRIMARY KEY,
  customer_id       INTEGER NOT NULL REFERENCES users(id),
  subscription_id   INTEGER REFERENCES subscriptions(id),  -- NULL ise tek seferlik siparistir
  delivery_date     DATE NOT NULL,
  session           VARCHAR(10) NOT NULL CHECK (session IN ('morning', 'evening')),
  delivery_time     TIME NOT NULL,          -- musterinin secim araligi icinde sectigi saat
  quantity_lt       NUMERIC(5,2) NOT NULL CHECK (quantity_lt > 0),
  price_lt_at_order NUMERIC(6,2),           -- siparis aninda gecerli olan litre fiyati (sonradan fiyat degisse bile sabit kalir)
  status            VARCHAR(15) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'cancelled', 'delivered')),
  created_at        TIMESTAMP NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (customer_id, delivery_date, session)  -- bir musteri bir gunun bir seansina birden fazla siparis giremez
);

CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  title       VARCHAR(150) NOT NULL,
  body        TEXT NOT NULL,
  read_at     TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT now()
);

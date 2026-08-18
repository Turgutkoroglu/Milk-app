const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { signToken } = require('../auth');

const router = express.Router();

// Kayit ol
router.post('/register', async (req, res) => {
  const { role, full_name, phone, password } = req.body;

  if (!role || !full_name || !phone || !password) {
    return res.status(400).json({ error: 'role, full_name, phone ve password zorunlu' });
  }
  if (!['customer', 'producer'].includes(role)) {
    return res.status(400).json({ error: 'role customer veya producer olmali' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Bu telefon numarasi zaten kayitli' });
    }

    // Tek uretici modeli: ikinci bir producer kaydina izin verme
    if (role === 'producer') {
      const producerExists = await pool.query("SELECT id FROM users WHERE role = 'producer'");
      if (producerExists.rows.length > 0) {
        return res.status(409).json({ error: 'Sistemde zaten bir uretici kayitli' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (role, full_name, phone, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id, role, full_name, phone`,
      [role, full_name, phone, passwordHash]
    );

    const user = rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kayit sirasinda hata olustu' });
  }
});

// Giris yap
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone ve password zorunlu' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Telefon veya sifre hatali' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Telefon veya sifre hatali' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, role: user.role, full_name: user.full_name, phone: user.phone },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Giris sirasinda hata olustu' });
  }
});

// Cihaz FCM token'ini kaydet (uygulama acildiginda cagrilir)
router.post('/fcm-token', require('../auth').requireAuth, async (req, res) => {
  const { fcm_token } = req.body;
  if (!fcm_token) return res.status(400).json({ error: 'fcm_token zorunlu' });

  await pool.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [fcm_token, req.user.id]);
  res.json({ ok: true });
});

// Sifre degistir (mevcut sifreyi dogrulayarak)
router.patch('/password', require('../auth').requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password ve new_password zorunlu' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Yeni sifre en az 6 karakter olmali' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Mevcut sifre hatali' });

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sifre degistirilirken hata olustu' });
  }
});

// Uretici iletisim bilgisi (herkese acik - sifremi unuttum ekraninda kullanilir)
router.get('/producer-contact', async (req, res) => {
  const { rows } = await pool.query(
    "SELECT full_name, phone FROM users WHERE role = 'producer' LIMIT 1"
  );
  res.json(rows[0] || null);
});

// Musteri listesi (sadece uretici - sifre sifirlama ekraninda kullanilir)
router.get('/customers', require('../auth').requireAuth, require('../auth').requireRole('producer'), async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, full_name, phone FROM users WHERE role = 'customer' ORDER BY full_name"
  );
  res.json(rows);
});

// Uretici, bir musterinin sifresini dogrudan sifirlar (mevcut sifreyi bilmeden)
router.patch(
  '/reset-password',
  require('../auth').requireAuth,
  require('../auth').requireRole('producer'),
  async (req, res) => {
    const { user_id, new_password } = req.body;
    if (!user_id || !new_password) {
      return res.status(400).json({ error: 'user_id ve new_password zorunlu' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Yeni sifre en az 6 karakter olmali' });
    }

    try {
      const { rows } = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'customer'", [
        user_id,
      ]);
      if (rows.length === 0) return res.status(404).json({ error: 'Musteri bulunamadi' });

      const newHash = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user_id]);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Sifre sifirlanirken hata olustu' });
    }
  }
);

// Web push (PWA) aboneligini kaydet
router.post('/web-push-subscribe', require('../auth').requireAuth, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription) return res.status(400).json({ error: 'subscription zorunlu' });

  await pool.query('UPDATE users SET web_push_subscription = $1 WHERE id = $2', [
    JSON.stringify(subscription),
    req.user.id,
  ]);
  res.json({ ok: true });
});

// VAPID public anahtarini dondurur
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

module.exports = router;

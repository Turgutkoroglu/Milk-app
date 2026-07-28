const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../auth');
const { canModifyOrder, getProducerSettings, isTimeWithinSession } = require('../cutoff');
const { notifyUser } = require('../notifications');
const { formatTurkishDate, sessionLabel, formatTime, getUserFullName } = require('../utils');

const router = express.Router();

// Tek seferlik siparis olustur / ayni gun+seans icin guncelle (musteri)
router.post('/', requireAuth, requireRole('customer'), async (req, res) => {
  const { delivery_date, session, delivery_time, quantity_lt } = req.body;

  if (!delivery_date || !session || !delivery_time || !quantity_lt || quantity_lt <= 0) {
    return res
      .status(400)
      .json({ error: 'delivery_date, session, delivery_time ve pozitif quantity_lt zorunlu' });
  }
  if (!['morning', 'evening'].includes(session)) {
    return res.status(400).json({ error: "session 'morning' veya 'evening' olmali" });
  }

  const settings = await getProducerSettings();

  if (!isTimeWithinSession(delivery_time, settings, session)) {
    const window = session === 'morning'
      ? `${settings.morning_start} - ${settings.morning_end}`
      : `${settings.evening_start} - ${settings.evening_end}`;
    return res.status(400).json({ error: `Secilen saat, satis araligi disinda (${window})` });
  }

  const allowed = await canModifyOrder(delivery_date, session);
  if (!allowed) {
    return res.status(400).json({ error: 'Bu seans icin siparis verme suresi gecti' });
  }

  const priceAtOrder = settings.price_per_lt || null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO orders (customer_id, delivery_date, session, delivery_time, quantity_lt, price_lt_at_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (customer_id, delivery_date, session)
       DO UPDATE SET
         quantity_lt = EXCLUDED.quantity_lt,
         delivery_time = EXCLUDED.delivery_time,
         price_lt_at_order = EXCLUDED.price_lt_at_order,
         status = 'pending',
         updated_at = now()
       RETURNING *`,
      [req.user.id, delivery_date, session, delivery_time, quantity_lt, priceAtOrder]
    );

    const order = rows[0];
    const totalPrice = priceAtOrder ? Number((priceAtOrder * quantity_lt).toFixed(2)) : null;

    const producer = await pool.query("SELECT id FROM users WHERE role = 'producer' LIMIT 1");
    if (producer.rows[0]) {
      const customerName = await getUserFullName(req.user.id);
      await notifyUser(
        producer.rows[0].id,
        'Yeni sipariş',
        `${customerName} ${formatTurkishDate(delivery_date)} ${sessionLabel(session)} ${formatTime(delivery_time)} için ${quantity_lt} litre süt istiyor`
      );
    }

    res.status(201).json({ ...order, total_price: totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Siparis olusturulurken hata olustu' });
  }
});

// Siparisleri listele: musteri kendi siparislerini, uretici hepsini gorur
router.get('/', requireAuth, async (req, res) => {
  const { date, session } = req.query;

  try {
    if (req.user.role === 'customer') {
      const { rows } = await pool.query(
        'SELECT * FROM orders WHERE customer_id = $1 ORDER BY delivery_date DESC, session',
        [req.user.id]
      );
      return res.json(rows);
    }

    // producer
    const conditions = [];
    const params = [];
    if (date) {
      params.push(date);
      conditions.push(`o.delivery_date = $${params.length}`);
    }
    if (session) {
      params.push(session);
      conditions.push(`o.session = $${params.length}`);
    }

    let query = `SELECT o.*, u.full_name, u.phone
                 FROM orders o JOIN users u ON u.id = o.customer_id`;
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY o.delivery_date DESC, o.session, o.delivery_time';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Siparisler getirilirken hata olustu' });
  }
});

// Belirli bir gun (ve istege bagli seans) icin toplam litre/tutar ozeti
router.get('/summary', requireAuth, requireRole('producer'), async (req, res) => {
  const { date, session } = req.query;
  if (!date) return res.status(400).json({ error: 'date parametresi zorunlu (YYYY-MM-DD)' });

  const params = [date];
  let condition = 'delivery_date = $1';
  if (session) {
    params.push(session);
    condition += ` AND session = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(quantity_lt), 0) AS total_lt, COUNT(*) AS order_count
     FROM orders WHERE ${condition} AND status != 'cancelled'`,
    params
  );
  const settings = await getProducerSettings();
  res.json({
    date,
    session: session || 'all',
    total_lt: Number(rows[0].total_lt),
    order_count: Number(rows[0].order_count),
    daily_capacity_lt: settings.daily_capacity_lt,
  });
});

// Siparis miktarini guncelle (sadece kendi siparisi, kesim saati gecmemisse)
router.patch('/:id', requireAuth, requireRole('customer'), async (req, res) => {
  const { quantity_lt } = req.body;
  if (!quantity_lt || quantity_lt <= 0) {
    return res.status(400).json({ error: 'Gecerli bir quantity_lt gerekli' });
  }

  const existing = await pool.query('SELECT * FROM orders WHERE id = $1 AND customer_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Siparis bulunamadi' });

  const order = existing.rows[0];
  const allowed = await canModifyOrder(order.delivery_date, order.session);
  if (!allowed) return res.status(400).json({ error: 'Bu siparis icin degisiklik suresi gecti' });

  const { rows } = await pool.query(
    "UPDATE orders SET quantity_lt = $1, updated_at = now() WHERE id = $2 RETURNING *",
    [quantity_lt, req.params.id]
  );
  const updated = rows[0];
  const totalPrice = updated.price_lt_at_order
    ? Number((updated.price_lt_at_order * updated.quantity_lt).toFixed(2))
    : null;
  res.json({ ...updated, total_price: totalPrice });
});

// Siparisi onayla (uretici)
router.patch('/:id/confirm', requireAuth, requireRole('producer'), async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE orders SET status = 'confirmed', updated_at = now() WHERE id = $1 AND status = 'pending' RETURNING *",
    [req.params.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Siparis bulunamadi ya da zaten islenmis' });
  }
  const order = rows[0];
  await notifyUser(
    order.customer_id,
    'Siparişin onaylandı',
    `${formatTurkishDate(order.delivery_date)} ${sessionLabel(order.session)} ${formatTime(order.delivery_time)} siparişin (${order.quantity_lt} litre) onaylandı.`
  );
  res.json(order);
});

// Siparisi tamamlandi/teslim edildi olarak isaretle (uretici)
router.patch('/:id/complete', requireAuth, requireRole('producer'), async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE orders SET status = 'delivered', updated_at = now() WHERE id = $1 RETURNING *",
    [req.params.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Siparis bulunamadi' });
  }
  const order = rows[0];
  await notifyUser(
    order.customer_id,
    'Siparişin teslim edildi',
    `${formatTurkishDate(order.delivery_date)} ${sessionLabel(order.session)} ${formatTime(order.delivery_time)} siparişin (${order.quantity_lt} litre) teslim edildi olarak işaretlendi.`
  );
  res.json(order);
});

// Siparisi iptal et (ureticiye bildirim gonderilir)
router.patch('/:id/cancel', requireAuth, requireRole('customer'), async (req, res) => {
  const existing = await pool.query('SELECT * FROM orders WHERE id = $1 AND customer_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Siparis bulunamadi' });

  const order = existing.rows[0];
  const allowed = await canModifyOrder(order.delivery_date, order.session);
  if (!allowed) return res.status(400).json({ error: 'Bu siparis icin iptal suresi gecti' });

  const { rows } = await pool.query(
    "UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1 RETURNING *",
    [req.params.id]
  );

  const producer = await pool.query("SELECT id FROM users WHERE role = 'producer' LIMIT 1");
  if (producer.rows[0]) {
    const customerName = await getUserFullName(req.user.id);
    await notifyUser(
      producer.rows[0].id,
      'Sipariş iptal edildi',
      `${customerName} ${formatTurkishDate(order.delivery_date)} ${sessionLabel(order.session)} siparişini (${order.quantity_lt} litre) iptal etti`
    );
  }

  res.json(rows[0]);
});

module.exports = router;

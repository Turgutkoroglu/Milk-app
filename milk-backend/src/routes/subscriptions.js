const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// Yeni abonelik olustur (sadece musteri)
router.post('/', requireAuth, requireRole('customer'), async (req, res) => {
  const { session, quantity_lt, days_of_week, start_date, end_date } = req.body;

  if (!session || !['morning', 'evening'].includes(session)) {
    return res.status(400).json({ error: "session 'morning' veya 'evening' olmali" });
  }
  if (!quantity_lt || quantity_lt <= 0) {
    return res.status(400).json({ error: 'quantity_lt pozitif bir sayi olmali' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO subscriptions (customer_id, session, quantity_lt, days_of_week, start_date, end_date)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6)
       RETURNING *`,
      [req.user.id, session, quantity_lt, days_of_week || [1, 2, 3, 4, 5, 6, 7], start_date || null, end_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Abonelik olusturulurken hata olustu' });
  }
});

// Kendi aboneliklerini listele
router.get('/', requireAuth, requireRole('customer'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM subscriptions WHERE customer_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

// Aboneligi durdur
router.patch('/:id/deactivate', requireAuth, requireRole('customer'), async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE subscriptions SET active = false WHERE id = $1 AND customer_id = $2 RETURNING *',
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Abonelik bulunamadi' });
  res.json(rows[0]);
});

module.exports = router;

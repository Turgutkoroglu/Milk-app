const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../auth');
const { notifyUser } = require('../notifications');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ps.*, u.full_name AS producer_name, u.phone AS producer_phone
     FROM producer_settings ps
     JOIN users u ON u.id = ps.producer_id
     ORDER BY ps.id LIMIT 1`
  );
  res.json(rows[0] || null);
});

router.put('/', requireAuth, requireRole('producer'), async (req, res) => {
  const {
    daily_capacity_lt,
    morning_start,
    morning_end,
    evening_start,
    evening_end,
    price_per_lt,
    iban,
    general_note,
  } = req.body;

  const existing = await pool.query('SELECT id FROM producer_settings ORDER BY id LIMIT 1');

  let result;
  if (existing.rows.length === 0) {
    result = await pool.query(
      `INSERT INTO producer_settings
         (producer_id, daily_capacity_lt, morning_start, morning_end, evening_start, evening_end,
          price_per_lt, iban, general_note)
       VALUES ($1, $2, COALESCE($3,'07:00'), COALESCE($4,'08:00'), COALESCE($5,'19:00'), COALESCE($6,'20:00'), $7, $8, $9)
       RETURNING *`,
      [
        req.user.id,
        daily_capacity_lt || null,
        morning_start,
        morning_end,
        evening_start,
        evening_end,
        price_per_lt || null,
        iban || null,
        general_note || null,
      ]
    );
  } else {
    result = await pool.query(
      `UPDATE producer_settings
       SET daily_capacity_lt = $1,
           morning_start = COALESCE($2, morning_start),
           morning_end = COALESCE($3, morning_end),
           evening_start = COALESCE($4, evening_start),
           evening_end = COALESCE($5, evening_end),
           price_per_lt = $6,
           iban = $7,
           general_note = $8
       WHERE id = $9 RETURNING *`,
      [
        daily_capacity_lt || null,
        morning_start,
        morning_end,
        evening_start,
        evening_end,
        price_per_lt || null,
        iban || null,
        general_note || null,
        existing.rows[0].id,
      ]
    );
  }

  const updated = result.rows[0];

  // Tum musterilere ayarlarin guncellendigini bildir
  try {
    const { rows: customers } = await pool.query("SELECT id FROM users WHERE role = 'customer'");
    await Promise.all(
      customers.map((c) =>
        notifyUser(
          c.id,
          'Üretici bilgileri güncellendi',
          `Satış saatleri, fiyat veya diğer bilgiler güncellendi. Yeni bilgileri kontrol edebilirsin.`
        )
      )
    );
  } catch (err) {
    console.error('Musterilere bildirim gonderilirken hata:', err.message);
  }

  res.json(updated);
});

module.exports = router;

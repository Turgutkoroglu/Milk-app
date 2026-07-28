const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

const WEEKDAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function aggregate(orders) {
  const active = orders.filter((o) => o.status !== 'cancelled');
  const cancelled = orders.filter((o) => o.status === 'cancelled');

  const total_lt = active.reduce((s, o) => s + Number(o.quantity_lt), 0);
  const total_revenue = active.reduce(
    (s, o) => s + (o.price_lt_at_order ? Number(o.price_lt_at_order) * Number(o.quantity_lt) : 0),
    0
  );
  const morning_lt = active
    .filter((o) => o.session === 'morning')
    .reduce((s, o) => s + Number(o.quantity_lt), 0);
  const evening_lt = active
    .filter((o) => o.session === 'evening')
    .reduce((s, o) => s + Number(o.quantity_lt), 0);

  const weekdayTotals = {};
  const byDate = {};
  active.forEach((o) => {
    const dow = new Date(o.delivery_date).getDay();
    if (!weekdayTotals[dow]) weekdayTotals[dow] = { sum: 0, count: 0 };
    weekdayTotals[dow].sum += Number(o.quantity_lt);
    weekdayTotals[dow].count += 1;

    const key = o.delivery_date.toISOString ? o.delivery_date.toISOString().slice(0, 10) : String(o.delivery_date);
    byDate[key] = (byDate[key] || 0) + Number(o.quantity_lt);
  });

  return {
    total_lt: Number(total_lt.toFixed(2)),
    total_revenue: Number(total_revenue.toFixed(2)),
    order_count: active.length,
    cancelled_count: cancelled.length,
    cancellation_rate:
      active.length + cancelled.length > 0 ? cancelled.length / (active.length + cancelled.length) : 0,
    morning_lt: Number(morning_lt.toFixed(2)),
    evening_lt: Number(evening_lt.toFixed(2)),
    weekdayTotals,
    byDate,
  };
}

function buildAdvice(current, previous, daysNum, dailyCapacity) {
  const advice = [];

  if (current.cancellation_rate > 0.15) {
    advice.push(
      `İptal oranın %${(current.cancellation_rate * 100).toFixed(0)} ile yüksek görünüyor — müşterilere kesim saatinden önce hatırlatma göndermek işe yarayabilir.`
    );
  }

  const weekdayEntries = Object.entries(current.weekdayTotals).map(([dow, v]) => ({
    dow: Number(dow),
    avg: v.sum / v.count,
  }));
  if (weekdayEntries.length >= 2) {
    const busiest = weekdayEntries.reduce((a, b) => (b.avg > a.avg ? b : a));
    const quietest = weekdayEntries.reduce((a, b) => (b.avg < a.avg ? b : a));
    advice.push(`En yoğun gününüz ${WEEKDAY_NAMES[busiest.dow]}, ortalama ${busiest.avg.toFixed(1)} litre.`);
    if (quietest.dow !== busiest.dow) {
      advice.push(
        `En sakin gününüz ${WEEKDAY_NAMES[quietest.dow]}, ortalama ${quietest.avg.toFixed(1)} litre — bu güne özel bir hatırlatma/kampanya düşünebilirsin.`
      );
    }
  }

  if (dailyCapacity) {
    const exceededDays = Object.values(current.byDate).filter((sum) => sum > Number(dailyCapacity)).length;
    if (exceededDays > 0) {
      advice.push(
        `Son ${daysNum} günün ${exceededDays} gününde kapasiteni aştın — kapasiteni artırmayı değerlendirebilirsin.`
      );
    }
  }

  if (previous.total_lt > 0) {
    const change = ((current.total_lt - previous.total_lt) / previous.total_lt) * 100;
    if (Math.abs(change) >= 5) {
      advice.push(
        `Bu dönemki toplam satışın önceki döneme göre %${Math.abs(change).toFixed(0)} ${change >= 0 ? 'arttı' : 'azaldı'}.`
      );
    }
  }

  if (current.morning_lt > 0 && current.evening_lt > 0) {
    if (current.morning_lt > current.evening_lt * 1.5) {
      advice.push('Sabah satışların akşamdan belirgin şekilde fazla — akşam kapasiteni azaltmayı düşünebilirsin.');
    } else if (current.evening_lt > current.morning_lt * 1.5) {
      advice.push('Akşam satışların sabahtan belirgin şekilde fazla — sabah kapasiteni azaltmayı düşünebilirsin.');
    }
  }

  if (advice.length === 0) {
    advice.push('Şu an dikkat çekici bir örüntü yok, veriler dengeli görünüyor.');
  }

  return advice;
}

// Uretici icin donemsel rapor + kural tabanli tavsiyeler (AI kullanmiyor)
router.get('/producer-summary', requireAuth, requireRole('producer'), async (req, res) => {
  const daysNum = Math.max(1, Math.min(365, parseInt(req.query.days) || 30));

  const today = new Date();
  const periodStart = new Date(today);
  periodStart.setDate(periodStart.getDate() - (daysNum - 1));
  const prevPeriodStart = new Date(periodStart);
  prevPeriodStart.setDate(prevPeriodStart.getDate() - daysNum);

  const fromDate = prevPeriodStart.toISOString().slice(0, 10);
  const toDate = today.toISOString().slice(0, 10);
  const splitDate = periodStart.toISOString().slice(0, 10);

  try {
    const { rows } = await pool.query(
      `SELECT delivery_date, session, quantity_lt, price_lt_at_order, status
       FROM orders WHERE delivery_date >= $1 AND delivery_date <= $2`,
      [fromDate, toDate]
    );

    const currentOrders = rows.filter((o) => o.delivery_date.toISOString().slice(0, 10) >= splitDate);
    const previousOrders = rows.filter((o) => o.delivery_date.toISOString().slice(0, 10) < splitDate);

    const current = aggregate(currentOrders);
    const previous = aggregate(previousOrders);

    const settingsResult = await pool.query('SELECT daily_capacity_lt FROM producer_settings ORDER BY id LIMIT 1');
    const dailyCapacity = settingsResult.rows[0]?.daily_capacity_lt;

    const advice = buildAdvice(current, previous, daysNum, dailyCapacity);

    res.json({
      period_days: daysNum,
      current: {
        total_lt: current.total_lt,
        total_revenue: current.total_revenue,
        order_count: current.order_count,
        cancelled_count: current.cancelled_count,
        cancellation_rate: Number((current.cancellation_rate * 100).toFixed(1)),
        morning_lt: current.morning_lt,
        evening_lt: current.evening_lt,
      },
      previous: {
        total_lt: previous.total_lt,
        total_revenue: previous.total_revenue,
        order_count: previous.order_count,
      },
      advice,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Rapor olusturulurken hata olustu' });
  }
});

// Musteri icin gecmis siparislerine dayali basit oneri (AI kullanmiyor, en sik tekrar eden
// seans+miktar kombinasyonunu bulur)
router.get('/customer-suggestion', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT session, quantity_lt FROM orders
       WHERE customer_id = $1 AND status != 'cancelled'
       ORDER BY delivery_date DESC LIMIT 10`,
      [req.user.id]
    );

    if (rows.length < 3) {
      return res.json({ has_pattern: false });
    }

    const counts = {};
    rows.forEach((o) => {
      const key = `${o.session}|${o.quantity_lt}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    const [topKey, topCount] = Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a));

    if (topCount < 3) {
      return res.json({ has_pattern: false });
    }

    const [session, quantity_lt] = topKey.split('|');
    res.json({ has_pattern: true, session, quantity_lt: Number(quantity_lt), occurrences: topCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Oneri olusturulurken hata olustu' });
  }
});

module.exports = router;

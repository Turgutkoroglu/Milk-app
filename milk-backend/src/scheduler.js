const cron = require('node-cron');
const pool = require('./db');
const { notifyUser } = require('./notifications');
const { getProducerSettings, sessionWindow } = require('./cutoff');
const { formatTurkishDate, sessionLabel, formatTime } = require('./utils');

// Her gece 00:05'te calisir, aktif aboneliklerden bugunun siparislerini olusturur
function startScheduler() {
  cron.schedule('5 0 * * *', async () => {
    console.log('[zamanlayici] gunluk siparis uretimi basliyor...');
    await generateTodayOrdersFromSubscriptions();
  });
  console.log('[zamanlayici] baslatildi (her gece 00:05)');
}

async function generateTodayOrdersFromSubscriptions() {
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);
  const dayOfWeek = ((today.getDay() + 6) % 7) + 1; // Pazartesi=1 ... Pazar=7

  const settings = await getProducerSettings();

  const { rows: subs } = await pool.query(
    `SELECT * FROM subscriptions
     WHERE active = true
       AND start_date <= $1
       AND (end_date IS NULL OR end_date >= $1)
       AND $2 = ANY(days_of_week)`,
    [isoDate, dayOfWeek]
  );

  for (const sub of subs) {
    try {
      const { start } = sessionWindow(settings, sub.session);
      const { rows } = await pool.query(
        `INSERT INTO orders (customer_id, subscription_id, delivery_date, session, delivery_time, quantity_lt, price_lt_at_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (customer_id, delivery_date, session) DO NOTHING
         RETURNING *`,
        [sub.customer_id, sub.id, isoDate, sub.session, start, sub.quantity_lt, settings.price_per_lt || null]
      );
      if (rows.length > 0) {
        await notifyUser(
          sub.customer_id,
          'Bugünkü siparişin oluşturuldu',
          `${formatTurkishDate(isoDate)} ${sessionLabel(sub.session)} ${formatTime(start)} sağımı için ${sub.quantity_lt} litre siparişin otomatik oluşturuldu. Değiştirmek istersen kesim saatine kadar uygulamadan güncelleyebilirsin.`
        );
      }
    } catch (err) {
      console.error(`[zamanlayici] abonelik ${sub.id} icin siparis olusturulamadi:`, err.message);
    }
  }

  console.log(`[zamanlayici] ${subs.length} abonelik icin siparis kontrolu tamamlandi`);
}

module.exports = { startScheduler, generateTodayOrdersFromSubscriptions };

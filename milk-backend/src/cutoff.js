const pool = require('./db');

// Uretici ayarlarini getirir (tek uretici oldugu icin ilk satir alinir)
async function getProducerSettings() {
  const { rows } = await pool.query('SELECT * FROM producer_settings ORDER BY id LIMIT 1');
  return (
    rows[0] || {
      morning_start: '07:00',
      morning_end: '08:00',
      evening_start: '19:00',
      evening_end: '20:00',
      daily_capacity_lt: null,
      price_per_lt: null,
    }
  );
}

// Verilen seansin (sabah/aksam) baslangic-bitis saatlerini dondurur
function sessionWindow(settings, session) {
  if (session === 'morning') {
    return { start: settings.morning_start, end: settings.morning_end };
  }
  return { start: settings.evening_start, end: settings.evening_end };
}

// "HH:MM:SS" ya da "HH:MM" formatindaki saati dakikaya cevirir (karsilastirma icin)
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Secilen saat (delivery_time), o seansin izin verilen araligi icinde mi?
function isTimeWithinSession(deliveryTime, settings, session) {
  const { start, end } = sessionWindow(settings, session);
  const t = timeToMinutes(deliveryTime);
  return t >= timeToMinutes(start) && t <= timeToMinutes(end);
}

// Kesim ani: o gunun, o seansin BASLANGIC saati.
// Yani sabah siparisi icin kesim = o gunun sabah baslangic saati,
// aksam siparisi icin kesim = o gunun aksam baslangic saati.
async function getCutoffMoment(deliveryDate, session) {
  const settings = await getProducerSettings();
  const { start } = sessionWindow(settings, session);
  const [hour, minute] = start.split(':').map(Number);
  const cutoff = new Date(deliveryDate);
  cutoff.setHours(hour, minute, 0, 0);
  return cutoff;
}

// Bu tarih + seans icin siparis verme/degistirme/iptal etme suresi hala var mi?
async function canModifyOrder(deliveryDate, session) {
  const cutoff = await getCutoffMoment(deliveryDate, session);
  return new Date() < cutoff;
}

module.exports = {
  getProducerSettings,
  sessionWindow,
  isTimeWithinSession,
  canModifyOrder,
  getCutoffMoment,
};

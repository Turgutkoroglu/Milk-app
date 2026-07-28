const pool = require('./db');

const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

// "2026-07-27" -> "27 Temmuz"
function formatTurkishDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()]}`;
}

function sessionLabel(session) {
  return session === 'morning' ? 'sabah' : 'akşam';
}

// "18:30:00" ya da "18:30" -> "18:30"
function formatTime(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : '';
}

async function getUserFullName(userId) {
  const { rows } = await pool.query('SELECT full_name FROM users WHERE id = $1', [userId]);
  return rows[0]?.full_name || 'Bir müşteri';
}

module.exports = { formatTurkishDate, sessionLabel, formatTime, getUserFullName };

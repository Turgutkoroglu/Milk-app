const pool = require('./db');

// Mobil uygulama (Expo) her kullanici icin bir "Expo push token" uretip
// /auth/fcm-token ile buraya kaydediyor. Expo'nun kendi push servisi bunu
// FCM V1 (Android) / APNs (iOS) uzerinden cihaza iletiyor.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function notifyUser(userId, title, body) {
  await pool.query(
    'INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)',
    [userId, title, body]
  );

  const { rows } = await pool.query('SELECT fcm_token FROM users WHERE id = $1', [userId]);
  const pushToken = rows[0]?.fcm_token;

  if (!pushToken) {
    console.log(`[bildirim] kullanici ${userId} icin push token yok, sadece DB'ye yazildi: ${title}`);
    return;
  }

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: pushToken, title, body, sound: 'default' }),
    });

    const result = await res.json();
    const ticket = result?.data;

    if (ticket?.status === 'error') {
      console.error(
        `[bildirim] HATA kullanici ${userId}: ${ticket.message} (${ticket.details?.error || 'bilinmeyen'})`
      );
      // Token artik gecerli degilse (uygulama kaldirildi/token yenilendi), temizle
      if (ticket.details?.error === 'DeviceNotRegistered') {
        await pool.query('UPDATE users SET fcm_token = NULL WHERE id = $1', [userId]);
        console.log(`[bildirim] kullanici ${userId} icin gecersiz token temizlendi`);
      }
    } else if (ticket?.status === 'ok') {
      console.log(`[bildirim] OK kullanici ${userId}: "${title}" gonderildi (id: ${ticket.id})`);
    } else {
      console.log(`[bildirim] beklenmeyen cevap kullanici ${userId}:`, JSON.stringify(result));
    }
  } catch (err) {
    console.error(`[bildirim] Expo push istegi basarisiz (kullanici ${userId}):`, err.message);
  }
}

module.exports = { notifyUser };

const pool = require('./db');
const webpush = require('web-push');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || 'mailto:ornek@eposta.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function notifyUser(userId, title, body) {
  await pool.query(
    'INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)',
    [userId, title, body]
  );

  const { rows } = await pool.query(
    'SELECT fcm_token, web_push_subscription FROM users WHERE id = $1',
    [userId]
  );
  const pushToken = rows[0]?.fcm_token;
  const webSub = rows[0]?.web_push_subscription;

  if (!pushToken && !webSub) {
    console.log(`[bildirim] kullanici ${userId} icin hic push kaydi yok, sadece DB'ye yazildi: ${title}`);
    return;
  }

  if (pushToken) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ to: pushToken, title, body, sound: 'default' }),
      });
      const result = await res.json();
      const ticket = result?.data;
      if (ticket?.status === 'error') {
        console.error(`[bildirim] Expo HATA kullanici ${userId}: ${ticket.message}`);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await pool.query('UPDATE users SET fcm_token = NULL WHERE id = $1', [userId]);
        }
      } else if (ticket?.status === 'ok') {
        console.log(`[bildirim] Expo OK kullanici ${userId}: "${title}" gonderildi (id: ${ticket.id})`);
      }
    } catch (err) {
      console.error(`[bildirim] Expo push istegi basarisiz (kullanici ${userId}):`, err.message);
    }
  }

  if (webSub) {
    try {
      await webpush.sendNotification(webSub, JSON.stringify({ title, body }));
      console.log(`[bildirim] Web push OK kullanici ${userId}: "${title}" gonderildi`);
    } catch (err) {
      console.error(`[bildirim] Web push HATA kullanici ${userId}:`, err.message);
      if (err.statusCode === 404 || err.statusCode === 410) {
        await pool.query('UPDATE users SET web_push_subscription = NULL WHERE id = $1', [userId]);
      }
    }
  }
}

module.exports = { notifyUser };

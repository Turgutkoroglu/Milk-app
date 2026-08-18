require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const orderRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const reportRoutes = require('./routes/reports');
const { startScheduler } = require('./scheduler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/orders', orderRoutes);
app.use('/settings', settingsRoutes);
app.use('/reports', reportRoutes);

// PWA (web uygulamasi) build ciktisini sun - pwa-web'in bu projeyle kardes
// klasor oldugu varsayiliyor (orn. .../Milk_app/milk-backend ve
// .../Milk_app/pwa-web).
const pwaDistPath = process.env.PWA_DIST_PATH || path.join(__dirname, '..', '..', 'pwa-web', 'dist');

if (fs.existsSync(pwaDistPath)) {
  app.use(express.static(pwaDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(pwaDistPath, 'index.html'));
  });
  console.log(`[pwa] Web uygulamasi sunuluyor: ${pwaDistPath}`);
} else {
  console.log(`[pwa] Web uygulamasi bulunamadi (${pwaDistPath}), sadece API calisiyor.`);
}

// Genel hata yakalayici (route'lardan atlayan hatalar icin)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Beklenmeyen bir hata olustu' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda calisiyor`);
  startScheduler();
});

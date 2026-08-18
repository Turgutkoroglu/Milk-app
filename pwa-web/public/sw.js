// Bu dosya, tarayici sekmesi kapali olsa bile push bildirimlerini
// yakalayip gostermekten sorumlu. iOS'ta yalnizca ana ekrana eklenmis
// (standalone) PWA'larda calisir.

self.addEventListener('push', (event) => {
  let data = { title: 'Köroğlu Farm', body: 'Yeni bir bildirimin var' };
  try {
    data = event.data.json();
  } catch (err) {
    // JSON degilse varsayilani kullan
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

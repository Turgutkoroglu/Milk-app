import { api } from './api/client';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function registerWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Bu tarayici push bildirimlerini desteklemiyor.');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Bildirim izni verilmedi.');
    return;
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const { publicKey } = await api.getVapidPublicKey();
  if (!publicKey) {
    console.log('Sunucuda VAPID anahtari tanimli degil.');
    return;
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await api.saveWebPushSubscription(subscription.toJSON());
  console.log('Web push aboneligi kaydedildi.');
}

export function isRunningAsInstalledApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

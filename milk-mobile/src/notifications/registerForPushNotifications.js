import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { api } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Bildirim izni ister, Expo push token'ini alir ve backend'e kaydeder.
// Girisin hemen ardindan cagrilmali (App.js icinde kullaniliyor).
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push bildirimler sadece gercek cihazda calisir, simulatorde degil.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {

    Alert.alert(
      'Bildirim izni kapalı',
      'Sipariş ve duyuru bildirimlerini alabilmen için telefon ayarlarından bu uygulamaya bildirim izni vermen gerekiyor: Ayarlar > Uygulamalar > Köroğlu Farm > Bildirimler.'
    );
    return;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    Alert.alert('Teknik hata', 'EAS projectId bulunamadı, push token istenemedi.');
    return;
  }

  let expoPushToken;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    expoPushToken = tokenData.data;
  } catch (err) {
    Alert.alert('Bildirim kaydı başarısız', `Push token alınamadı: ${err.message}`);
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  try {
    await api.saveFcmToken(expoPushToken);
    console.log('Push token basariyla backende kaydedildi.');
  } catch (err) {
    Alert.alert('Bildirim kaydı başarısız', `Sunucuya kaydedilemedi: ${err.message}`);
  }

  return expoPushToken;
}

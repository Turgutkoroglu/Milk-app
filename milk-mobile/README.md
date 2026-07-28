# Süt Siparişi - Mobil Uygulama (Expo / React Native)

## Kurulum

```bash
npm install -g expo-cli   # ilk kurulumda gerekebilir (genelde npx yeterli)
npm install
```

`src/api/client.js` içindeki `API_BASE_URL` değerini kendi backend adresinle değiştir:
- Aynı Wi-Fi ağındaki fiziksel telefonda test ediyorsan: bilgisayarının yerel IP'si (`http://192.168.1.20:3000` gibi — `ipconfig`/`ifconfig` ile bulabilirsin)
- Canlıda: DDNS/domain adresin (`https://sutcum.duckdns.org`)

## Çalıştırma

```bash
npx expo start
```

Açılan QR kodu telefonuna kurduğun **Expo Go** uygulamasıyla okut — Xcode veya Android Studio kurmana gerek yok. Kod her değiştiğinde uygulama otomatik yenilenir.

## Test akışı

1. Backend'i çalıştır (`sut-backend` projesi, ayrı terminalde `npm start`)
2. Önce **üretici** rolüyle bir hesap kaydet (sistemde tek üretici olabildiğini unutma)
3. Sonra bir **müşteri** hesabı kaydet, sipariş/abonelik oluştur
4. Üretici hesabıyla giriş yapıp "Siparişler" sekmesinden gelen siparişi gör

## Push bildirimler

- Bildirimler sadece **gerçek cihazda** çalışır, Expo Go simülatöründe/emülatöründe çalışmaz
- Kullanıcı giriş yaptığında uygulama otomatik olarak bildirim izni ister ve Expo push token'ını backend'e kaydeder
- Gerçek gönderim `sut-backend/src/notifications.js` içinde Expo'nun push servisi üzerinden yapılıyor — Firebase/Apple tarafında ayrıca kurulum gerekmiyor

## Eksik olan / sonraki adımlar

- **Splash/loading ekranı**: `RootNavigator.js` içinde `loading` durumunda şu an boş ekran dönüyor, basit bir yükleniyor ekranı eklenebilir
- **Token doğrulama**: Uygulama açılışında kayıtlı token'ın hâlâ geçerli olup olmadığını kontrol eden bir `/auth/me` endpoint'i yok — token süresi dolmuşsa kullanıcı hataları giriş ekranına düşene kadar görebilir
- **Gerçek cihazda derleme (production build)**: Mağazalara yüklemek için `eas build` ile derleme yapılması gerekecek (App Store / Play Store hesapları gerekli)
- **İkon/splash görselleri**: `assets/` klasörü henüz yok, gerçek bir logo eklenmeli

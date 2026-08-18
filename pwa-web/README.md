# Köroğlu Farm — Web (PWA) Uygulaması

Android/mobil uygulamanın aynı backend'ini kullanan, özellikle **iPhone**
kullanıcıları için tasarlanmış web versiyonu. iOS 16.4+ üzerinde Safari'den
"Ana Ekrana Ekle" ile kurulduğunda gerçek bir uygulama gibi çalışır, push
bildirimleri de destekler.

## ⚠️ İlk yapman gereken şey: gerçek ikonu koy

Sandbox'ın sıfırlanması nedeniyle `public/icons/` içine geçici bir "KF"
yazılı placeholder ikon koydum — senin gerçek inek logon değil. Kendi
mobil projendeki gerçek ikonu buraya kopyala:

```bash
cp ~/Desktop/Milk_app/milk-mobile/assets/icon.png /tmp/icon-src.png
python3 -c "
from PIL import Image
img = Image.open('/tmp/icon-src.png').convert('RGB')
img.resize((192,192)).save('public/icons/icon-192.png')
img.resize((512,512)).save('public/icons/icon-512.png')
"
```

## Kurulum (geliştirme/test)

```bash
npm install
```

`src/api/client.js` içindeki `API_BASE_URL`'in mobil uygulamadaki ile aynı
(gerçek Tailscale adresin) olduğunu kontrol et.

```bash
npm run dev
```
Push bildirimler sadece HTTPS üzerinde çalışır, yerel geliştirmede push'u
test edemezsin — bunun için gerçek sunucuya deploy etmen gerekir.

## Backend tarafında yapılması gerekenler (bir kereliğine)

```bash
cd ~/Desktop/Milk_app/milk-backend
npm install          # web-push paketi eklendi
npm run migrate:003  # web_push_subscription kolonunu ekler
```

`.env` dosyana VAPID anahtarlarını ekle:
```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```
Çıkan `publicKey`/`privateKey` değerlerini `.env`'e yaz:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_CONTACT_EMAIL=mailto:senin-eposta-adresin@ornek.com
```

```bash
pm2 restart milk-backend
```

## Canlıya alma (production build)

```bash
npm run build
```
Bu, statik dosyaları `dist/` klasörüne üretir. Backend (`server.js`),
`pwa-web`'in kendisiyle **kardeş klasör** olduğu varsayımıyla bu `dist/`
klasörünü otomatik bulup sunuyor — yani `milk-backend` ve `pwa-web`
klasörlerinin aynı üst klasörde (`Milk_app/`) durması yeterli, ekstra bir
Nginx/domain kurulumuna gerek yok. Tailscale Funnel zaten aynı adresten
hem API'yi hem bu web uygulamasını sunacak.

## Müşterilerin kurması

1. Sana verdiğin linki (örn. `https://.../`) Safari'de açsınlar (iPhone'da mutlaka Safari, Chrome değil)
2. Alt kısımdaki **Paylaş** ikonuna dokunsunlar
3. **"Ana Ekrana Ekle"**'yi seçsinler
4. Ana ekranda oluşan ikona dokunup uygulamayı açsınlar, giriş yapsınlar
5. Bildirim izni sorulduğunda **İzin Ver** desinler

## Bu web versiyonunda basitleştirilen kısımlar

- **Gece/gündüz modu yok** — tek bir sabit tema (marka renkleri) kullanılıyor.
- Mobil uygulamadaki bazı ince detaylar web'de doğal olarak yok.

## Sorun giderme

- Push bildirim gelmiyor → kullanıcı gerçekten "Ana Ekrana Ekle" ile mi kurdu?
- "Ana Ekrana Ekle" görünmüyor → Chrome/Firefox olabilir, Safari şart.
- API çağrıları başarısız → `API_BASE_URL` ve backend'in ayakta olduğunu kontrol et.

# Süt sipariş uygulaması - Backend

Node.js/Express + PostgreSQL. Tek üretici, çok müşteri modeli.

## Kurulum

```bash
npm install
cp .env.example .env
# .env dosyasını kendi bilgilerinle doldur (DATABASE_URL, JWT_SECRET)

# PostgreSQL'de bir veritabanı oluştur, örn:
# createdb sut_db

npm run migrate   # schema.sql'i veritabanına uygular (yeni kurulum)
npm start          # sunucuyu başlatır (http://localhost:3000)
```

## Zaten çalışan bir kurulumun varsa (mevcut veritabanını güncelleme)

Sabah/akşam sağım modeli, IBAN, genel not ve fiyat gösterimi eklendi. Zaten
kurulu bir veritabanın varsa, `npm run migrate` bunu **güncellemez** (tablolar
zaten var). Onun yerine:

```bash
npm run migrate:002
pm2 restart milk-backend
```

## API özeti (güncel)

| Endpoint | Rol | Açıklama |
|---|---|---|
| `POST /auth/register` | herkes | Kayıt (role: customer/producer) |
| `POST /auth/login` | herkes | Giriş, JWT döner |
| `POST /auth/fcm-token` | giriş yapmış | Push bildirim token'ını kaydeder |
| `POST /subscriptions` | customer | Tekrarlayan sipariş (session: morning/evening) |
| `GET /subscriptions` | customer | Kendi aboneliklerini listele |
| `PATCH /subscriptions/:id/deactivate` | customer | Aboneliği durdur |
| `POST /orders` | customer | `{delivery_date, session, delivery_time, quantity_lt}` — sipariş oluştur/güncelle, `total_price` döner |
| `GET /orders?date=&session=` | customer/producer | customer: kendi siparişleri, producer: hepsi (filtrelenebilir) |
| `GET /orders/summary?date=&session=` | producer | O gün/seans için toplam litre özeti |
| `PATCH /orders/:id` | customer | Sipariş miktarını güncelle (kesim saatine kadar) |
| `PATCH /orders/:id/cancel` | customer | Siparişi iptal et — üreticiye bildirim gider |
| `GET /settings` | giriş yapmış | Sabah/akşam saatleri, fiyat, IBAN, genel not |
| `PUT /settings` | producer | Günceller, tüm müşterilere bildirim gönderir |

**Kesim saati mantığı:** Artık sabit bir saat değil — her seansın **kendi başlangıç
saati** kesim anı oldu. Örnek: sabah satışı 07:00-08:00 ise, o günün sabah sütü
için son sipariş/değişiklik/iptal saati 07:00'dir.

## Ev bilgisayarında sunucu olarak çalıştırmak için

1. **DDNS**: DuckDNS veya No-IP ile ücretsiz bir domain al (örn. `sutcum.duckdns.org`)
2. **Port yönlendirme**: Router ayarlarından 443 portunu bu bilgisayarın iç IP'sine yönlendir
3. **Ters proxy + HTTPS**: Nginx kurup Certbot (Let's Encrypt) ile ücretsiz SSL sertifikası al, Nginx'i bu Express uygulamasına (port 3000) yönlendir
4. **Kalıcı çalıştırma**: `pm2` kullan (`npm i -g pm2 && pm2 start src/server.js`) — bilgisayar yeniden başlasa bile uygulama otomatik ayağa kalksın diye `pm2 startup` çalıştır
5. iOS uygulaması HTTP'ye izin vermez, bu yüzden 2-3 adımlar zorunlu

*(Not: CGNAT/statik IP olmayan bağlantılarda Tailscale Funnel veya Cloudflare Tunnel kullanılabilir, bu README'nin kapsamı dışında ayrıca konuştuk.)*

## Eksik olan / sonraki adımlar

- **Bildirim hata yönetimi**: `src/notifications.js` Expo push servisine istek atıyor ama gelen yanıtı (örn. token geçersiz hatası) şu an kontrol etmiyor, sadece network hatasını yakalıyor.
- **Şifre sıfırlama**: SMS doğrulama ile telefon numarası tabanlı şifre sıfırlama henüz yok.
- **Kapasite kontrolü**: `producer_settings.daily_capacity_lt` şu an sadece özet olarak gösteriliyor, sipariş kabul ederken otomatik reddetme yok — istersen `orders.js` içindeki POST endpoint'ine kapasite kontrolü ekleyebiliriz.
- **Testler**: Henüz otomatik test yok.

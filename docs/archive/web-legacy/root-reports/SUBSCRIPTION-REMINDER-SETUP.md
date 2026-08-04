# 📧 Abonelik Hatırlatma Sistemi Kurulum Rehberi

## 🎯 Özellikler

### Otomatik Email Bildirimleri:
- ⏰ **7 gün kala** - Bilgilendirme
- ⚠️ **3 gün kala** - Uyarı
- 🔴 **1 gün kala** - Acil uyarı

### Akıllı Tracking:
- ✅ Aynı kullanıcıya 24 saat içinde tekrar email gönderilmez
- ✅ Gönderilen tüm bildirimler database'de loglanır
- ✅ İstatistikler ve raporlama

---

## 📋 KURULUM ADIMLARI

### 1️⃣ Database Setup (5 dakika)

**Supabase SQL Editor'de çalıştırın:**

```sql
-- database/07-subscription-expiration-reminder.sql dosyasını çalıştırın
```

**Oluşturulanlar:**
- ✅ `get_expiring_subscriptions_with_tracking()` function
- ✅ `record_subscription_notification()` function
- ✅ `subscription_notifications` table
- ✅ RLS policies
- ✅ Indexes

**Test:**
```sql
-- Yakında sona erecek abonelikleri listele
SELECT * FROM get_expiring_subscriptions_with_tracking();
```

---

### 2️⃣ Edge Function Deploy (2 dakika)

**Supabase Dashboard:**

1. **Edge Functions** → **Create new function**
2. **Name:** `subscription-expiration-reminder`
3. **Code:** `supabase/functions/subscription-expiration-reminder/index.ts` dosyasını kopyalayın
4. **Deploy** butonuna tıklayın

**Environment Variables:**
- `RESEND_API_KEY` - Zaten mevcut ✅
- `SUPABASE_URL` - Otomatik ✅
- `SUPABASE_SERVICE_ROLE_KEY` - Otomatik ✅

---

### 3️⃣ Cron Job Setup (3 dakika)

**Supabase Dashboard → Database → Cron Jobs:**

#### Job 1: Expire Subscriptions (Her gün 02:00)

```
Name: daily_subscription_expiration
Schedule: 0 2 * * *
Command:
UPDATE public.subscriptions
SET tier = 'free', status = 'expired', cancelled_at = NOW()
WHERE end_date < NOW() AND tier != 'free' AND status = 'active';
```

#### Job 2: Send Expiration Reminders (Her gün 10:00)

**Bir defaya mahsus uzantıyı aktif edin (SQL Editor üzerinden):**
```sql
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
```

**Sonra Cron Job oluşturun:**
```
Name: daily_expiration_reminders
Schedule: 0 10 * * *
Command:
SELECT net.http_post(
  url := 'https://YOUR_PROJECT.supabase.co/functions/v1/subscription-expiration-reminder',
  headers := jsonb_build_object(
    'Authorization',
    'Bearer YOUR_SERVICE_ROLE_KEY'
  )
);
```

**⚠️ ÖNEMLİ:** 
- `YOUR_PROJECT` yerine Supabase project ref'inizi yazın
- `YOUR_SERVICE_ROLE_KEY` yerine service role key'inizi yazın
  - Supabase Dashboard → Project Settings → API → service_role key

---

### 4️⃣ Test (2 dakika)

#### Manuel Test (Terminal):

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/subscription-expiration-reminder \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

#### Test Aboneliği Oluştur (SQL):

```sql
-- Test için 2 gün sonra sona erecek abonelik oluştur
UPDATE public.subscriptions
SET 
  tier = 'pro',
  status = 'active',
  end_date = NOW() + INTERVAL '2 days'
WHERE user_id = 'YOUR_USER_ID';

-- Şimdi Edge Function'ı tetikle (yukarıdaki curl komutu)
-- Email gelmeli!
```

---

## 📊 Monitoring & Logs

### Supabase Logs:

**Edge Functions → subscription-expiration-reminder → Logs**

Başarılı çalışma:
```
🔍 Checking for expiring subscriptions...
📧 Found 3 expiring subscriptions
✅ Email sent to user@example.com (2 days remaining)
✅ Notification recorded for user@example.com
✅ Sent 3 emails successfully
```

### Database Logs:

```sql
-- Son gönderilen bildirimler
SELECT 
  sn.notification_type,
  sn.sent_at,
  sn.email_status,
  u.email,
  s.tier,
  s.end_date
FROM public.subscription_notifications sn
JOIN auth.users u ON u.id = sn.user_id
JOIN public.subscriptions s ON s.id = sn.subscription_id
ORDER BY sn.sent_at DESC
LIMIT 10;

-- İstatistikler (son 30 gün)
SELECT 
  notification_type,
  COUNT(*) as total_sent,
  COUNT(DISTINCT user_id) as unique_users,
  DATE(sent_at) as sent_date
FROM public.subscription_notifications
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY notification_type, DATE(sent_at)
ORDER BY sent_date DESC;
```

---

## 🎨 Email Template Özellikleri

### Profesyonel Tasarım:
- ✅ Gradient header (brand colors)
- ✅ Responsive design
- ✅ Aciliyet göstergeleri (🔴 ⚠️ 📢)
- ✅ Plan avantajları listesi
- ✅ CTA button (Aboneliği Yenile)
- ✅ Önemli uyarı kutusu

### Dinamik İçerik:
- Kullanıcı adı
- Kalan gün sayısı
- Plan tipi (PRO/PREMIUM)
- Bitiş tarihi
- Plan özellikler

---

## 🔧 Troubleshooting

### ❌ "No expiring subscriptions found"
**Sebep:** Yakında sona erecek abonelik yok
**Çözüm:** Normal, test için yukarıdaki SQL ile test aboneliği oluşturun

### ❌ "RESEND_API_KEY not configured"
**Sebep:** API key eksik
**Çözüm:** Supabase → Edge Functions → Secrets → `RESEND_API_KEY` ekleyin

### ❌ "Failed to record notification"
**Sebep:** Database function çalışmıyor
**Çözüm:** `database/07-subscription-expiration-reminder.sql` dosyasını çalıştırın

### ❌ Email gelmiyor
**Çözüm:**
1. Spam klasörünü kontrol edin
2. Resend Dashboard → Logs → Email durumunu kontrol edin
3. Edge Function logs'unu kontrol edin

### ❌ Aynı email tekrar tekrar geliyor
**Sebep:** Notification tracking çalışmıyor
**Çözüm:** 
```sql
-- Tracking tablosunu kontrol edin
SELECT * FROM public.subscription_notifications 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY sent_at DESC;
```

---

## 📅 Cron Schedule Açıklaması

### `0 2 * * *` (Her gün 02:00)
- Süresi dolan abonelikleri FREE'ye düşür
- Gece saatinde çalışır (kullanıcı etkilenmez)

### `0 10 * * *` (Her gün 10:00)
- Hatırlatma emaillerini gönder
- Sabah saatinde (kullanıcı aktif olabilir)
- 24 saat içinde tekrar gönderilmez

**Özelleştirme:**
```
0 10 * * *  → Her gün 10:00
0 14 * * *  → Her gün 14:00
0 10,18 * * *  → Her gün 10:00 ve 18:00
0 10 * * 1-5  → Hafta içi her gün 10:00
```

---

## 🎯 Email Gönderim Mantığı

### 7 Gün Kala:
- İlk bildirim
- Bilgilendirme tonu
- "Aboneliğiniz yakında sona erecek"

### 3 Gün Kala:
- İkinci bildirim
- Uyarı tonu
- "Aboneliğinizi yenilemeyi unutmayın"

### 1 Gün Kala:
- Son bildirim
- Acil tonu
- "Aboneliğiniz yarın sona eriyor"

### Süresi Dolduktan Sonra:
- Otomatik FREE'ye düşer
- Email gönderilmez (zaten çok geç)

---

## 📊 Örnek Senaryo

**Kullanıcı:** Ahmet (PRO plan)
**Bitiş Tarihi:** 15 Ocak 2025

| Tarih | Gün | Email | İçerik |
|-------|-----|-------|--------|
| 8 Ocak | -7 | ✅ Gönderildi | "📢 Aboneliğiniz 7 gün sonra sona eriyor" |
| 9 Ocak | -6 | ❌ Gönderilmedi | 24 saat geçmedi |
| 12 Ocak | -3 | ✅ Gönderildi | "⚠️ Aboneliğiniz 3 gün sonra sona eriyor" |
| 14 Ocak | -1 | ✅ Gönderildi | "🔴 Aboneliğiniz yarın sona eriyor" |
| 15 Ocak | 0 | ❌ Email yok | Otomatik FREE'ye düştü |

---

## ✅ Checklist

### Database:
- [ ] `database/07-subscription-expiration-reminder.sql` çalıştırıldı
- [ ] Functions test edildi
- [ ] `subscription_notifications` table oluşturuldu

### Edge Function:
- [ ] `subscription-expiration-reminder` deploy edildi
- [ ] Environment variables kontrol edildi
- [ ] Manuel test yapıldı (curl)

### Cron Jobs:
- [ ] HTTP extension aktif edildi
- [ ] Expiration cron job oluşturuldu (02:00)
- [ ] Reminder cron job oluşturuldu (10:00)
- [ ] Project ref ve service role key güncellendi

### Test:
- [ ] Test aboneliği oluşturuldu
- [ ] Email gönderimi test edildi
- [ ] Tracking çalışıyor mu kontrol edildi
- [ ] Logs kontrol edildi

---

## 💰 Maliyet

**Resend (Ücretsiz Plan):**
- 3,000 email/ay
- Günde ~100 email
- Yeterli! (çoğu günde 0-10 email gönderilir)

**Supabase:**
- Cron jobs ücretsiz
- Edge Functions ücretsiz (500K çağrı/ay)

**Toplam:** $0 (Mevcut planlar dahilinde)

---

## 🎉 Sonuç

**Sistem Kuruldu! 🚀**

- ✅ Otomatik email bildirimleri
- ✅ Akıllı tracking (tekrar gönderim yok)
- ✅ Profesyonel email template
- ✅ Detaylı logging
- ✅ Tamamen otomatik

**Kullanıcılar artık abonelik bitiş tarihlerini kaçırmayacak!**

---

## 📞 Destek

**Sorularınız için:**
- Email: info@davetim.app
- Phone: +905359216894

**Dokümantasyon:**
- Database: `database/07-subscription-expiration-reminder.sql`
- Edge Function: `supabase/functions/subscription-expiration-reminder/index.ts`
- Production: `PRODUCTION-CHECKLIST.md`


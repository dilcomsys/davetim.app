# Abonelik Sona Erme Yönetimi

## 📋 Genel Bakış

Davetim.app platformunda abonelikler **otomatik yenilenmez**. Abonelik süresi dolduğunda kullanıcılar otomatik olarak FREE plana düşürülmelidir.

## ⚠️ Mevcut Durum

- ✅ Frontend'de `end_date` kontrolü var
- ✅ Kullanıcı arayüzünde süre bilgisi gösteriliyor
- ❌ **Backend'de otomatik downgrade sistemi YOK**
- ❌ **Cron job kurulmamış**

## 🔧 Çözüm Seçenekleri

### Seçenek 1: Supabase Cron Job (Önerilen)

**Avantajlar:**
- Tam otomatik
- Sunucu tarafında çalışır
- Güvenilir ve hızlı

**Kurulum:**
1. Supabase Dashboard > Database > Cron Jobs
2. "Create New Job" tıklayın
3. Ayarlar:
   - **Job Name:** `daily_subscription_expiration_check`
   - **Schedule:** `0 2 * * *` (Her gün saat 02:00)
   - **Command:**
   ```sql
   UPDATE public.subscriptions
   SET 
       tier = 'free',
       status = 'expired',
       cancelled_at = NOW()
   WHERE end_date < NOW()
     AND tier != 'free'
     AND status = 'active';
   ```

### Seçenek 2: Manuel SQL Sorgusu

**Kullanım:**
- Günlük olarak manuel çalıştırın
- Veya haftalık bakım sırasında

**Dosya:** `database/06-subscription-expiration-check.sql`

```bash
# Supabase SQL Editor'de çalıştırın
psql -h <your-supabase-host> -U postgres -d postgres -f database/06-subscription-expiration-check.sql
```

### Seçenek 3: Supabase Edge Function

**Avantajlar:**
- Daha fazla kontrol
- Bildirim gönderme imkanı
- Loglama

**Dezavantajlar:**
- Daha karmaşık
- Ayrı deployment gerekir

## 📊 İzleme ve Raporlama

### Süresi Dolan Abonelikleri Kontrol Et

```sql
SELECT 
    u.email,
    s.tier,
    s.end_date,
    NOW() - s.end_date as expired_duration
FROM public.subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.end_date < NOW()
  AND s.tier != 'free'
  AND s.status = 'active'
ORDER BY s.end_date ASC;
```

### Yakında Sona Erecek Abonelikler (7 gün)

```sql
SELECT 
    u.email,
    s.tier,
    s.end_date,
    EXTRACT(DAY FROM s.end_date - NOW()) as days_remaining
FROM public.subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.end_date > NOW()
  AND s.end_date < NOW() + INTERVAL '7 days'
  AND s.tier != 'free'
ORDER BY s.end_date ASC;
```

## 🔔 Bildirim Sistemi (Opsiyonel)

Kullanıcılara abonelik sona ermeden önce e-posta göndermek için:

1. **3 gün kala:** "Aboneliğiniz yakında sona eriyor"
2. **Son gün:** "Aboneliğiniz yarın sona eriyor"
3. **Sona erdikten sonra:** "Aboneliğiniz sona erdi, FREE plana geçtiniz"

## 🚀 Hemen Yapılması Gerekenler

1. ✅ **Watermark özelliği eklendi** (FREE plan için)
2. ⚠️ **Cron job kurulmalı** (Yukarıdaki adımları takip edin)
3. 📧 **E-posta bildirimleri** (İsteğe bağlı, gelecek için)

## 📝 Test Senaryosu

```sql
-- 1. Test kullanıcısı oluştur
-- 2. PRO abonelik ver, end_date'i geçmişe ayarla
UPDATE public.subscriptions
SET 
    tier = 'pro',
    end_date = NOW() - INTERVAL '1 day'
WHERE user_id = '<test-user-id>';

-- 3. Expiration check çalıştır
-- (Yukarıdaki UPDATE sorgusunu çalıştır)

-- 4. Kontrol et
SELECT tier, status FROM public.subscriptions WHERE user_id = '<test-user-id>';
-- Beklenen: tier = 'free', status = 'expired'
```

## 🔒 Güvenlik Notları

- ✅ Sadece `end_date < NOW()` olan kayıtlar güncellenir
- ✅ `tier != 'free'` kontrolü ile FREE kullanıcılar etkilenmez
- ✅ `status = 'active'` kontrolü ile zaten expired olanlar tekrar işlenmez
- ✅ `cancelled_at` timestamp'i güncellenir

## 📞 Destek

Sorun yaşarsanız:
- Database loglarını kontrol edin
- `database/06-subscription-expiration-check.sql` dosyasını inceleyin
- Test ortamında önce deneyin


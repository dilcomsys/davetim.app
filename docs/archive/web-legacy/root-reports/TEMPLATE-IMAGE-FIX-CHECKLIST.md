# ✅ Template Görsel Sorunu - Kontrol Listesi

## 🔍 Sorun
Supabase Storage'a yüklenen görsel (`wedding/bohemian.jpg`) şablonlar sayfasında görünmüyor.

## ✅ Yapılan Düzeltmeler

### 1. Frontend Güncellemeleri ✅

#### `TemplateCard.tsx`
- ❌ Eski: `getOptimizedUnsplashUrl()` kullanıyordu
- ✅ Yeni: `getTemplateThumbnailUrl()` kullanıyor
- ✅ Import değiştirildi
- ✅ `srcSet` kaldırıldı (Supabase kendi optimization'ı yapıyor)

#### `HomePage.tsx`
- ❌ Eski: `getOptimizedUnsplashUrl()` kullanıyordu
- ✅ Yeni: `getTemplateThumbnailUrl()` kullanıyor
- ✅ Import değiştirildi

### 2. Helper Fonksiyon Oluşturuldu ✅

**`frontend/src/utils/templateImageUrl.ts`**
- ✅ `getTemplateImageUrl()` - Path'i tam URL'e çevirir
- ✅ `getTemplateThumbnailUrl()` - Küçük boyut (400x300)
- ✅ `getTemplateFullUrl()` - Büyük boyut (800x600)
- ✅ Placeholder desteği

### 3. Database Kontrol SQL'i ✅

**`database/TEST-BOHEMIAN-TEMPLATE.sql`**
- ✅ Mevcut template'i kontrol eder
- ✅ Yoksa ekler, varsa günceller
- ✅ Path'in doğru olduğunu doğrular

## 🚀 Şimdi Yapılması Gerekenler

### 1️⃣ Database'i Kontrol Et

```sql
-- Supabase SQL Editor'de çalıştır:
\i database/TEST-BOHEMIAN-TEMPLATE.sql
```

Bu komut:
- Bohem Düğün template'inin var olup olmadığını kontrol eder
- Path'in `wedding/bohemian.jpg` olduğunu doğrular
- Yoksa ekler, varsa günceller

### 2️⃣ Frontend'i Yeniden Başlat

```bash
# Terminal'de:
cd frontend
npm run dev
```

Değişiklikler hot-reload ile yüklenmeli, ama emin olmak için yeniden başlatın.

### 3️⃣ Tarayıcıyı Yenile

- Hard refresh: `Ctrl+Shift+R` (Windows) veya `Cmd+Shift+R` (Mac)
- Cache'i temizle

### 4️⃣ Kontrol Et

1. **Ana Sayfa** (`/`) → "Öne Çıkan Şablonlar" bölümüne bak
2. **Şablonlar** (`/templates`) → "Wedding" kategorisine bak
3. **Bohem Düğün** template'ini bul
4. Görsel görünüyor mu?

## 🔍 Hata Ayıklama

### Görsel Hala Görünmüyorsa:

#### 1. Console'u Kontrol Et
Tarayıcı Console'da (F12) hata var mı?

```javascript
// Beklenen URL formatı:
https://lwowqdxysoqrwoylhouy.supabase.co/storage/v1/object/public/templates/wedding/bohemian.jpg?width=400&height=300&resize=cover
```

#### 2. Network Tab'ı Kontrol Et
- F12 → Network tab
- Sayfayı yenile
- `bohemian.jpg` isteğini bul
- Status: 200 OK mi?
- Yoksa 404 mu?

#### 3. Database'i Kontrol Et

```sql
-- Template var mı?
SELECT * FROM templates WHERE subcategory = 'bohemian';

-- Path doğru mu?
SELECT thumbnail_url, default_image_url 
FROM templates 
WHERE subcategory = 'bohemian';

-- Beklenen: 'wedding/bohemian.jpg'
```

#### 4. Storage'ı Kontrol Et

Supabase Dashboard:
1. Storage → `templates` bucket
2. `wedding/` klasörü var mı?
3. `bohemian.jpg` dosyası var mı?
4. Dosya boyutu 0 KB değil mi?

#### 5. Manuel URL Test

Tarayıcıda direkt aç:
```
https://lwowqdxysoqrwoylhouy.supabase.co/storage/v1/object/public/templates/wedding/bohemian.jpg
```

- ✅ Görsel açılıyorsa: Frontend sorunu
- ❌ 404 hatası: Storage sorunu
- ❌ 403 hatası: RLS policy sorunu

## 🐛 Olası Sorunlar ve Çözümler

### Sorun 1: Template DB'de Yok
**Çözüm:**
```sql
\i database/TEMPLATES-WITH-STORAGE-IMAGES.sql
```

### Sorun 2: Path Yanlış
**Çözüm:**
```sql
UPDATE templates 
SET thumbnail_url = 'wedding/bohemian.jpg',
    default_image_url = 'wedding/bohemian.jpg'
WHERE subcategory = 'bohemian';
```

### Sorun 3: Storage'da Dosya Yok
**Çözüm:**
- Supabase Dashboard → Storage → `templates`
- `wedding/` klasörüne `bohemian.jpg` yükle

### Sorun 4: RLS Policy Sorunu
**Çözüm:**
```sql
-- Public read policy var mı kontrol et:
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Yoksa ekle:
\i database/CREATE-TEMPLATES-BUCKET.sql
```

### Sorun 5: Cache Sorunu
**Çözüm:**
- Tarayıcı cache'ini temizle
- Hard refresh: `Ctrl+Shift+R`
- Incognito/Private mode'da dene

## ✅ Başarı Kontrolü

Görsel görünüyorsa:
- ✅ Storage doğru kurulmuş
- ✅ Database path'leri doğru
- ✅ Frontend helper fonksiyonlar çalışıyor
- ✅ RLS policies doğru

Şimdi diğer 104 template için de görselleri yükleyebilirsiniz!

## 📝 Sonraki Adımlar

1. ✅ Bohem Düğün çalışıyor mu? → Evet ise devam
2. 📸 Diğer Wedding template'leri için görselleri yükle (14 adet)
3. 📸 Engagement template'leri (10 adet)
4. 📸 Birthday template'leri (15 adet)
5. 📸 ... (toplam 105 template)

---

**Not:** Her template için görsel yükleme formatı:
```
storage/templates/{category}/{subcategory}.jpg
```

Örnek:
- `wedding/classic.jpg`
- `wedding/romantic.jpg`
- `engagement/luxury.jpg`
- `birthday/princess.jpg`


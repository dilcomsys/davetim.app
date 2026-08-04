# 🎉 105 Template Kurulum Rehberi

## 📊 Dağılım

- **FREE**: 38 template
- **PRO**: 42 template  
- **PREMIUM**: 25 template
- **TOPLAM**: 105 template

## 📁 SQL Dosyaları

Tüm template'ler Supabase Storage path'leri kullanıyor: `{category}/{subcategory}.jpg`

### 1. Wedding + Engagement (25)
```sql
\i database/TEMPLATES-WITH-STORAGE-IMAGES.sql
```
- 15 Wedding template
- 10 Engagement template

### 2. Birthday + Baby Shower (23)
```sql
\i database/REMAINING-80-TEMPLATES.sql
```
- 15 Birthday template
- 8 Baby Shower template

### 3. Graduation + Corporate + Anniversary (32)
```sql
\i database/REMAINING-57-TEMPLATES-PART2.sql
```
- 8 Graduation template
- 8 Corporate template
- 8 Anniversary template

### 4. Henna + Circumcision + Celebration + Engagement Dinner + Bachelor Party (25)
```sql
\i database/REMAINING-25-TEMPLATES-PART3.sql
```
- 7 Henna template
- 7 Circumcision template
- 8 Celebration template
- 5 Engagement Dinner template
- 6 Bachelor Party template

## 🚀 Hızlı Kurulum

### Adım 1: Tüm Template'leri Sil (Opsiyonel)
```sql
DELETE FROM templates;
```

### Adım 2: Tüm SQL'leri Çalıştır
Supabase SQL Editor'de sırayla:

```sql
-- 1. Wedding + Engagement (25)
\i database/TEMPLATES-WITH-STORAGE-IMAGES.sql

-- 2. Birthday + Baby Shower (23)
\i database/REMAINING-80-TEMPLATES.sql

-- 3. Graduation + Corporate + Anniversary (32)
\i database/REMAINING-57-TEMPLATES-PART2.sql

-- 4. Henna + Circumcision + Celebration + Engagement Dinner + Bachelor Party (25)
\i database/REMAINING-25-TEMPLATES-PART3.sql
```

### Adım 3: Doğrulama
```sql
-- Toplam template sayısı
SELECT COUNT(*) as total FROM templates;
-- Sonuç: 105

-- Tier dağılımı
SELECT tier, COUNT(*) 
FROM templates 
GROUP BY tier 
ORDER BY tier;
-- FREE: 38
-- PRO: 42
-- PREMIUM: 25

-- Kategori dağılımı
SELECT category, COUNT(*) 
FROM templates 
GROUP BY category 
ORDER BY COUNT(*) DESC;
```

## 📸 Görselleri Yükleme

### Supabase Storage Yapısı
```
storage/templates/
├── wedding/
│   ├── classic.jpg
│   ├── modern.jpg
│   ├── luxury.jpg
│   └── ...
├── engagement/
│   ├── classic.jpg
│   ├── modern.jpg
│   └── ...
├── birthday/
│   ├── fun.jpg
│   ├── kids.jpg
│   └── ...
└── ... (diğer kategoriler)
```

### Görseller Hangi Yolda?
Her template için:
- `thumbnail_url`: `{category}/{subcategory}.jpg`
- `default_image_url`: `{category}/{subcategory}.jpg`

Örnek:
- Wedding Classic: `wedding/classic.jpg`
- Birthday Fun: `birthday/fun.jpg`
- Engagement Luxury: `engagement/luxury.jpg`

### Manuel Yükleme
1. Supabase Dashboard → Storage → templates bucket
2. Her kategori için klasör oluştur
3. Görselleri yükle

### Toplu Yükleme (CLI)
```bash
# Wedding kategorisi
supabase storage upload templates/wedding wedding-classic.jpg --create
supabase storage upload templates/wedding wedding-modern.jpg --create
# ... devam et
```

## ✅ Tamamlanan Kategoriler

- ✅ **Wedding (15)**: Görseller yüklendi
- ✅ **Engagement (10)**: Görseller yüklendi
- ⏳ **Birthday (15)**: SQL hazır, görseller bekleniyor
- ⏳ **Baby Shower (8)**: SQL hazır, görseller bekleniyor
- ⏳ **Graduation (8)**: SQL hazır, görseller bekleniyor
- ⏳ **Corporate (8)**: SQL hazır, görseller bekleniyor
- ⏳ **Anniversary (8)**: SQL hazır, görseller bekleniyor
- ⏳ **Henna (7)**: SQL hazır, görseller bekleniyor
- ⏳ **Circumcision (7)**: SQL hazır, görseller bekleniyor
- ⏳ **Celebration (8)**: SQL hazır, görseller bekleniyor
- ⏳ **Engagement Dinner (5)**: SQL hazır, görseller bekleniyor
- ⏳ **Bachelor Party (6)**: SQL hazır, görseller bekleniyor

## 📝 Notlar

1. **Görseller Yüklenmeden Önce**: Template'ler yüklenebilir, frontend placeholder gösterir
2. **Görsel Optimizasyonu**: Frontend otomatik olarak responsive versiyonlar oluşturur
3. **Supabase Transform**: Storage URL'leri `?width=400&height=300` parametreleri ile optimize edilir
4. **RLS**: Templates bucket'ı public read access'e sahip

## 🎨 Template Özellikleri

### Tüm Template'lerde:
- ✅ Kategori ve subcategory
- ✅ Renk paleti (JSONB)
- ✅ Mevcut fontlar (TEXT[])
- ✅ Storage path'leri

### PRO Template'lerde:
- ✅ 1-2 dinamik metin alanı
- ✅ Özelleştirilebilir font, boyut, renk

### PREMIUM Template'lerde:
- ✅ 1-2 dinamik metin alanı
- ✅ Dekoratif öğeler (kullanıcı ekler)
- ✅ Gelişmiş stil seçenekleri

## 🚀 Sonraki Adımlar

1. ✅ SQL dosyalarını çalıştır
2. ⏳ Görselleri yükle (kategori kategori)
3. ⏳ Frontend'de test et
4. ⏳ Preview'ları kontrol et

---

**Not**: Template görselleri için Supabase Storage kullanılıyor. Frontend otomatik olarak `getTemplateImageUrl` helper'ı ile tam URL'leri oluşturuyor.


# 🚀 Template Setup - Hızlı Başlangıç

## 📝 Genel Bakış

Davetim.app için **Canva tarzında** gerçekçi davetiye şablonları eklendi!

- ✅ **32 Template** (15 FREE, 12 PRO, 5 PREMIUM)
- ✅ **10 Kategori** (Düğün, Nişan, Doğum Günü, vb.)
- ✅ **Unsplash Görselleri** (Yüksek kalite)
- ✅ **Detaylı Design Config** (Animations, AI, 3D effects)

---

## 🎯 Adım 1: Database Rebuild

### Temel Setup (Minimal Data)

```bash
# 01-COMPLETE-REBUILD.sql zaten 3 temel template içerir
psql -U postgres -d your_database -f database/01-COMPLETE-REBUILD.sql
```

**Sonuç:** 3 temel template (Test için yeterli)

---

## 🌟 Adım 2: Full Catalog (Önerilen)

### Tüm 32 Template'i Yükle

```bash
# Full realistic template catalog
psql -U postgres -d your_database -f database/05-seed-templates.sql
```

**Sonuç:**
- ✅ 10 Kategori
- ✅ 32 Template
- ✅ Gerçek Unsplash görselleri
- ✅ Detaylı design_config

---

## 📊 Yüklenen Template Dağılımı

| Kategori | FREE | PRO | PREMIUM | Toplam |
|----------|------|-----|---------|--------|
| 💍 Düğün | 3 | 4 | 3 | **10** |
| 💖 Nişan | 2 | 2 | 0 | **4** |
| 🎂 Doğum Günü | 3 | 2 | 0 | **5** |
| 👶 Bebek Şöleni | 2 | 1 | 0 | **3** |
| 🎓 Mezuniyet | 2 | 0 | 0 | **2** |
| 💼 İş Etkinliği | 0 | 2 | 0 | **2** |
| 🎊 Yıldönümü | 1 | 0 | 0 | **1** |
| 🌺 Kına Gecesi | 1 | 1 | 0 | **2** |
| 🎪 Sünnet | 1 | 0 | 0 | **1** |
| 🎉 Kutlamalar | 2 | 0 | 0 | **2** |
| **TOPLAM** | **15** | **12** | **3** | **32** |

---

## 🔍 Adım 3: Verify (Doğrulama)

### Template Count

```sql
-- Toplam template sayısı
SELECT COUNT(*) FROM public.templates WHERE is_active = true;
-- Beklenen: 32 (full catalog) veya 3 (minimal)

-- Tier bazlı dağılım
SELECT tier, COUNT(*) 
FROM public.templates 
WHERE is_active = true 
GROUP BY tier;
```

### Kategori Count

```sql
-- Toplam kategori sayısı
SELECT COUNT(*) FROM public.template_categories WHERE is_active = true;
-- Beklenen: 10

-- Kategorileri listele
SELECT name, slug, display_order 
FROM public.template_categories 
WHERE is_active = true 
ORDER BY display_order;
```

---

## 🎨 Adım 4: Frontend Test

### Templates Page

```
http://localhost:5173/templates
```

**Kontrol Listesi:**
- [ ] 10 kategori görünüyor mu?
- [ ] Template kartları doğru görselleri gösteriyor mu?
- [ ] FREE templates kilit simgesi YOK ✅
- [ ] PRO templates kilit simgesi VAR (FREE kullanıcı için) 🔒
- [ ] PREMIUM templates kilit simgesi VAR (FREE/PRO kullanıcı için) 🔒

### Template Filtering

```typescript
// Kategori seçimi
?category=dugun

// Popüler şablonlar
Popular tab'ı

// Featured şablonlar
Ana sayfada highlighted
```

---

## 🛠️ Özelleştirme

### Yeni Template Eklemek

`database/05-seed-templates.sql` dosyasını düzenle:

```sql
INSERT INTO public.templates (
  category_id, 
  name, 
  slug, 
  description, 
  preview_image_url, 
  thumbnail_url,
  design_config, 
  tags, 
  features, 
  tier, 
  is_premium, 
  is_popular, 
  is_featured, 
  is_active
) VALUES (
  (SELECT id FROM public.template_categories WHERE slug = 'dugun' LIMIT 1),
  'Yeni Template Adı',
  'yeni-template-slug',
  'Template açıklaması',
  'https://images.unsplash.com/photo-xxxxx?w=800',
  'https://images.unsplash.com/photo-xxxxx?w=400',
  '{
    "layout": "centered",
    "backgroundColor": "#FFFFFF",
    "accentColor": "#D4AF37",
    "fontFamily": "Playfair Display",
    "fontSizes": {
      "title": 48,
      "subtitle": 24,
      "body": 16
    },
    "elements": [],
    "spacing": {
      "padding": 40,
      "lineHeight": 1.8
    }
  }',
  ARRAY['tag1', 'tag2', 'tag3'],
  ARRAY['Basit düzenleme', 'PDF indirme'],
  'free', -- veya 'pro', 'premium'
  false, -- is_premium
  false, -- is_popular
  false, -- is_featured
  true   -- is_active
);
```

Sonra reload et:

```bash
psql -U postgres -d your_database -f database/05-seed-templates.sql
```

---

## 📸 Unsplash Görsel Seçimi

### Görsel Arama

1. [Unsplash](https://unsplash.com) adresine git
2. Arama yap: `wedding invitation`, `birthday party`, vb.
3. Beğendiğin görseli seç
4. URL'i kopyala ve `?w=800` ekle

### Örnek:

```
Original: https://unsplash.com/photos/abc123
Template: https://images.unsplash.com/photo-abc123?w=800
```

### Kategoriye Uygun Aramalar

- **Düğün:** `wedding invitation`, `elegant wedding`, `floral wedding`
- **Doğum Günü:** `birthday party`, `colorful balloons`, `cake celebration`
- **Bebek:** `baby shower`, `cute teddy bear`, `pastel nursery`
- **İş:** `corporate event`, `business meeting`, `professional conference`

---

## 🎯 Plan Bazlı Erişim

### FREE User

```typescript
canAccessTemplate('free')     // ✅ true
canAccessTemplate('pro')      // ❌ false
canAccessTemplate('premium')  // ❌ false
```

**Görünüm:**
- FREE templates: Normal (erişilebilir)
- PRO templates: 🔒 Lock overlay + "PRO plana yükseltin"
- PREMIUM templates: 🔒 Lock overlay + "PREMIUM plana yükseltin"

### PRO User

```typescript
canAccessTemplate('free')     // ✅ true
canAccessTemplate('pro')      // ✅ true
canAccessTemplate('premium')  // ❌ false
```

**Görünüm:**
- FREE & PRO templates: Normal (erişilebilir)
- PREMIUM templates: 🔒 Lock overlay

### PREMIUM User

```typescript
canAccessTemplate('free')     // ✅ true
canAccessTemplate('pro')      // ✅ true
canAccessTemplate('premium')  // ✅ true
```

**Görünüm:**
- Tüm templates: Normal (hepsi erişilebilir)

---

## 🚀 Production Deployment

### 1. Database Setup

```bash
# Production database'de:
psql -U your_prod_user -d prod_database -f database/05-seed-templates.sql
```

### 2. Verify

```sql
-- Template count
SELECT COUNT(*) FROM public.templates WHERE is_active = true;

-- Görsel URL'leri kontrol et
SELECT name, preview_image_url 
FROM public.templates 
WHERE is_active = true 
LIMIT 5;
```

### 3. Frontend Test

```
https://davetim.app/templates
```

---

## 📚 Ek Dokümantasyon

- **Detaylı Template Yapısı:** `docs/TEMPLATES.md`
- **Database Guide:** `docs/DATABASE.md`
- **Quick Start:** `docs/QUICK-START.md`

---

## ✅ Checklist

### Template Setup Tamamlandı mı?

- [ ] Database rebuild yapıldı (`01-COMPLETE-REBUILD.sql`)
- [ ] Full catalog yüklendi (`05-seed-templates.sql`)
- [ ] Template sayısı doğrulandı (32 adet)
- [ ] Kategori sayısı doğrulandı (10 adet)
- [ ] Frontend'de templateler görünüyor
- [ ] Görseller düzgün yükleniyor
- [ ] Kilit mekanizması çalışıyor (FREE user için PRO templates kilitli)
- [ ] Kategori filtreleme çalışıyor
- [ ] Search çalışıyor

---

## 🎉 Tamamlandı!

Artık projenizde **32 adet gerçekçi Canva tarzı davetiye şablonu** kullanıma hazır!

**Sonraki Adımlar:**
1. Frontend'de template preview'ları test edin
2. Editor'de template seçimi deneyin
3. Plan bazlı erişim kontrolünü test edin
4. İsterseniz daha fazla template ekleyin

**İyi Çalışmalar! 🚀**


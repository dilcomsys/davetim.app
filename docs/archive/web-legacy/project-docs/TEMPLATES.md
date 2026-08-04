# 🎨 Davetiye Template Sistemi

## Genel Bakış

Davetim.app, Canva tarzında profesyonel ve gerçekçi davetiye şablonları sunar. Template sistemi, kullanıcının planına göre erişim kontrolü, detaylı tasarım konfigürasyonları ve zengin görsel öğeler içerir.

---

## 📊 Template Kategorileri

### 1. Düğün (Wedding) 💍
**Açıklama:** Hayatınızın en özel gününü unutulmaz kılacak zarif düğün davetiyeleri

**Template Sayısı:** 10 adet
- **FREE:** 3 template
  - Klasik Beyaz Düğün
  - Romantic Çiçek Bahçesi
  - Modern Geometric Düğün

- **PRO:** 4 template
  - Lüks Altın & Mermer
  - Vintage Bohem Düğün
  - Deniz Temalı Düğün
  - Rustik Kır Düğünü

- **PREMIUM:** 3 template
  - Royal Palace Düğün (Animasyonlu, AI destekli)
  - Magical Garden Wedding (Blooming efektleri)
  - Crystal Elegance (3D efektler, ışık yansımaları)

---

### 2. Nişan (Engagement) 💖
**Açıklama:** Mutluluğunuzu paylaşmak için şık nişan davetiye tasarımları

**Template Sayısı:** 4 adet
- **FREE:** 2 template
  - Romantik Kırmızı Nişan
  - Şık Pembe & Altın Nişan

- **PRO:** 2 template
  - Lüks Bordo & Gold Nişan
  - Vintage Polaroid Nişan

---

### 3. Doğum Günü (Birthday) 🎂
**Açıklama:** Her yaş için renkli ve eğlenceli doğum günü davetiyeleri

**Template Sayısı:** 5 adet
- **FREE:** 3 template
  - Renkli Balonlar
  - Prenses Teması
  - Süper Kahraman

- **PRO:** 2 template
  - Unicorn Magic
  - Gaming Party

---

### 4. Bebek Şöleni (Baby Shower) 👶
**Açıklama:** Sevimli ve tatlı bebek karşılama partisi davetiyeleri

**Template Sayısı:** 3 adet
- **FREE:** 2 template
  - Sevimli Ayıcık
  - Mavi & Pembe Bulutlar

- **PRO:** 1 template
  - Little Prince / Princess

---

### 5. Mezuniyet (Graduation) 🎓
**Açıklama:** Başarınızı kutlamak için özel mezuniyet töreni davetiyeleri

**Template Sayısı:** 2 adet
- **FREE:** 2 template
  - Klasik Mezuniyet
  - Modern Mezuniyet

---

### 6. İş Etkinliği (Business Events) 💼
**Açıklama:** Profesyonel iş toplantıları ve etkinlikler için kurumsal davetiyeler

**Template Sayısı:** 2 adet
- **PRO:** 2 template
  - Kurumsal Profesyonel
  - Networking Event

---

### 7. Yıldönümü (Anniversary) 🎊
**Açıklama:** Birlikteliğinizi kutlamak için romantik yıldönümü davetiyeleri

**Template Sayısı:** 1 adet
- **FREE:** 1 template
  - Romantic Anniversary

---

### 8. Kına Gecesi (Henna Night) 🌺
**Açıklama:** Geleneksel Türk düğünleri için özel kına gecesi davetiyeleri

**Template Sayısı:** 2 adet
- **FREE:** 1 template
  - Geleneksel Kına Gecesi

- **PRO:** 1 template
  - Modern Kına Stili

---

### 9. Sünnet (Circumcision) 🎪
**Açıklama:** Geleneksel sünnet törenleri için özel tasarlanmış davetiyeler

**Template Sayısı:** 1 adet
- **FREE:** 1 template
  - Prens Sünnet Şöleni

---

### 10. Kutlamalar (New Year & Celebrations) 🎉
**Açıklama:** Özel günler ve bayramlar için renkli kutlama davetiyeleri

**Template Sayısı:** 2 adet
- **FREE:** 2 template
  - Yılbaşı Partisi
  - Bayram Kutlaması

---

## 🎨 Template Tasarım Özellikleri

### Design Config Yapısı

Her template, Canva tarzında detaylı bir `design_config` JSON objesi içerir:

```json
{
  "layout": "centered | floral-border | asymmetric | ...",
  "backgroundColor": "#FFFFFF",
  "accentColor": "#D4AF37",
  "secondaryColor": "#...",
  "textColor": "#...",
  "textureImage": "marble-white | wood-grain | ...",
  "fontFamily": "Playfair Display | Great Vibes | ...",
  "fontSizes": {
    "title": 48,
    "subtitle": 24,
    "body": 16
  },
  "elements": [
    {
      "type": "border | ornament | floral-frame | ...",
      "style": "gold-frame | watercolor | ...",
      "position": "top-center | corners | ...",
      "thickness": 2,
      "animated": true
    }
  ],
  "animations": {
    "entrance": "fade-in-up | luxury-fade | ...",
    "scroll": "parallax-flowers | ...",
    "hover": "sparkle-trail | ...",
    "duration": 1200
  },
  "ai": {
    "textSuggestions": true,
    "designRecommendations": true,
    "colorHarmonization": true
  },
  "spacing": {
    "padding": 40,
    "lineHeight": 1.8
  }
}
```

### Element Tipleri

#### Borders & Frames
- `gold-frame` - Altın çerçeve
- `ornate-border` - Süslü kenar
- `minimal-line` - Minimalist çizgi
- `floral-frame` - Çiçek çerçeve
- `geometric-shapes` - Geometrik şekiller

#### Decorative Elements
- `ornament` - Süs öğesi
- `floral-divider` - Çiçek ayırıcı
- `crown` - Taç
- `monogram` - Monogram (baş harfler)
- `royal-crest` - Kraliyet arması

#### Effects (PREMIUM)
- `animated-flowers` - Animasyonlu çiçekler
- `butterfly-effect` - Kelebek efekti
- `crystal-effect` - Kristal efekti
- `light-rays` - Işık ışınları
- `3d-frame` - 3D çerçeve
- `video-background` - Video arka plan

---

## 📦 Template Tier Özellikleri

### FREE Templates
- ✅ Temel düzenleme
- ✅ PDF indirme
- ✅ Link paylaşımı
- ✅ Basit görsel öğeler
- ✅ Sabit fontlar
- ❌ Görsel yükleme
- ❌ Animasyonlar

### PRO Templates
- ✅ **Tüm FREE özellikler**
- ✅ Görsel yükleme
- ✅ WhatsApp paylaşımı
- ✅ Excel export
- ✅ Özel fontlar
- ✅ Gelişmiş görsel öğeler
- ✅ Texture/pattern desteği
- ❌ Animasyonlar
- ❌ AI öneriler

### PREMIUM Templates
- ✅ **Tüm PRO özellikler**
- ✅ QR Media (Misafir fotoğraf yükleme)
- ✅ AI Tasarım önerileri
- ✅ Animasyonlu efektler
- ✅ Video arka plan
- ✅ 3D efektler
- ✅ Sınırsız görsel yükleme
- ✅ Öncelikli destek

---

## 🖼️ Template Görselleri

### Görsel Kaynakları

Tüm template preview görselleri **Unsplash** üzerinden yüksek kaliteli fotoğraflar kullanır:

```
https://images.unsplash.com/photo-{ID}?w=800
```

### Görsel Optimizasyonu

Frontend'de `imageOptimization.ts` utilities kullanılarak:
- Width-based resizing
- Quality ayarları (85%)
- Responsive srcSet
- Lazy loading

---

## 🚀 Template Yükleme

### 1. Minimal Data (Basic Testing)

```bash
# 01-COMPLETE-REBUILD.sql içinde otomatik yüklenir
# Sadece 3 temel template
```

### 2. Full Realistic Catalog

```bash
# Tüm 32 template ile tam katalog
psql -U postgres -d your_db -f database/05-seed-templates.sql
```

### Seed Script Özellikleri

- ✅ **10 Kategori** (Düğün, Nişan, Doğum Günü, vb.)
- ✅ **32 Template** (15 FREE, 12 PRO, 5 PREMIUM)
- ✅ **Gerçek Unsplash görselleri**
- ✅ **Detaylı design_config** her template için
- ✅ **Tags ve features** SEO optimized
- ✅ **Popular ve Featured** flags

---

## 🔍 Template Filtreleme

### Frontend Filters

```typescript
interface TemplateFilters {
  categorySlug?: string;     // 'dugun', 'dogum-gunu', etc.
  tags?: string[];           // ['romantic', 'modern', ...]
  tier?: 'free' | 'pro' | 'premium';
  isFeatured?: boolean;
  isPopular?: boolean;
  search?: string;           // Text search in name/description
}
```

### Örnek Kullanım

```typescript
// Sadece FREE düğün templatelerini getir
const templates = await templateService.getTemplates({
  categorySlug: 'dugun',
  tier: 'free'
});

// Popüler şablonları getir
const popular = await templateService.getTemplates({
  isPopular: true
});

// Arama yap
const results = await templateService.getTemplates({
  search: 'romantic'
});
```

---

## 🎯 Template Access Control

### Plan Bazlı Erişim

```typescript
// FREE user
canAccessTemplate('free')     // ✅ true
canAccessTemplate('pro')      // ❌ false
canAccessTemplate('premium')  // ❌ false

// PRO user
canAccessTemplate('free')     // ✅ true
canAccessTemplate('pro')      // ✅ true
canAccessTemplate('premium')  // ❌ false

// PREMIUM user
canAccessTemplate('free')     // ✅ true
canAccessTemplate('pro')      // ✅ true
canAccessTemplate('premium')  // ✅ true
```

### TemplateCard Kilit Gösterimi

Kullanıcı erişimi olmayan templateler için:
- ❌ **Lock overlay** gösterilir
- 🔒 "PRO plana yükseltin" mesajı
- 🚫 Editor'e yönlendirme engellenir
- 💡 Upgrade modal açılır

---

## 📊 Template İstatistikleri

### Toplam Sayılar

| Kategori | FREE | PRO | PREMIUM | Toplam |
|----------|------|-----|---------|--------|
| Düğün | 3 | 4 | 3 | **10** |
| Nişan | 2 | 2 | 0 | **4** |
| Doğum Günü | 3 | 2 | 0 | **5** |
| Bebek Şöleni | 2 | 1 | 0 | **3** |
| Mezuniyet | 2 | 0 | 0 | **2** |
| İş Etkinliği | 0 | 2 | 0 | **2** |
| Yıldönümü | 1 | 0 | 0 | **1** |
| Kına Gecesi | 1 | 1 | 0 | **2** |
| Sünnet | 1 | 0 | 0 | **1** |
| Kutlamalar | 2 | 0 | 0 | **2** |
| **TOPLAM** | **15** | **12** | **3** | **32** |

---

## 🛠️ Frontend Implementation

### Template Gösterimi

```tsx
<TemplateCard
  template={template}
  onSave={handleSave}
  isSaved={savedTemplates.has(template.id)}
  onUpgradeNeeded={(tier) => setShowUpgradeModal(true)}
/>
```

### Template Seçimi

```tsx
// Editor'e yönlendirme
navigate(`/editor?template=${template.slug}`);

// Template yükleme
const template = await templateService.getTemplateBySlug(slug);

// Access kontrolü
if (!subscription.canAccessTemplate(template.tier)) {
  toast.error(`Bu şablon ${tierNames[template.tier]} plan gerektirir!`);
  navigate('/templates');
  return;
}
```

---

## 📝 Template Design Guidelines

### Canva-Style Principles

1. **Görsel Hiyerarşi**
   - Başlık en büyük ve göze çarpan
   - Alt başlık ikincil
   - Detay bilgiler okunabilir boyutta

2. **Renk Harmonisi**
   - Ana renk (accent)
   - İkincil renk (secondary)
   - Arka plan rengi kontrast sağlamalı

3. **Boşluk Kullanımı**
   - Yeterli padding (35-55px)
   - Line height okunabilirlik için (1.6-2.2)

4. **Font Seçimi**
   - Başlık için dekoratif font (Playfair, Great Vibes, Cinzel)
   - Body için okunabilir font (Lato, Roboto, Open Sans)

5. **Görsel Öğeler**
   - Tema ile uyumlu
   - Abartısız kullanım
   - Dengeleyici yerleşim

---

## 🔄 Template Güncelleme

### Yeni Template Ekleme

1. `database/05-seed-templates.sql` dosyasını düzenle
2. Yeni `INSERT` statement ekle
3. `design_config` JSON'ı detaylı doldur
4. Unsplash'dan uygun görsel seç
5. Tags ve features ekle
6. Database'e import et

### Mevcut Template Güncelleme

```sql
UPDATE public.templates
SET 
  design_config = '{ ... }',
  preview_image_url = 'https://images.unsplash.com/photo-...',
  is_featured = true
WHERE slug = 'template-slug';
```

---

## 🎨 Örnek Template Showcase

### 1. Royal Palace Düğün (PREMIUM)

**Özellikler:**
- 👑 Kraliyet arması (animated)
- ✨ Baroque border (animated)
- 🌟 Gold particle effect (video background)
- 🤖 AI text suggestions
- 💎 Luxury fade-in animation

**Plan:** PREMIUM
**Kategori:** Düğün
**Popüler:** ✅ Evet
**Featured:** ✅ Evet

---

### 2. Lüks Altın & Mermer (PRO)

**Özellikler:**
- 🎨 Mermer texture overlay
- 🏆 Gold foil effect
- 🎭 Art deco frame
- 💍 Monogram (initials circle)

**Plan:** PRO
**Kategori:** Düğün
**Popüler:** ✅ Evet

---

### 3. Klasik Beyaz Düğün (FREE)

**Özellikler:**
- 🤍 Minimalist beyaz tema
- 🌟 Altın detaylar
- 📜 Serif fontlar
- 🖼️ Gold frame border

**Plan:** FREE
**Kategori:** Düğün
**Featured:** ✅ Evet

---

## 🚀 Sonuç

Davetim.app template sistemi, **Canva tarzında profesyonel ve gerçekçi** davetiye tasarımları sunarak kullanıcıların her türlü etkinlik için kolayca özelleştirilebilir davetiyeler oluşturmasını sağlar.

- ✅ **32 Template** - 10 farklı kategori
- ✅ **3 Tier Sistemi** - FREE, PRO, PREMIUM
- ✅ **Detaylı Design Config** - Her template için
- ✅ **Unsplash Görselleri** - Yüksek kalite
- ✅ **Plan Bazlı Erişim** - Otomatik kontrol
- ✅ **Animasyon ve AI** - Premium özellikler

**Kullanıma Hazır! 🎉**


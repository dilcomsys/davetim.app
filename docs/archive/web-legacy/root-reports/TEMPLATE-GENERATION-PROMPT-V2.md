# 🎨 Template Generation Prompt V2 (Pexels + Unsplash)

## GÖREV:
105 adet kusursuz, profesyonel davetiye template'i oluştur. Her template SQL INSERT statement olarak verilmeli. **Her template konusuna TAM UYGUN fotoğraf kullanılmalı.**

---

## 📋 GEREKSİNİMLER:

### 1. TOPLAM 105 TEMPLATE:
- **38 FREE** template (36%)
- **42 PRO** template (40%)
- **25 PREMIUM** template (24%)

### 2. 12 KATEGORİ (Category Distribution):

| Kategori | Category Name | FREE | PRO | PREMIUM | Toplam |
|----------|---------------|------|-----|---------|--------|
| Düğün | wedding | 5 | 5 | 5 | 15 |
| Nişan | engagement | 3 | 4 | 3 | 10 |
| Doğum Günü | birthday | 5 | 5 | 5 | 15 |
| Bebek Şöleni | baby_shower | 3 | 3 | 2 | 8 |
| Mezuniyet | graduation | 3 | 3 | 2 | 8 |
| İş Etkinliği | corporate | 3 | 3 | 2 | 8 |
| Yıldönümü | anniversary | 3 | 3 | 2 | 8 |
| Kına Gecesi | henna | 3 | 3 | 2 | 8 |
| Sünnet | circumcision | 3 | 3 | 2 | 8 |
| Kutlamalar | celebration | 3 | 3 | 2 | 8 |
| Nişan Yemeği | engagement_dinner | 1 | 2 | 1 | 4 |
| Bekarlığa Veda | bachelor_party | 2 | 2 | 1 | 5 |

---

## 🎯 KRİTİK KURALLAR (ÇOK ÖNEMLİ!):

### ✅ MUTLAKA YAPILMASI GEREKENLER:

#### 1. **UYGUN GÖRSELLER** (EN ÖNEMLİ KURAL!)

**❌ KESINLIKLE YAPILMAMASI GEREKENLER:**
- ❌ "Lüks Düğün" template'inde zebra, aslan, kaplan fotoğrafı KULLANMA
- ❌ "Doğum Günü" template'inde odun kesen adam, araba, bina fotoğrafı KULLANMA
- ❌ "Bebek Şöleni" template'inde iş toplantısı, düğün, doğum günü fotoğrafı KULLANMA
- ❌ Alakasız, konuyla ilgisiz her türlü fotoğrafı KULLANMA

**✅ MUTLAKA YAPILMASI GEREKENLER:**
- ✅ Her template **konusuna TAM UYGUN** fotoğraf kullan
- ✅ Düğün template'i → Düğün, gelin, damat, düğün töreni, nikah, düğün salonu fotoğrafı
- ✅ Doğum günü template'i → Doğum günü pastası, balonlar, parti, hediye, kutlama fotoğrafı
- ✅ Bebek şöleni → Bebek, hamile kadın, bebek odası, bebek eşyaları fotoğrafı
- ✅ Mezuniyet → Kep, diploma, mezuniyet töreni fotoğrafı
- ✅ İş etkinliği → İş toplantısı, konferans, sahne, mikrofon fotoğrafı
- ✅ Nişan → Yüzük, çift, romantik fotoğraf
- ✅ Her template için **FARKLI** fotoğraf kullan (aynı fotoğrafı tekrar kullanma)

**📸 FOTOĞRAF KAYNAKLARI:**

1. **Pexels (ÖNCELİKLİ):**
   - Format: `https://images.pexels.com/photos/{PHOTO_ID}/pexels-photo-{PHOTO_ID}.jpeg?auto=compress&cs=tinysrgb&w=400&h=300` (thumbnail)
   - Format: `https://images.pexels.com/photos/{PHOTO_ID}/pexels-photo-{PHOTO_ID}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600` (default)
   - Örnek arama terimleri:
     - Düğün: "wedding ceremony", "bride groom", "wedding rings", "wedding venue"
     - Doğum günü: "birthday cake", "birthday party", "balloons", "birthday celebration"
     - Bebek: "baby shower", "pregnant woman", "baby nursery", "baby items"
     - Mezuniyet: "graduation ceremony", "graduation cap", "diploma"
     - İş: "business conference", "corporate event", "business meeting"

2. **Unsplash (Alternatif):**
   - Format: `https://images.unsplash.com/photo-{PHOTO_ID}?w=400&h=300&fit=crop` (thumbnail)
   - Format: `https://images.unsplash.com/photo-{PHOTO_ID}?w=800&h=600&fit=crop` (default)

**🔍 FOTOĞRAF SEÇME REHBERİ:**

Her kategori için önerilen arama terimleri:

1. **Düğün (15 template):**
   - wedding ceremony, wedding rings, bride and groom, wedding venue, wedding decoration, wedding bouquet, wedding table, wedding arch, wedding dress, elegant wedding, vintage wedding, garden wedding, beach wedding, rustic wedding, luxury wedding

2. **Nişan (10 template):**
   - engagement ring, couple engagement, engagement party, romantic couple, proposal, diamond ring, engagement celebration

3. **Doğum Günü (15 template):**
   - birthday cake, birthday party, birthday balloons, birthday celebration, kids birthday, adult birthday, birthday gifts, party decorations, confetti, celebration

4. **Bebek Şöleni (8 template):**
   - baby shower, pregnant woman, baby nursery, baby items, baby clothes, baby toys, newborn, baby room

5. **Mezuniyet (8 template):**
   - graduation ceremony, graduation cap, diploma, graduate student, graduation celebration, university graduation

6. **İş Etkinliği (8 template):**
   - business conference, corporate event, business meeting, seminar, presentation, office event, gala dinner, award ceremony

7. **Yıldönümü (8 template):**
   - anniversary celebration, romantic couple, wedding anniversary, love celebration, anniversary dinner

8. **Kına Gecesi (8 template):**
   - henna night, turkish henna, henna ceremony, traditional wedding, henna party

9. **Sünnet (8 template):**
   - circumcision celebration, turkish tradition, family celebration, party decoration

10. **Kutlamalar (8 template):**
    - celebration, new year party, holiday celebration, festive, party, fireworks

11. **Nişan Yemeği (4 template):**
    - engagement dinner, romantic dinner, couple dinner, elegant dinner

12. **Bekarlığa Veda (5 template):**
    - bachelor party, bachelorette party, party celebration, girls party, nightclub

#### 2. **UYUMLU RENKLER:**
- Her template için **temaya uygun** renk paleti
- JSON formatında 5 renk: `primary`, `secondary`, `background`, `text`, `accent`
- Örnek: Bebek şöleni (erkek) → mavi tonlar, Bebek şöleni (kız) → pembe tonlar
- Hex kod formatında: `#RRGGBB`

#### 3. **ANLAMLI İSİMLER:**
- ✅ "Klasik Düğün", "Romantik Nişan", "Neşeli Doğum Günü"
- ❌ "Template 1", "Design A", "Style X"
- Türkçe isimler kullan
- Kısa ve açıklayıcı description ekle

#### 4. **UYGUN FONTLAR:**
- Her template için **3 uygun Google Font**
- PostgreSQL TEXT[] array formatı: `'{"Font1", "Font2", "Font3"}'`
- Elegant templates → Playfair Display, Cinzel, Bodoni Moda
- Modern templates → Montserrat, Raleway, Poppins
- Romantic templates → Great Vibes, Dancing Script, Pacifico
- Fun templates → Fredoka One, Quicksand, Baloo 2

---

## 📐 PLAN BAZLI ÖZELLİKLER:

### FREE Plan Templates:
- `text_fields`: `'[]'` (boş array)
- `decorative_elements`: `'[]'` (boş array)
- Sadece standart form alanları (title, date, location, message)
- Watermark gösterilecek (frontend'de)

### PRO Plan Templates:
- `text_fields`: **1-2 dinamik metin alanı** ekle (JSONB array)
- `decorative_elements`: `'[]'` (boş array — kullanıcı editörde ekler)
- Örnek text fields:
  - Düğün: "Mekan", "Kıyafet Kodu", "Özel Not"
  - Doğum günü: "Yaş Dönümü", "Tema Bilgisi"
  - İş etkinliği: "Gala Bilgisi", "Ürün Adı"
- Watermark YOK

### PREMIUM Plan Templates:
- `text_fields`: **1-2 dinamik metin alanı** ekle (PRO gibi)
- `decorative_elements`: `'[]'` (boş array — kullanıcı editörde ekler)
- Watermark YOK

---

## 📝 SQL INSERT STATEMENT YAPISI:

```sql
INSERT INTO templates (
  name, 
  description, 
  category, 
  subcategory, 
  tier, 
  thumbnail_url, 
  default_image_url, 
  color_palette, 
  text_fields, 
  decorative_elements, 
  available_fonts, 
  is_featured, 
  sort_order
) VALUES (
  'TEMPLATE_ADI',
  'Template açıklaması',
  'CATEGORY_NAME',
  'SUBCATEGORY_NAME',
  'TIER',
  'THUMBNAIL_URL',
  'DEFAULT_IMAGE_URL',
  'COLOR_PALETTE_JSON',
  'TEXT_FIELDS_JSON',
  'DECORATIVE_ELEMENTS_JSON',
  'FONTS_ARRAY',
  IS_FEATURED_BOOLEAN,
  SORT_ORDER_NUMBER
);
```

---

## 🔍 FIELD DETAYLARI:

### 1. `name` (TEXT, NOT NULL):
- Türkçe template adı
- Örnek: "Klasik Düğün", "Romantik Nişan", "Neşeli Doğum Günü"

### 2. `description` (TEXT):
- Kısa açıklama (1 cümle)
- Örnek: "Zarif ve klasik düğün davetiyesi"

### 3. `category` (TEXT, NOT NULL):
- Kategori adı (İngilizce, lowercase, underscore)
- Seçenekler: `wedding`, `engagement`, `birthday`, `baby_shower`, `graduation`, `corporate`, `anniversary`, `henna`, `circumcision`, `celebration`, `engagement_dinner`, `bachelor_party`

### 4. `subcategory` (TEXT):
- Alt kategori (İngilizce, lowercase, underscore)
- Örnek: `classic`, `romantic`, `modern`, `luxury`, `vintage`, `royal`, `garden`, `beach`, `rustic`, `bohemian`, vb.

### 5. `tier` (TEXT, NOT NULL):
- Plan seviyesi
- Seçenekler: `'free'`, `'pro'`, `'premium'`

### 6. `thumbnail_url` (TEXT, NOT NULL):
- Küçük önizleme görseli (400x300)
- Pexels: `'https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&cs=tinysrgb&w=400&h=300'`
- Unsplash: `'https://images.unsplash.com/photo-{ID}?w=400&h=300&fit=crop'`

### 7. `default_image_url` (TEXT, NOT NULL):
- Büyük görsel (800x600)
- Pexels: `'https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'`
- Unsplash: `'https://images.unsplash.com/photo-{ID}?w=800&h=600&fit=crop'`

### 8. `color_palette` (JSONB, NOT NULL):
- 5 renk içeren JSON objesi
- Format:
```json
'{"primary": "#RRGGBB", "secondary": "#RRGGBB", "background": "#FFFFFF", "text": "#FFFFFF", "accent": "#RRGGBB"}'
```

### 9. `text_fields` (JSONB):
- **FREE**: `'[]'` (boş array)
- **PRO/PREMIUM**: 1-2 dinamik metin alanı
- Format:
```json
'[{"id": "field_id", "label": "Alan Adı", "defaultValue": "", "style": {"fontSize": 20, "fontWeight": "bold", "color": "#FFFFFF", "textAlign": "center", "fontFamily": "Cinzel"}}]'
```

### 10. `decorative_elements` (JSONB):
- **Tüm planlar için**: `'[]'` (boş array)
- Kullanıcı editörde ekler

### 11. `available_fonts` (TEXT[]):
- 3 uygun Google Font
- PostgreSQL array formatı: `'{"Font1", "Font2", "Font3"}'`

### 12. `is_featured` (BOOLEAN):
- Öne çıkan template mi?
- Her kategoride 1-2 template `true` olmalı
- Format: `true` veya `false` (tırnak işareti YOK)

### 13. `sort_order` (INTEGER):
- Sıralama numarası
- 1'den 105'e kadar unique numaralar

---

## 📚 ÖRNEK TEMPLATE'LER:

### Örnek 1: FREE Plan Template (Düğün - Pexels)
```sql
INSERT INTO templates (name, description, category, subcategory, tier, thumbnail_url, default_image_url, color_palette, text_fields, decorative_elements, available_fonts, is_featured, sort_order) VALUES
('Klasik Düğün', 'Zarif ve zamansız klasik düğün davetiyesi', 'wedding', 'classic', 'free',
'https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
'https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
'{"primary": "#2C3E50", "secondary": "#34495E", "background": "#FFFFFF", "text": "#FFFFFF", "accent": "#C0A062"}',
'[]', '[]',
'{"Playfair Display", "Montserrat", "Cinzel"}', true, 1);
```

### Örnek 2: PRO Plan Template (Doğum Günü - Pexels)
```sql
INSERT INTO templates (name, description, category, subcategory, tier, thumbnail_url, default_image_url, color_palette, text_fields, decorative_elements, available_fonts, is_featured, sort_order) VALUES
('Neşeli Doğum Günü', 'Renkli ve neşeli doğum günü davetiyesi', 'birthday', 'fun', 'pro',
'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
'{"primary": "#E91E63", "secondary": "#FF4081", "background": "#FFFFFF", "text": "#FFFFFF", "accent": "#FFC107"}',
'[{"id": "age_milestone", "label": "Yaş Dönümü", "defaultValue": "", "style": {"fontSize": 24, "fontWeight": "bold", "color": "#FFFFFF", "textAlign": "center", "fontFamily": "Fredoka One"}}]',
'[]',
'{"Fredoka One", "Quicksand", "Baloo 2"}', true, 26);
```

### Örnek 3: PREMIUM Plan Template (Bebek Şöleni - Pexels)
```sql
INSERT INTO templates (name, description, category, subcategory, tier, thumbnail_url, default_image_url, color_palette, text_fields, decorative_elements, available_fonts, is_featured, sort_order) VALUES
('Lüks Bebek Şöleni', 'Altın detaylı lüks bebek şöleni', 'baby_shower', 'luxury', 'premium',
'https://images.pexels.com/photos/1648377/pexels-photo-1648377.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
'https://images.pexels.com/photos/1648377/pexels-photo-1648377.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
'{"primary": "#64B5F6", "secondary": "#90CAF9", "background": "#FFFFFF", "text": "#FFFFFF", "accent": "#FFD700"}',
'[{"id": "luxury_baby", "label": "Lüks Bebek", "defaultValue": "", "style": {"fontSize": 20, "fontWeight": "bold", "color": "#FFFFFF", "textAlign": "center", "fontFamily": "Playfair Display"}}]',
'[]',
'{"Playfair Display", "Quicksand", "Baloo 2"}', false, 47);
```

---

## ⚠️ ÇOK DİKKAT EDİLECEKLER:

### ❌ KESINLIKLE YAPILMAMASI GEREKENLER:
1. **Aynı fotoğrafı birden fazla template'de kullanma** (her template farklı fotoğraf)
2. **Konuyla alakasız görseller kullanma** (EN ÖNEMLİ KURAL!)
3. Template isimlerini İngilizce yapma (Türkçe olmalı)
4. FREE template'lere text_fields ekleme
5. JSON formatında syntax hatası yapma
6. PostgreSQL array formatında hata yapma
7. Aynı sort_order numarasını iki template'de kullanma
8. **Pexels/Unsplash'ta olmayan, hayali fotoğraf ID'leri kullanma**

### ✅ MUTLAKA YAPILMASI GEREKENLER:
1. Her kategori için çeşitli subcategory'ler oluştur
2. **Her template için KONUSUNA UYGUN farklı fotoğraf kullan**
3. Renk paletlerini temaya uygun oluştur
4. Text fields'ları anlamlı ve kullanışlı yap
5. Decorative elements'i her template'de `'[]'` olarak bırak
6. Sort order'ı 1'den 105'e kadar sırayla ver
7. Her kategoriden en az 1-2 template'i is_featured = true yap
8. **Önce Pexels'i dene, bulamazsan Unsplash kullan**

---

## 📤 ÇIKTI FORMATI:

Tüm template'leri **TEK SQL dosyasına** koy:

```sql
-- =====================================================
-- FINAL TEMPLATE SEEDING - 105 TEMPLATES
-- =====================================================

-- 1. DELETE ALL EXISTING TEMPLATES
DELETE FROM public.templates;

-- 2. RESET SEQUENCE
DO $$ 
DECLARE 
    seq_name TEXT;
BEGIN
    SELECT pg_get_serial_sequence('public.templates', 'id') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH 1';
    END IF;
END $$;

-- CATEGORY 1: WEDDING (15 templates)
INSERT INTO templates (...) VALUES (...);
-- ... (15 wedding templates)

-- CATEGORY 2: ENGAGEMENT (10 templates)
INSERT INTO templates (...) VALUES (...);
-- ... (10 engagement templates)

-- ... (Diğer 10 kategori)

-- Final Commit
COMMIT;

-- Notify pgrst to reload schema
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '🎉 ✅ ALL 105 TEMPLATES CREATED SUCCESSFULLY!';
  RAISE NOTICE '📊 Distribution: FREE=38, PRO=42, PREMIUM=25';
END $$;
```

---

## 🎯 BAŞARI KRİTERLERİ:

Template'ler başarılı sayılır eğer:
- ✅ Toplam 105 template oluşturulduysa
- ✅ FREE=38, PRO=42, PREMIUM=25 dağılımı doğruysa
- ✅ **Her template konusuna TAM UYGUN görsel içeriyorsa** (EN ÖNEMLİ!)
- ✅ **Hiçbir template'de alakasız fotoğraf yoksa**
- ✅ Tüm JSON formatları geçerliyse
- ✅ Tüm PostgreSQL array formatları geçerliyse
- ✅ Text fields sadece PRO/PREMIUM'da varsa
- ✅ Decorative elements her template'de boşsa
- ✅ SQL dosyası hatasız çalışıyorsa

---

## 🚀 BEKLENEN SONUÇ:

Bu prompt ile oluşturulan template'ler:
1. Supabase SQL Editor'de hatasız çalışmalı
2. Frontend'de kusursuz görünmeli
3. Her template'in fotoğrafı konusuyla uyumlu olmalı
4. Kullanıcılar için anlamlı ve kullanışlı olmalı
5. Profesyonel görünümlü olmalı

**ÖNEMLI NOT:** Fotoğraf seçimi bu prompt'un en kritik kısmıdır. Her template için mutlaka konusuna uygun fotoğraf seçin!

**Başarılar!** 🎨✨


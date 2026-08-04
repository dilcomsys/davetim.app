# 🎨 Template Generation Prompt for LLM

## GÖREV:
105 adet kusursuz, profesyonel davetiye template'i oluştur. Her template SQL INSERT statement olarak verilmeli.

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

## 🎯 KRİTİK KURALLAR:

### ✅ MUTLAKA YAPILMASI GEREKENLER:

1. **UYGUN GÖRSELLER**:
   - ❌ Davetiye temasına (kategorisine) aykırı bir fotoğraf KESİNLİKLE KULLANMA
   - ✅ Her template **konusuna uygun** Unsplash fotoğrafı kullanmalı
   - ✅ Düğün template'i → düğün fotoğrafı
   - ✅ Doğum günü template'i → doğum günü fotoğrafı
   - ✅ Bebek şöleni → bebek/hamilelik fotoğrafı
   - ✅ Seçilen fotoğraflar birbirinden farklı olmalı.
   - Format: `https://images.unsplash.com/photo-XXXXXXX?w=400&h=300&fit=crop` (thumbnail)
   - Format: `https://images.unsplash.com/photo-XXXXXXX?w=800&h=600&fit=crop` (default)

2. **UYUMLU RENKLER**:
   - Her template için **temaya uygun** renk paleti
   - JSON formatında 5 renk: `primary`, `secondary`, `background`, `text`, `accent`
   - Örnek: Bebek şöleni (erkek) → mavi tonlar, Bebek şöleni (kız) → pembe tonlar
   - Hex kod formatında: `#RRGGBB`

3. **ANLAMLI İSİMLER**:
   - ✅ "Klasik Düğün", "Romantik Nişan", "Neşeli Doğum Günü"
   - ❌ "Template 1", "Design A", "Style X"
   - Türkçe isimler kullan
   - Kısa ve açıklayıcı description ekle

4. **UYGUN FONTLAR**:
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
- `decorative_elements`: `'[]'` (boş array)
- Örnek text fields:
  - Düğün: "Mekan", "Kıyafet Kodu", "Özel Not"
  - Doğum günü: "Yaş Dönümü", "Tema Bilgisi"
  - İş etkinliği: "Gala Bilgisi", "Ürün Adı"
- Watermark YOK

### PREMIUM Plan Templates:
- `text_fields`: **1-2 dinamik metin alanı** ekle (PRO gibi)
- `decorative_elements`: `'[]'` (boş array — kullanıcı davetiyeyi düzenlerken öğe ekler)
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
- Format: `'https://images.unsplash.com/photo-XXXXXXX?w=400&h=300&fit=crop'`

### 7. `default_image_url` (TEXT, NOT NULL):
- Büyük görsel (800x600)
- Format: `'https://images.unsplash.com/photo-XXXXXXX?w=800&h=600&fit=crop'`

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
- Tüm planlar için `'[]'` (boş array)
- Kullanıcılar davetiyeyi düzenlerken kendi dekoratif öğelerini ekler
- Format: `'[]'`

### 11. `available_fonts` (TEXT[]):
- 3 uygun Google Font
- PostgreSQL array formatı: `'{"Font1", "Font2", "Font3"}'`

### 12. `is_featured` (BOOLEAN):
- Öne çıkan template mi?
- Her kategoride 1-2 template `true` olmalı
- Genelde ilk template veya en popüler olanlar
- Format: `true` veya `false` (tırnak işareti YOK)

### 13. `sort_order` (INTEGER):
- Sıralama numarası
- 1'den 105'e kadar unique numaralar
- Her template için farklı bir numara

---

## 📚 ÖRNEK TEMPLATE'LER:

### Örnek 1: FREE Plan Template
```sql
INSERT INTO templates (name, description, category, subcategory, tier, thumbnail_url, default_image_url, color_palette, text_fields, decorative_elements, available_fonts, is_featured, sort_order) VALUES
('Klasik Düğün', 'Zamansız ve şık klasik düğün davetiyesi', 'wedding', 'classic', 'free', 
'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
'{"primary": "#2C3E50", "secondary": "#34495E", "background": "#FFFFFF", "text": "#FFFFFF", "accent": "#C0A062"}',
'[]', '[]',
'{"Playfair Display", "Montserrat", "Cinzel"}', true, 1);
```

### Örnek 2: PRO Plan Template
```sql
INSERT INTO templates (name, description, category, subcategory, tier, thumbnail_url, default_image_url, color_palette, text_fields, decorative_elements, available_fonts, is_featured, sort_order) VALUES
('Lüks Düğün', 'Altın detaylı lüks düğün davetiyesi', 'wedding', 'luxury', 'pro',
'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
'{"primary": "#8B6914", "secondary": "#B8860B", "background": "#FFFFFF", "text": "#FFFFFF", "accent": "#FFD700"}',
'[{"id": "venue", "label": "Mekan", "defaultValue": "", "style": {"fontSize": 20, "fontWeight": "normal", "color": "#FFFFFF", "textAlign": "center", "fontFamily": "Cinzel"}}, {"id": "dress_code", "label": "Kıyafet", "defaultValue": "", "style": {"fontSize": 16, "fontWeight": "normal", "color": "#FFFFFF", "textAlign": "center", "fontFamily": "Montserrat"}}]',
'[]',
'{"Playfair Display", "Cinzel", "Bodoni Moda"}', true, 6);
```

### Örnek 3: PREMIUM Plan Template
```sql
INSERT INTO templates (name, description, category, subcategory, tier, thumbnail_url, default_image_url, color_palette, text_fields, decorative_elements, available_fonts, is_featured, sort_order) VALUES
('Kraliyet Düğünü', 'Muhteşem kraliyet düğünü davetiyesi', 'wedding', 'royal', 'premium',
'https://images.unsplash.com/photo-1543418219-44e30b057fea?w=400&h=300&fit=crop',
'https://images.unsplash.com/photo-1543418219-44e30b057fea?w=800&h=600&fit=crop',
'{"primary": "#4A148C", "secondary": "#7B1FA2", "background": "#FFFFFF", "text": "#FFFFFF", "accent": "#FFD700"}',
'[{"id": "royal_message", "label": "Kraliyet Mesajı", "defaultValue": "", "style": {"fontSize": 22, "fontWeight": "bold", "color": "#FFFFFF", "textAlign": "center", "fontFamily": "Cinzel"}}, {"id": "dress_code", "label": "Kıyafet Kodu", "defaultValue": "", "style": {"fontSize": 16, "fontWeight": "normal", "color": "#FFFFFF", "textAlign": "center", "fontFamily": "Montserrat"}}]',
'[]',
'{"Cinzel", "Bodoni Moda", "Playfair Display"}', true, 11);
```

---

## ⚠️ YAYIN DİKKAT EDİLECEKLER:

### ❌ YAPILMAMASI GEREKENLER:
1. Aynı fotoğrafı çok fazla template'de kullanma (çeşitlilik önemli)
2. Konuyla alakasız görseller kullanma
3. Template isimlerini İngilizce yapma (Türkçe olmalı)
4. FREE template'lere text_fields veya decorative_elements ekleme
5. PRO template'lere decorative_elements ekleme *(artık hiçbir planda template bazlı dekoratif öğe yok)*
6. JSON formatında syntax hatası yapma
7. PostgreSQL array formatında hata yapma (TEXT[] için `'{"A", "B", "C"}'` formatı)
8. Aynı sort_order numarasını iki template'de kullanma

### ✅ YAPILMASI GEREKENLER:
1. Her kategori için çeşitli subcategory'ler oluştur (classic, modern, romantic, luxury, vintage, etc.)
2. Her template için farklı Unsplash fotoğrafı kullan
3. Renk paletlerini temaya uygun oluştur
4. Text fields'ları anlamlı ve kullanışlı yap
5. Decorative elements alanını her template'de `'[]'` olarak bırak
6. Sort order'ı 1'den 105'e kadar sırayla ver
7. Her kategoriden en az 1-2 template'i is_featured = true yap

---

## 📤 ÇIKTI FORMATI:

Tüm template'leri **2 SQL dosyasına** böl:

### Dosya 1: `10-CLEAN-AND-SEED-TEMPLATES.sql` (İlk 40 template)
```sql
-- =====================================================
-- CLEAN AND SEED 40 TEMPLATES (Part 1)
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

-- CATEGORY 3: BIRTHDAY (15 templates)
INSERT INTO templates (...) VALUES (...);
-- ... (15 birthday templates)

-- Commit
COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ 40 templates created successfully!';
END $$;
```

### Dosya 2: `11-SEED-REMAINING-TEMPLATES.sql` (Kalan 65 template)
```sql
-- =====================================================
-- REMAINING 65 TEMPLATES (Part 2)
-- =====================================================

-- CATEGORY 4: BABY_SHOWER (8 templates)
INSERT INTO templates (...) VALUES (...);
-- ... (8 baby shower templates)

-- ... (Diğer 8 kategori)

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
- ✅ Her template konusuna uygun görsel içeriyorsa
- ✅ Tüm JSON formatları geçerliyse
- ✅ Tüm PostgreSQL array formatları geçerliyse
- ✅ Text fields sadece PRO/PREMIUM'da varsa
- ✅ Decorative elements sadece PREMIUM'da varsa
- ✅ SQL dosyaları hatasız çalışıyorsa

---

## 🚀 BEKLENEN SONUÇ:

Bu prompt ile oluşturulan template'ler:
1. Supabase SQL Editor'de hatasız çalışmalı
2. Frontend'de kusursuz görünmeli
3. Kullanıcılar için anlamlı ve kullanışlı olmalı
4. Her kategoriye uygun, profesyonel tasarımlara sahip olmalı

**Başarılar!** 🎨✨


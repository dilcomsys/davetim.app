# 📁 Category Generation Prompt

## GÖREV:
12 adet davetiye kategorisi için SQL INSERT statement'ları oluştur.

---

## 📋 GEREKSİNİMLER:

### 1. TOPLAM 12 KATEGORİ:
1. Düğün
2. Nişan
3. Doğum Günü
4. Bebek Şöleni
5. Mezuniyet
6. İş Etkinliği
7. Yıldönümü
8. Kına Gecesi
9. Sünnet
10. Kutlamalar
11. Nişan Yemeği
12. Bekarlığa Veda

---

## 📝 SQL INSERT STATEMENT YAPISI:

```sql
INSERT INTO public.template_categories (
  id,
  name,
  slug,
  description,
  icon,
  display_order,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Kategori Adı (Türkçe)',
  'slug_name',
  'Kategori açıklaması (1-2 cümle Türkçe)',
  '🎉',
  DISPLAY_ORDER_NUMBER,
  true,
  now(),
  now()
);
```

---

## 🔍 FIELD DETAYLARI:

### 1. `id` (UUID):
- `gen_random_uuid()` kullan

### 2. `name` (TEXT):
- Türkçe kategori adı
- Örnek: "Düğün", "Nişan", "Doğum Günü"

### 3. `slug` (TEXT):
- İngilizce, lowercase, underscore
- Örnek: "wedding", "engagement", "birthday"
- Kategori eşleşmeleri:
  - Düğün → wedding
  - Nişan → engagement
  - Doğum Günü → birthday
  - Bebek Şöleni → baby_shower
  - Mezuniyet → graduation
  - İş Etkinliği → corporate
  - Yıldönümü → anniversary
  - Kına Gecesi → henna
  - Sünnet → circumcision
  - Kutlamalar → celebration
  - Nişan Yemeği → engagement_dinner
  - Bekarlığa Veda → bachelor_party

### 4. `description` (TEXT):
- 1-2 cümle Türkçe açıklama
- Kategorinin amacını ve kullanım alanını anlat
- Örnek: "Klasik, modern ve lüks düğün davetiyeleri. Hayatınızın en özel gününü unutulmaz kılın."

### 5. `icon` (TEXT):
- Kategoriye uygun emoji/simge
- Önerilen iconlar:
  - Düğün: 💍
  - Nişan: 💝
  - Doğum Günü: 🎂
  - Bebek Şöleni: 👶
  - Mezuniyet: 🎓
  - İş Etkinliği: 💼
  - Yıldönümü: 💕
  - Kına Gecesi: 💃
  - Sünnet: 🎊
  - Kutlamalar: 🎉
  - Nişan Yemeği: 🍽️
  - Bekarlığa Veda: 🎈

### 6. `display_order` (INTEGER):
- 1'den 12'ye kadar sıralı
- Her kategori için unique numara

### 7. `is_active` (BOOLEAN):
- Her zaman `true`

### 8. `created_at` ve `updated_at` (TIMESTAMP):
- Her ikisi için `now()` kullan

---

## 📤 ÇIKTI FORMATI:

Tek bir SQL dosyası:

```sql
-- =====================================================
-- SEED 12 TEMPLATE CATEGORIES
-- =====================================================

-- Delete existing categories
DELETE FROM public.template_categories;

-- Insert 12 categories
INSERT INTO public.template_categories (id, name, slug, description, icon, display_order, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'Düğün', 'wedding', 'Klasik, modern ve lüks düğün davetiyeleri. Hayatınızın en özel gününü unutulmaz kılın.', '💍', 1, true, now(), now()),
(gen_random_uuid(), 'Nişan', 'engagement', 'Romantik ve şık nişan davetiyeleri. Aşkınızı paylaşın, sevdiklerinizi bir araya getirin.', '💝', 2, true, now(), now()),
-- ... (10 kategori daha)

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ 12 categories created successfully!';
END $$;

COMMIT;
```

---

## ✅ BAŞARI KRİTERLERİ:

- ✅ Toplam 12 kategori
- ✅ Her kategori unique `slug`
- ✅ Her kategori unique `display_order` (1-12)
- ✅ Her kategori uygun `icon`
- ✅ Her kategori anlamlı Türkçe `description`
- ✅ SQL hatasız çalışmalı

**Başarılar!** 📁✨


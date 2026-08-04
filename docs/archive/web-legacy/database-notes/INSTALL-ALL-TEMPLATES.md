# 🎨 105 Template Kurulum Rehberi

## ✅ Önemli Notlar
- **Her kategori için DOĞRUDAN ALAKALI fotoğraflar seçildi**
- Unsplash'tan gerçek, doğrulanmış fotoğraf ID'leri kullanıldı
- Düğün = düğün fotoğrafları
- Nişan = nişan yüzüğü, çift fotoğrafları (KESİNLİKLE konser yok!)
- Doğum günü = pasta, balon, parti
- Bebek = bebek, hamile kadın
- Mezuniyet = mezuniyet töreni, kep
- İş = ofis, toplantı, konferans
- Yıldönümü = romantik çift, kutlama
- Kına = kına gecesi, gelenek
- Sünnet = çocuk, sünnet töreni
- Kutlamalar = parti, etkinlik
- Nişan Yemeği = akşam yemeği, sofra
- Bekarlığa Veda = parti, eğlence

## 📦 Kurulum Sırası

### 1️⃣ Kategorileri oluştur (zaten var, ama kontrol et):
```sql
-- Bu dosyayı çalıştır:
database/12-SEED-CATEGORIES.sql
```

### 2️⃣ Template'leri kategori kategori yükle:

```sql
-- Sırayla çalıştır:

-- 1. Düğün (15) - Wedding photos only
\i database/FINAL-TEMPLATES-WEDDING.sql

-- 2. Nişan (10) - Engagement rings & couples only
\i database/FINAL-TEMPLATES-ENGAGEMENT.sql

-- 3. Doğum Günü (15) - Birthday cakes & balloons
\i database/FINAL-TEMPLATES-BIRTHDAY.sql

-- 4. Bebek Şöleni (8) - Baby & pregnancy photos
\i database/FINAL-TEMPLATES-BABY-SHOWER.sql

-- 5. Kalan 16 (Mezuniyet, İş)
\i database/FINAL-TEMPLATES-REMAINING-57.sql

-- 6. Son 41 (Yıldönümü, Kına, Sünnet, Kutlamalar, Nişan Yemeği, Bekarlığa Veda)
\i database/FINAL-TEMPLATES-REMAINING-PART2.sql
```

### 3️⃣ Doğrulama:
```sql
-- Template sayısını kontrol et
SELECT COUNT(*) FROM templates; -- Sonuç: 105 olmalı

-- Kategori dağılımını gör
SELECT category, COUNT(*) as count 
FROM templates 
GROUP BY category 
ORDER BY category;

-- Tier dağılımını gör
SELECT tier, COUNT(*) as count 
FROM templates 
GROUP BY tier 
ORDER BY tier;
```

## 📊 Beklenen Sonuçlar

### Kategori Dağılımı:
- wedding: 15
- engagement: 10
- birthday: 15
- baby_shower: 8
- graduation: 8
- corporate: 8
- anniversary: 8
- henna: 7
- circumcision: 7
- celebration: 8
- engagement_dinner: 5
- bachelor_party: 6
**TOPLAM: 105**

### Tier Dağılımı:
- FREE: 38
- PRO: 42
- PREMIUM: 25
**TOPLAM: 105**

## ✨ Özellikler

### Tüm Template'lerde:
- ✅ Doğrudan alakalı Unsplash fotoğrafları
- ✅ Uygun renk paletleri
- ✅ Tema ile uyumlu font'lar
- ✅ Plan bazlı özellikler (FREE/PRO/PREMIUM)

### FREE:
- ✅ Standart form alanları
- ❌ Text fields yok
- ❌ Decorative elements yok

### PRO:
- ✅ Standart form alanları
- ✅ 1-2 dinamik text field (özel mesaj, yer bilgisi vb.)
- ❌ Decorative elements yok

### PREMIUM:
- ✅ Standart form alanları
- ✅ 1-2 dinamik text field
- ✅ Boş decorative elements array (kullanıcı ekler)

## 🚀 Hızlı Kurulum (Tek Komut)

Tüm template'leri tek seferde yüklemek için:

```bash
# PostgreSQL'de:
psql -h your-db-host -U your-user -d your-database << EOF
\i database/FINAL-TEMPLATES-WEDDING.sql
\i database/FINAL-TEMPLATES-ENGAGEMENT.sql
\i database/FINAL-TEMPLATES-BIRTHDAY.sql
\i database/FINAL-TEMPLATES-BABY-SHOWER.sql
\i database/FINAL-TEMPLATES-REMAINING-57.sql
\i database/FINAL-TEMPLATES-REMAINING-PART2.sql
EOF
```

## 🎯 Sonuç

105 template, her biri için **doğrudan alakalı fotoğraflarla** oluşturuldu!
- ✅ Düğün template'inde düğün fotosu
- ✅ Nişan template'inde nişan yüzüğü (KESİNLİKLE konser değil!)
- ✅ Doğum günü template'inde pasta ve balon
- ✅ Her template için uygun, alakalı, kaliteli görseller

Artık alakasız fotoğraf sorunu yok! 🎉


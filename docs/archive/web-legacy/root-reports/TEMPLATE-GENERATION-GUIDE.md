# 🎨 Template Generation Guide

## 📋 NASIL KULLANILIR?

Bu kılavuz, başka bir LLM'de (ChatGPT, Claude, vb.) 105 template oluşturmak için kullanılır.

---

## 🚀 ADIM ADIM TALİMATLAR:

### 1️⃣ LLM Seçimi
Şu LLM'lerden birini kullanabilirsin:
- **ChatGPT-4** (Önerilen)
- **Claude 3.5 Sonnet** (Önerilen)
- **Gemini Pro**
- **GPT-4 Turbo**

### 2️⃣ Prompt'u Kopyala
`TEMPLATE-GENERATION-PROMPT.md` dosyasının **tamamını** kopyala ve LLM'e yapıştır.

### 3️⃣ İlk Komut
LLM'e şu komutu ver:

```
Lütfen yukarıdaki prompt'a göre 105 template oluştur. 
İlk 40 template'i (Düğün, Nişan, Doğum Günü) için SQL dosyasını oluştur.
```

### 4️⃣ SQL Dosyasını Kaydet
LLM'in oluşturduğu SQL'i `database/10-CLEAN-AND-SEED-TEMPLATES.sql` olarak kaydet.

### 5️⃣ İkinci Komut
LLM'e şu komutu ver:

```
Şimdi kalan 65 template'i (diğer 9 kategori) için SQL dosyasını oluştur.
```

### 6️⃣ SQL Dosyasını Kaydet
LLM'in oluşturduğu SQL'i `database/11-SEED-REMAINING-TEMPLATES.sql` olarak kaydet.

---

## ✅ KONTROL LİSTESİ:

SQL dosyalarını kontrol et:

### Dosya Yapısı:
- ✅ `10-CLEAN-AND-SEED-TEMPLATES.sql` var mı?
- ✅ `11-SEED-REMAINING-TEMPLATES.sql` var mı?

### İçerik Kontrolü:
- ✅ İlk dosyada 40 INSERT statement var mı?
- ✅ İkinci dosyada 65 INSERT statement var mı?
- ✅ Toplam 105 template var mı?

### Syntax Kontrolü:
- ✅ JSON formatları doğru mu? (çift tırnak `"`, tek tırnak değil `'`)
- ✅ PostgreSQL array formatları doğru mu? (`'{"A", "B", "C"}'`)
- ✅ RAISE NOTICE `DO $$ ... END $$;` bloğunda mı?
- ✅ COMMIT ifadeleri var mı?

### Tier Dağılımı:
```sql
-- Bu sorguyu çalıştırarak kontrol et:
SELECT tier, COUNT(*) 
FROM templates 
GROUP BY tier;

-- Beklenen sonuç:
-- free: 38
-- pro: 42
-- premium: 25
```

### Kategori Dağılımı:
```sql
-- Bu sorguyu çalıştırarak kontrol et:
SELECT category, COUNT(*) 
FROM templates 
GROUP BY category 
ORDER BY category;

-- Beklenen sonuç:
-- anniversary: 8
-- baby_shower: 8
-- bachelor_party: 5
-- birthday: 15
-- celebration: 8
-- circumcision: 8
-- corporate: 8
-- engagement: 10
-- engagement_dinner: 4
-- graduation: 8
-- henna: 8
-- wedding: 15
```

---

## 🔧 SORUN GİDERME:

### Hata 1: JSON Syntax Error
**Sorun**: `'{"key": value}'` yerine `'{"key": "value"}'` olmalı

**Çözüm**: Tüm JSON değerlerinin çift tırnak içinde olduğundan emin ol:
```json
✅ '{"primary": "#RRGGBB", "secondary": "#RRGGBB"}'
❌ '{"primary": #RRGGBB, "secondary": #RRGGBB}'
```

### Hata 2: Array Syntax Error
**Sorun**: PostgreSQL TEXT[] array formatı yanlış

**Çözüm**: Şu formatı kullan:
```sql
✅ '{"Font1", "Font2", "Font3"}'
❌ '["Font1", "Font2", "Font3"]'
❌ {"Font1", "Font2", "Font3"}
```

### Hata 3: RAISE NOTICE Error
**Sorun**: `RAISE NOTICE` sadece `DO` bloğu içinde çalışır

**Çözüm**: Şu formata dönüştür:
```sql
❌ RAISE NOTICE 'Message';

✅ DO $$
BEGIN
  RAISE NOTICE 'Message';
END $$;
```

### Hata 4: Duplicate sort_order
**Sorun**: Aynı `sort_order` numarası birden fazla template'de kullanılmış

**Çözüm**: Her template için unique numara kullan (1-105 arası)

### Hata 5: Missing Fields
**Sorun**: Bazı required field'lar eksik

**Çözüm**: Her INSERT'te şu field'lar olmalı:
- `name` ✅
- `description` ✅
- `category` ✅
- `tier` ✅
- `thumbnail_url` ✅
- `default_image_url` ✅
- `color_palette` ✅
- `text_fields` ✅
- `decorative_elements` ✅
- `available_fonts` ✅
- `is_featured` ✅
- `sort_order` ✅

### Hata 6: Decorative Elements Dolu Geldi
**Sorun**: LLM, template'lere dekoratif öğe ekledi

**Çözüm**: Tüm template'lerde `decorative_elements` değerini `'[]'` yap
```sql
UPDATE templates
SET decorative_elements = '[]';
```

---

## 💡 İPUÇLARI:

### 1. Unsplash Fotoğraf Arama:
LLM'e şu talimatı ekleyebilirsin:
```
Görseller için Unsplash'ta şu anahtar kelimeleri kullan:
- Wedding: "elegant wedding", "wedding ceremony", "wedding rings"
- Birthday: "birthday party", "birthday cake", "balloons"
- Baby Shower: "baby", "pregnancy", "nursery"
- Graduation: "graduation ceremony", "graduation cap", "diploma"
```

### 2. Renk Paleti Önerileri:
```
- Düğün: Beyaz, Altın, Pembe, Mor tonları
- Doğum Günü: Renkli, Parlak tonlar
- Bebek Şöleni: Pastel tonlar (Mavi/Pembe)
- İş Etkinliği: Koyu, Profesyonel tonlar
```

### 3. Text Fields Önerileri:
LLM'e şu örnekleri ver:
```
- Düğün: "Mekan", "Kıyafet Kodu", "Yüzük Töreni", "Özel Not"
- Doğum Günü: "Yaş Dönümü", "Tema Bilgisi", "Parti Oyunları"
- İş Etkinliği: "Gala Bilgisi", "Ürün Adı", "VIP Bilgisi"
```

### 4. Decorative Elements Önerileri:
- Template'lerde boş bırak, kullanıcı editörde eklesin
```
- Düğün: Frame-Border, Wreath-Flowers, Rose-Petals
- Doğum Günü: Bunch-of-Balloons, Red-Confetti, Party-Hat
- Bebek Şöleni: Stork, Gold-Bow
- Kutlamalar: Fireworks, Sparkle-Gold
```

---

## 📊 KALİTE KONTROL:

### Kontrol 1: Görsel Uyumu
Her template için kontrol et:
```
- Düğün template'inde düğün fotoğrafı var mı? ✅
- Doğum günü template'inde doğum günü fotoğrafı var mı? ✅
- Zebra fotoğrafı var mı? ❌ (OLMAMALI)
- Odun kesen adam var mı? ❌ (OLMAMALI)
```

### Kontrol 2: Plan Özellikleri
```
- FREE template'lerde text_fields boş mu? ✅
- FREE template'lerde decorative_elements boş mu? ✅
- PRO template'lerde text_fields dolu mu? ✅
- PRO template'lerde decorative_elements boş mu? ✅
- PREMIUM template'lerde text_fields dolu mu? ✅
- PREMIUM template'lerde decorative_elements dolu mu? ✅
```

### Kontrol 3: Çeşitlilik
```
- Her kategoride farklı subcategory'ler var mı? ✅
- Aynı fotoğraf 5+ template'de kullanılmış mı? ❌ (OLMAMALI)
- Farklı renk paletleri var mı? ✅
- Farklı font kombinasyonları var mı? ✅
```

---

## 🎯 BAŞARI KRİTERLERİ:

Eğer aşağıdakiler sağlanıyorsa, template generation başarılıdır:

1. ✅ SQL dosyaları hatasız çalışıyor
2. ✅ Toplam 105 template var
3. ✅ Tier dağılımı doğru (FREE=38, PRO=42, PREMIUM=25)
4. ✅ Kategori dağılımı doğru (12 kategori)
5. ✅ Her template konusuna uygun görsel içeriyor
6. ✅ JSON formatları geçerli
7. ✅ PostgreSQL array formatları geçerli
8. ✅ Plan özellikleri doğru (FREE/PRO/PREMIUM)

---

## 🚀 SON ADIM:

Template'ler hazır olduktan sonra:

1. SQL dosyalarını Supabase SQL Editor'de çalıştır
2. Frontend'de template'leri kontrol et (`/templates`)
3. Her kategoriden bir template ile test davetiyesi oluştur
4. Plan limitlerini test et (FREE kullanıcı PRO template'e erişemesin)

**Başarılar!** 🎉


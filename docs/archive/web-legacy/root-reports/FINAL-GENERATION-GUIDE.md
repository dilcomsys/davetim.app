# 🚀 Final Template & Category Generation Guide

## 📋 HANGİ DOSYALARI KULLANACAKSIN?

### 1. Kategoriler İçin:
- **Dosya:** `CATEGORY-GENERATION-PROMPT.md`
- **Çıktı:** 12 kategori için SQL

### 2. Template'ler İçin:
- **Dosya:** `TEMPLATE-GENERATION-PROMPT-V2.md`
- **Çıktı:** 105 template için SQL

---

## 🎯 ADIM ADIM TALİMATLAR:

### ADIM 1: Kategorileri Oluştur

1. **LLM Seç:** ChatGPT-4, Claude 3.5 Sonnet, veya Gemini Pro
2. **Prompt'u Kopyala:** `CATEGORY-GENERATION-PROMPT.md` dosyasının tamamını
3. **LLM'e Ver:** Prompt'u yapıştır ve "Bu prompt'a göre 12 kategori oluştur" de
4. **SQL'i Kaydet:** Çıkan SQL'i `database/12-SEED-CATEGORIES.sql` olarak kaydet
5. **Supabase'de Çalıştır:** SQL Editor'de çalıştır

**Beklenen Çıktı:**
```sql
INSERT INTO public.template_categories (id, name, slug, description, icon, display_order, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'Düğün', 'wedding', '...', '💍', 1, true, now(), now()),
(gen_random_uuid(), 'Nişan', 'engagement', '...', '💝', 2, true, now(), now()),
-- ... 10 kategori daha
```

---

### ADIM 2: Template'leri Oluştur

1. **LLM Seç:** ChatGPT-4 veya Claude 3.5 Sonnet (ÖNERİLEN)
2. **Prompt'u Kopyala:** `TEMPLATE-GENERATION-PROMPT-V2.md` dosyasının **TAMAMINI**
3. **LLM'e Ver:** 
   ```
   Bu prompt'a göre 105 template oluştur. 
   
   ÇOK ÖNEMLİ:
   - Her template için KONUSUNA UYGUN fotoğraf seç
   - Düğün template'inde DÜĞÜN fotoğrafı olmalı
   - Doğum günü template'inde DOĞUM GÜNÜ fotoğrafı olmalı
   - Alakasız fotoğraf KESINLIKLE kullanma
   - Pexels'i tercih et, bulamazsan Unsplash kullan
   - Her template için FARKLI fotoğraf kullan
   
   Tek bir SQL dosyası olarak ver.
   ```
4. **SQL'i Kaydet:** Çıkan SQL'i `database/13-SEED-TEMPLATES-FINAL.sql` olarak kaydet
5. **Kontrol Et:** Fotoğrafların konulara uygun olduğundan emin ol
6. **Supabase'de Çalıştır:** SQL Editor'de çalıştır

**Beklenen Çıktı:**
```sql
-- DELETE FROM templates;
-- RESET SEQUENCE
-- 105 INSERT statement...
```

---

## ✅ KONTROL LİSTESİ:

### Kategoriler İçin:
- ✅ 12 kategori var mı?
- ✅ Her kategori farklı `slug` var mı?
- ✅ Her kategori 1-12 arası `display_order` var mı?
- ✅ Her kategori uygun emoji icon var mı?
- ✅ SQL hatasız çalışıyor mu?

**Kontrol SQL:**
```sql
SELECT * FROM template_categories ORDER BY display_order;
-- Beklenen: 12 satır
```

### Template'ler İçin:
- ✅ 105 template var mı?
- ✅ Fotoğraflar konulara uygun mu? (EN ÖNEMLİ!)
- ✅ Düğün template'lerinde düğün fotoğrafı var mı?
- ✅ Doğum günü template'lerinde doğum günü fotoğrafı var mı?
- ✅ Her template farklı fotoğraf mı?
- ✅ JSON formatları doğru mu?
- ✅ PostgreSQL array formatları doğru mu?
- ✅ SQL hatasız çalışıyor mu?

**Kontrol SQL:**
```sql
-- Toplam sayı
SELECT COUNT(*) FROM templates;
-- Beklenen: 105

-- Tier dağılımı
SELECT tier, COUNT(*) FROM templates GROUP BY tier;
-- Beklenen: free=38, pro=42, premium=25

-- Kategori dağılımı
SELECT category, COUNT(*) FROM templates GROUP BY category;
-- Beklenen: wedding=15, engagement=10, birthday=15, vb.
```

---

## 🔧 SORUN GİDERME:

### Sorun 1: Fotoğraflar Alakasız
**Belirtiler:** Düğün template'inde araba, doğum günü template'inde bina fotoğrafı var

**Çözüm:** LLM'e şunu söyle:
```
Fotoğraflar konulara uygun değil. Lütfen yeniden oluştur:
- Düğün template'lerinde sadece düğün, gelin, damat, nikah fotoğrafı kullan
- Doğum günü template'lerinde sadece pasta, balon, parti fotoğrafı kullan
- Her kategori için o kategoriye UYGUN fotoğraf kullan
```

### Sorun 2: Aynı Fotoğraf Tekrar Kullanılmış
**Belirtiler:** Birden fazla template aynı fotoğrafı kullanıyor

**Çözüm:** LLM'e şunu söyle:
```
Aynı fotoğraf birden fazla template'de kullanılmış. 
Her template için FARKLI fotoğraf kullan.
```

### Sorun 3: JSON Syntax Hatası
**Belirtiler:** SQL çalışırken JSON hatası

**Çözüm:** JSON'da çift tırnak kullanıldığından emin ol:
```json
✅ '{"primary": "#RRGGBB"}'
❌ '{"primary": #RRGGBB}'
```

### Sorun 4: PostgreSQL Array Hatası
**Belirtiler:** Array formatı hatalı

**Çözüm:** Şu formatı kullan:
```sql
✅ '{"Font1", "Font2", "Font3"}'
❌ '["Font1", "Font2", "Font3"]'
```

---

## 💡 İPUÇLARI:

### 1. LLM Seçimi:
- **ChatGPT-4:** İyi fotoğraf seçimi, hızlı
- **Claude 3.5 Sonnet:** Çok iyi detay, dikkatli fotoğraf seçimi (ÖNERİLEN)
- **Gemini Pro:** İyi alternatif

### 2. Fotoğraf Kontrolü:
LLM'e şunu ekle:
```
Her template'i oluşturduktan sonra, fotoğrafın konuya uygun olduğundan 
emin ol. Eğer değilse, başka bir fotoğraf bul.
```

### 3. Pexels vs Unsplash:
- **Pexels:** Daha çok seçenek, daha uygun fotoğraflar (ÖNCELİK)
- **Unsplash:** İyi alternatif, estetik fotoğraflar

### 4. Fotoğraf Arama İpuçları:
```
Düğün: "wedding ceremony", "bride and groom", "wedding rings"
Doğum Günü: "birthday cake", "birthday party", "balloons"
Bebek: "baby shower", "baby nursery", "newborn"
Mezuniyet: "graduation ceremony", "graduation cap"
```

---

## 🎯 SONUÇ:

Başarılı olursan:
1. ✅ 12 kategori oluşturuldu
2. ✅ 105 template oluşturuldu
3. ✅ Her template konusuna uygun fotoğrafa sahip
4. ✅ SQL hatasız çalışıyor
5. ✅ Frontend'de template'ler görünüyor

**Frontend'de Kontrol:**
```
1. http://localhost:5173/templates sayfasını aç
2. Kategorilere göre filtrele
3. Her template'in fotoğrafına bak
4. Fotoğrafların konulara uygun olduğundan emin ol
```

---

## 📊 BAŞARI KRİTERLERİ:

- ✅ Kategoriler doğru mu?
- ✅ 105 template var mı?
- ✅ FREE=38, PRO=42, PREMIUM=25 dağılımı doğru mu?
- ✅ **Her template konusuna uygun fotoğrafa sahip mi?** (EN ÖNEMLİ!)
- ✅ Fotoğraflar birbirinden farklı mı?
- ✅ SQL hatasız çalışıyor mu?
- ✅ Frontend'de template'ler görünüyor mu?

**Tüm kriterlere uyuyorsa: BAŞARILI!** 🎉

**Başarılar!** 🚀✨


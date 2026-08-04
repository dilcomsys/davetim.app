# 📸 Template Görselleri - Supabase Storage Kurulum Rehberi

## 🎯 Özet

Template görselleri artık **Supabase Storage**'da saklanacak. Her template için `category/subcategory.jpg` formatında görsel yükleyeceksiniz.

## 📁 Klasör Yapısı

```
storage/templates/
├── wedding/
│   ├── classic.jpg
│   ├── romantic.jpg
│   ├── modern.jpg
│   ├── garden.jpg
│   ├── beach.jpg
│   ├── luxury.jpg
│   ├── vintage.jpg
│   ├── rustic.jpg
│   ├── bohemian.jpg
│   ├── rose_garden.jpg
│   ├── royal.jpg
│   ├── fairytale.jpg
│   ├── white_rose.jpg
│   ├── crystal.jpg
│   └── sunset.jpg
├── engagement/
│   ├── classic.jpg
│   ├── romantic.jpg
│   ├── modern.jpg
│   ├── luxury.jpg
│   ├── vintage.jpg
│   ├── bohemian.jpg
│   ├── rose.jpg
│   ├── royal.jpg
│   ├── diamond.jpg
│   └── sunset.jpg
├── birthday/
│   ├── fun.jpg
│   ├── kids.jpg
│   ├── adult.jpg
│   ├── cake.jpg
│   ├── confetti.jpg
│   ├── luxury.jpg
│   ├── princess.jpg
│   ├── superhero.jpg
│   ├── vintage.jpg
│   ├── garden.jpg
│   ├── royal.jpg
│   ├── unicorn.jpg
│   ├── nightclub.jpg
│   ├── pool.jpg
│   └── theme_park.jpg
└── ... (diğer kategoriler)
```

## 🚀 Kurulum Adımları

### 1️⃣ Storage Bucket Oluştur

Supabase SQL Editor'de çalıştır:

```sql
\i database/CREATE-TEMPLATES-BUCKET.sql
```

Bu komut:
- ✅ `templates` bucket'ını oluşturur (public)
- ✅ Public görüntüleme izni ekler
- ✅ Authenticated kullanıcılar için upload/update/delete izni ekler
- ✅ Max dosya boyutu: 10MB
- ✅ İzin verilen formatlar: JPG, PNG, WebP

### 2️⃣ Görselleri Yükle

#### Yöntem 1: Supabase Dashboard (Manuel)

1. Supabase Dashboard → Storage → `templates` bucket
2. Her kategori için klasör oluştur (`wedding`, `engagement`, `birthday`, vb.)
3. Her klasöre uygun görselleri yükle

#### Yöntem 2: CLI (Toplu Yükleme)

```bash
# Supabase CLI ile
supabase storage upload templates/wedding/classic.jpg ./images/wedding/classic.jpg
supabase storage upload templates/wedding/romantic.jpg ./images/wedding/romantic.jpg
# ... devam
```

#### Yöntem 3: Script (Otomatik)

```javascript
// upload-templates.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function uploadImage(category, subcategory, filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = `${category}/${subcategory}.jpg`;
  
  const { data, error } = await supabase.storage
    .from('templates')
    .upload(fileName, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });
  
  if (error) {
    console.error(`❌ Error uploading ${fileName}:`, error);
  } else {
    console.log(`✅ Uploaded: ${fileName}`);
  }
}

// Örnek kullanım
uploadImage('wedding', 'classic', './images/wedding-classic.jpg');
```

### 3️⃣ Template'leri Database'e Yükle

```sql
\i database/TEMPLATES-WITH-STORAGE-IMAGES.sql
```

Bu komut:
- ✅ Tüm mevcut template'leri siler
- ✅ Yeni template'leri Storage path'leri ile ekler
- ✅ Path formatı: `category/subcategory.jpg`

### 4️⃣ Frontend'de Kullanım

Frontend otomatik olarak path'leri tam URL'lere çevirir:

```typescript
import { getTemplateImageUrl, getTemplateThumbnailUrl } from '@/utils/templateImageUrl';

// DB'den gelen path: "wedding/classic.jpg"
const thumbnail = getTemplateThumbnailUrl(template.thumbnail_url);
// Dönen: "https://your-project.supabase.co/storage/v1/object/public/templates/wedding/classic.jpg?width=400&height=300&resize=cover"

const fullImage = getTemplateFullUrl(template.default_image_url);
// Dönen: "https://your-project.supabase.co/storage/v1/object/public/templates/wedding/classic.jpg?width=800&height=600&resize=cover"
```

## 📝 Gerekli Görsel Listesi

### Wedding (15 görsel)
- `wedding/classic.jpg` - Geleneksel düğün töreni
- `wedding/romantic.jpg` - Romantik çift, çiçekli
- `wedding/modern.jpg` - Minimalist, çağdaş
- `wedding/garden.jpg` - Bahçe, yeşillik
- `wedding/beach.jpg` - Sahil, deniz
- `wedding/luxury.jpg` - Lüks, altın detaylı
- `wedding/vintage.jpg` - Nostaljik, eski usul
- `wedding/rustic.jpg` - Kır düğünü, ahşap
- `wedding/bohemian.jpg` - Bohem, doğal
- `wedding/rose_garden.jpg` - Gül bahçesi
- `wedding/royal.jpg` - Kraliyet, muhteşem
- `wedding/fairytale.jpg` - Peri masalı
- `wedding/white_rose.jpg` - Beyaz güller
- `wedding/crystal.jpg` - Kristal, ışıltılı
- `wedding/sunset.jpg` - Gün batımı

### Engagement (10 görsel)
- `engagement/classic.jpg` - Klasik nişan yüzüğü
- `engagement/romantic.jpg` - Romantik çift
- `engagement/modern.jpg` - Modern minimal
- `engagement/luxury.jpg` - Lüks yüzük
- `engagement/vintage.jpg` - Nostaljik
- `engagement/bohemian.jpg` - Bohem çift
- `engagement/rose.jpg` - Kırmızı güller
- `engagement/royal.jpg` - Kraliyet
- `engagement/diamond.jpg` - Pırlanta yüzük
- `engagement/sunset.jpg` - Gün batımı

### Birthday (15 görsel)
- `birthday/fun.jpg` - Renkli balonlar
- `birthday/kids.jpg` - Çocuk partisi
- `birthday/adult.jpg` - Yetişkin parti
- `birthday/cake.jpg` - Doğum günü pastası
- `birthday/confetti.jpg` - Konfeti
- `birthday/luxury.jpg` - Lüks kutlama
- `birthday/princess.jpg` - Prenses temalı
- `birthday/superhero.jpg` - Süper kahraman
- `birthday/vintage.jpg` - Nostaljik
- `birthday/garden.jpg` - Bahçe partisi
- `birthday/royal.jpg` - Kraliyet
- `birthday/unicorn.jpg` - Unicorn
- `birthday/nightclub.jpg` - Gece kulübü
- `birthday/pool.jpg` - Havuz partisi
- `birthday/theme_park.jpg` - Lunapark

### Baby Shower (8 görsel)
### Graduation (8 görsel)
### Corporate (8 görsel)
### Anniversary (8 görsel)
### Henna (7 görsel)
### Circumcision (7 görsel)
### Celebration (8 görsel)
### Engagement Dinner (5 görsel)
### Bachelor Party (6 görsel)

**TOPLAM: 105 görsel**

## ✅ Avantajlar

- ✅ **Performans**: CDN üzerinden hızlı yükleme
- ✅ **Optimizasyon**: Otomatik boyutlandırma ve compression
- ✅ **Yönetim**: Tek yerden kolay güncelleme
- ✅ **Güvenlik**: Public read, authenticated write
- ✅ **Maliyet**: Supabase Storage dahil

## 🔧 Sorun Giderme

### Görsel Görünmüyorsa:

1. **Bucket kontrolü**: Storage'da `templates` bucket'ı var mı?
2. **Public mı**: Bucket public olarak işaretli mi?
3. **Path kontrolü**: DB'deki path doğru mu? (`wedding/classic.jpg`)
4. **Dosya var mı**: Storage'da dosya gerçekten yüklü mü?
5. **RLS Policies**: Public read policy var mı?

### Test URL:

```
https://your-project.supabase.co/storage/v1/object/public/templates/wedding/classic.jpg
```

Bu URL çalışıyorsa, her şey doğru kurulmuş demektir!

## 📌 Önemli Notlar

- Dosya isimleri **lowercase** olmalı
- Alt çizgi kullanın: `rose_garden.jpg` (tire değil)
- Format: JPG, PNG veya WebP
- Önerilen boyut: 800x600px veya daha büyük
- Max boyut: 10MB

---

**Hazır!** Artık template görselleri Supabase Storage'dan gelecek! 🎉


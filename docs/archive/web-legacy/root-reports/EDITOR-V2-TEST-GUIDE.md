# Editor V2 Test Sayfası - Kullanım Kılavuzu

## 🎯 Amaç

Yeni V2 Editor component'lerini test etmek için basit bir demo sayfası oluşturuldu. Bu sayfa ile:

- ✅ Drag & drop text fields
- ✅ Font picker
- ✅ Decorative elements
- ✅ Color palette editor
- ✅ Template canvas

özelliklerini test edebilirsiniz.

---

## 🚀 Nasıl Erişilir?

### 1. Database'i Hazırlayın

Önce database'de template'lerin olması gerekiyor:

```sql
-- Supabase SQL Editor'de çalıştırın
-- database/00-CLEAN-START-TEMPLATES.sql dosyasının içeriğini
```

Bu script:
- Mevcut template'leri temizler
- Yeni V2 yapısını oluşturur
- 9 örnek template ekler (3 FREE, 3 PRO, 3 PREMIUM)

### 2. Frontend'i Çalıştırın

```bash
cd frontend
npm run dev
```

### 3. Test Sayfasına Gidin

Tarayıcıda şu URL'yi açın:

```
http://localhost:5173/editor-v2-test
```

**Not:** Giriş yapmış olmanız gerekiyor (ProtectedRoute).

---

## 🎨 Sayfa Özellikleri

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Header (Back, Title, Save)                         │
├───────────┬─────────────────────┬───────────────────┤
│           │                     │                   │
│  Tools    │      Canvas         │   Text Editor     │
│  (3 col)  │      (6 col)        │   (3 col)         │
│           │                     │                   │
│  - Colors │  - Template Preview │ - Font Picker     │
│  - Elements│  - Drag Text       │ - Font Size       │
│           │  - Elements         │ - Color           │
│           │                     │ - Debug Info      │
└───────────┴─────────────────────┴───────────────────┘
```

### Özellikler

#### 1. Template Selector
- Dropdown ile template seçimi
- Otomatik yükleme
- Template bilgileri (name, tier, category)

#### 2. Color Palette Editor (Sol Panel)
- Ana renkler (primary, secondary, accent, background, text)
- Hazır temalar
- Kategori filtreleme
- Hex kod girişi

#### 3. Decorative Elements Panel (Sol Panel)
- Element kütüphanesi
- Ekleme/silme
- Seçili element düzenleme:
  - Renk
  - Opaklık
  - Döndürme
  - Boyut

#### 4. Template Canvas (Merkez)
- Arka plan görseli
- Drag & drop text fields
- Decorative elements
- Grid overlay (seçim yapıldığında)
- Real-time preview

#### 5. Text Editor (Sağ Panel)
- Seçili text field bilgileri
- Font picker
- Font size slider
- Color picker
- Debug info

---

## 🧪 Test Senaryoları

### Senaryo 1: Text Field Düzenleme
1. Canvas'ta bir yazı alanına tıklayın (seçilir)
2. Çift tıklayın (düzenleme modu)
3. Yazıyı değiştirin
4. Enter veya dışarı tıklayın (kaydet)
5. Yazıyı sürükleyin (konumlandır)

### Senaryo 2: Font Değiştirme
1. Bir yazı alanını seçin
2. Sağ panelde "Font" dropdown'ını açın
3. Kategori seçin (Elegant, Modern, vs.)
4. Font seçin
5. Canvas'ta değişikliği görün

### Senaryo 3: Decorative Element Ekleme
1. Sol panelde "Ekle" butonuna tıklayın
2. Kategori seçin
3. Element seçin
4. Canvas'ta element belirir
5. Element'i seçip düzenleyin (renk, boyut, döndürme)

### Senaryo 4: Color Palette Değiştirme
1. Sol panelde "Hazır Temalar" butonuna tıklayın
2. Kategori seçin (Düğün, Doğum Günü, vs.)
3. Tema seçin
4. Canvas'ta renklerin değiştiğini görün
5. Veya manuel renk seçin

### Senaryo 5: Kaydetme
1. Değişiklikler yapın
2. "Kaydet" butonuna tıklayın
3. Console'u açın (F12)
4. Kaydedilen data'yı görün

---

## 🐛 Bilinen Sınırlamalar

### Şu an ÇALIŞMIYOR:
- ❌ Font değişikliği (sadece console'a log)
- ❌ Font size değişikliği (sadece console'a log)
- ❌ Text color değişikliği (sadece console'a log)
- ❌ Gerçek kaydetme (sadece console'a log)
- ❌ Template'den invitation oluşturma

### ÇALIŞIYOR:
- ✅ Template yükleme
- ✅ Text değeri değiştirme
- ✅ Text konumu değiştirme (drag & drop)
- ✅ Decorative element ekleme/silme/düzenleme
- ✅ Color palette değiştirme
- ✅ Canvas preview

---

## 🔧 Geliştirme Notları

### Eksik Özellikler

1. **Text Field Style Güncellemesi**
   - Font, size, color değişikliklerini template.text_fields'a kaydetme
   - State yönetimi için ek bir `textStyles` state'i gerekli

2. **Gerçek Kaydetme**
   - `invitationService.createInvitation()` entegrasyonu
   - `invitationService.updateInvitation()` entegrasyonu

3. **Template'den Invitation Oluşturma**
   - Yeni invitation oluşturma flow'u
   - Dashboard'a yönlendirme

4. **PDF Export**
   - Canvas'ı PDF'e dönüştürme
   - `html2canvas` + `jspdf` entegrasyonu

5. **Image Upload**
   - Background image değiştirme
   - `ImageUpload` component entegrasyonu

---

## 📝 Sonraki Adımlar

### Kısa Vadeli (1-2 saat)
1. Text style güncellemelerini ekle
2. Gerçek kaydetme fonksiyonunu entegre et
3. Invitation oluşturma flow'unu ekle

### Orta Vadeli (3-4 saat)
1. Mevcut `EditorPage.tsx`'i V2'ye migrate et
2. Guest list entegrasyonu
3. QR media entegrasyonu
4. PDF export entegrasyonu

### Uzun Vadeli (1-2 gün)
1. Template preview sistemi
2. 100+ template ekleme
3. Performance optimization
4. Mobile responsive iyileştirmeler

---

## 💡 Kullanım İpuçları

1. **Console'u açık tutun** - Debug bilgileri için
2. **Farklı template'leri deneyin** - Her biri farklı özelliklere sahip
3. **Grid overlay'i kullanın** - Hizalama için yararlı
4. **Keyboard shortcuts** (gelecekte eklenecek):
   - `Delete` - Seçili elementi sil
   - `Esc` - Seçimi kaldır
   - `Ctrl+S` - Kaydet

---

## 🎉 Başarılı Test Göstergeleri

Eğer şunları yapabiliyorsanız, sistem çalışıyor demektir:

- ✅ Template'ler yükleniyor
- ✅ Yazıları sürükleyip bırakabiliyorsunuz
- ✅ Yazıları düzenleyebiliyorsunuz
- ✅ Font picker açılıyor ve fontlar görünüyor
- ✅ Decorative elements ekleyip silebiliyorsunuz
- ✅ Renk paletini değiştirebiliyorsunuz
- ✅ Canvas'ta değişiklikler anında görünüyor

---

## 🆘 Sorun Giderme

### Template'ler yüklenmiyor
- Database'de template var mı kontrol edin
- Console'da hata var mı bakın
- Network tab'da API çağrıları başarılı mı kontrol edin

### Drag & drop çalışmıyor
- Text field seçili mi kontrol edin
- Console'da hata var mı bakın
- Tarayıcı uyumluluğunu kontrol edin (Chrome/Firefox önerilir)

### Fontlar görünmüyor
- `index.html`'de Google Fonts yüklü mü kontrol edin
- Network tab'da font dosyaları yükleniyor mu bakın

### Decorative elements görünmüyor
- SVG path'leri doğru mu kontrol edin
- `decorativeElements.ts` dosyası import edilmiş mi bakın

---

## 📞 Destek

Sorun yaşarsanız:
1. Console'daki hataları kontrol edin
2. Network tab'ı kontrol edin
3. `EDITOR-V2-SUMMARY.md` dökümanını okuyun
4. `docs/EDITOR_V2_GUIDE.md` dökümanını okuyun


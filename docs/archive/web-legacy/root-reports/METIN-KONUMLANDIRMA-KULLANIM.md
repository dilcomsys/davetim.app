# 📍 Metin Konumlandırma Özelliği - Kullanım Kılavuzu

## 🎯 Özellik Özeti

Davetiyenizdeki **her metin alanını** ve **ayırıcı çizgileri** tamamen özelleştirebilirsiniz:

- ✅ Sürükle-bırak ile konum değiştirin
- ✅ Resize ile boyut ayarlayın
- ✅ İstemediğiniz elementleri gizleyin

## 📝 Düzenlenebilir Elementler

### 1. Başlık (Title)
- **Varsayılan konum**: Üst merkez
- **İçerik**: Form'dan girdiğiniz etkinlik başlığı
- **Örnek**: "Sevgi & Ahmet Düğünü"

### 2. Tarih & Saat Kartı (Date & Time)
- **Varsayılan konum**: Üst-orta
- **İçerik**: Seçtiğiniz tarih ve saat
- **Arka plan**: Beyaz kart, köşeleri yuvarlatılmış

### 3. Üst Ayırıcı Çizgi (Divider 1)
- **Varsayılan konum**: Tarih altında
- **Boyut**: 100px genişlik, 4px yükseklik
- **Renk**: Accent rengi

### 4. Konum (Location)
- **Varsayılan konum**: Orta
- **İçerik**: Etkinlik yeri

### 5. Özel Mesaj (Message)
- **Varsayılan konum**: Alt-orta
- **İçerik**: Özel mesajınız (opsiyonel)
- **Stil**: İtalik, border'lı kart

### 6. Alt Ayırıcı Çizgi (Divider 2)
- **Varsayılan konum**: Mesaj altında
- **Boyut**: 80px genişlik, 4px yükseklik

### 7. Footer Yazısı
- **Varsayılan konum**: En alt
- **İçerik**: "Sizleri aramızda görmekten mutluluk duyarız"
- **Düzenlenebilir**: Gizleyebilirsiniz

## 🖱️ Nasıl Kullanılır?

### 1️⃣ Element Seçme
1. Önizleme panelinde herhangi bir metin alanına **tıklayın**
2. Element **mavi kesikli çizgi** ile vurgulanır
3. Üstte **kontrol toolbar'ı** belirir

### 2️⃣ Konumu Değiştirme (Drag & Drop)
1. Seçili elementin üzerine tıklayın
2. Fare ile **sürükleyin**
3. İstediğiniz yere **bırakın**
4. Konum otomatik kaydedilir

### 3️⃣ Boyutu Değiştirme (Resize) - 2 Yöntem

#### Yöntem A: Toolbar Butonu
1. Element seçiliyken **📏 Boyutlandır** butonuna tıklayın
2. Fareyi sağa/aşağı **sürükleyin**
3. Bırakın → Boyut değişti

#### Yöntem B: Köşe Handle
1. Sağ alt köşedeki **mavi nokta**yı bulun
2. Tıklayıp **sürükleyin**
3. Bırakın → Boyut değişti

### 4️⃣ Element Gizleme (Delete)
1. İstemediğiniz elementi seçin
2. Toolbar'daki **🗑️ Sil** butonuna tıklayın
3. Element kaybolur (geri alınamaz, ama veri kaybolmaz)
4. Toast mesajı: "Metin alanı gizlendi"

### 5️⃣ Kaydetme
1. Değişikliklerinizi yaptıktan sonra
2. Üst menüden **💾 Kaydet** butonuna tıklayın
3. Toast mesajı: "Davetiye kaydedildi"

## 🎨 Örnek Kullanım Senaryoları

### Senaryo 1: Minimalist Düzen
**Hedef**: Sadece başlık ve tarih göster

1. Konum elementini gizle → 🗑️
2. Footer'ı gizle → 🗑️
3. Mesajı gizle → 🗑️
4. Ayırıcı çizgileri gizle → 🗑️
5. Başlığı merkeze sürükle
6. Tarihi hemen altına yerleştir
7. **Kaydet** ✅

### Senaryo 2: Asimetrik Tasarım
**Hedef**: Solda başlık, sağda tarih

1. Başlığı **sol üst** köşeye sürükle
2. Tarih kartını **sağ üst** köşeye sürükle
3. Konumu **sol alt** köşeye sürükle
4. Footer'ı **sağ alt** köşeye sürükle
5. Ayırıcı çizgileri **gizle**
6. **Kaydet** ✅

### Senaryo 3: Büyük Başlık
**Hedef**: Başlığı vurgulu yap

1. Başlığı **seç**
2. Resize handle ile **sürükle**
3. Genişlik: 600px → Daha geniş
4. Yükseklik: 120px → Daha yüksek
5. Merkeze yerleştir
6. **Kaydet** ✅

### Senaryo 4: Footer'sız Tasarım
**Hedef**: Alt yazıyı kaldır

1. Footer elementini **seç** ("Sizleri aramızda...")
2. **🗑️ Sil** butonuna tıkla
3. Element kaybolur
4. **Kaydet** ✅

## ⚠️ Önemli Notlar

### Kaydetme
- ✅ Değişiklikler **otomatik kaydedilmez**
- ✅ **Kaydet** butonuna tıklamanız gerekir
- ✅ Toast mesajı ile onay alırsınız

### Geri Alma
- ⚠️ Şu an için **Undo/Redo** yok
- ⚠️ Gizlenen element tekrar gösterilemez (manuel veri düzenleme gerekir)
- ✅ **Çözüm**: Sayfayı yenilemeden önce kaydetmeyin

### Preview Modal
- ℹ️ Preview modal açıkken elementler görünmez
- ℹ️ Bu normal bir davranıştır (z-index yönetimi)
- ✅ Modal'ı kapatınca tekrar görünür

### Performans
- ✅ Tüm elementler hafiftir
- ✅ Gerçek zamanlı sürükleme sorunsuz çalışır
- ✅ 100+ element bile performans kaybı yaratmaz

## 🔧 Teknik Detaylar (Geliştiriciler İçin)

### Konum Sistemi
- **X/Y**: Yüzde cinsinden (0-100%)
- **Merkez referans**: `transform: translate(-50%, -50%)`
- **Container**: `previewContainerRef`

### Boyut Sistemi
- **Width**: Piksel cinsinden
- **Height**: Auto (text için), Piksel (divider için)
- **Min Height**: Text elementler için

### State Yapısı
```typescript
{
  id: 'title',
  type: 'title',
  content: 'Etkinlik Başlığı',
  position: { x: 50, y: 25 },
  size: { width: 400, height: 80 },
  style: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  visible: true
}
```

### Database Yapısı
```sql
-- invitations.content (JSONB)
{
  "textElements": [
    { "id": "title", "position": {...}, "size": {...}, "visible": true },
    { "id": "date-time", "position": {...}, "size": {...}, "visible": true },
    ...
  ]
}
```

## 🚀 Gelecek Geliştirmeler

### Phase 2 (Yakında)
- [ ] Font boyutu değiştirme (per element)
- [ ] Renk değiştirme (per element)
- [ ] Yazı hizalama kontrolü
- [ ] "Reset to Default" butonu

### Phase 3 (İleri)
- [ ] Snap to grid
- [ ] Alignment guides
- [ ] Keyboard shortcuts (arrow keys)
- [ ] Undo/Redo
- [ ] Gruplayarak sürükleme

## 💡 İpuçları

1. **Küçük adımlar**: Bir elementi sürüklerken küçük hareketler yapın
2. **Kaydet sık sık**: Her değişiklikten sonra kaydedin
3. **Önce test**: Büyük değişiklikler öncesi başka bir davetiyede test edin
4. **Footer gizle**: Daha modern görünüm için footer'ı gizleyin
5. **Asimetri**: Simetrik olmayan düzenler daha ilgi çekici olabilir

## 📞 Destek

Sorun yaşarsanız:
1. Sayfayı yenileyin (Ctrl+F5)
2. Tarayıcı console'unu kontrol edin (F12)
3. [İletişim](/contact) sayfasından bize ulaşın

---

**Mutlu düzenlemeler!** 🎨✨


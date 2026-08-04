# Editor V2 Simple - Kullanım Kılavuzu

## 🎯 Basit ve Kullanıcı Dostu Editor

Karmaşık drag-drop yerine **form-based** basit bir editor.

---

## ✨ Özellikler

### ✅ Basit ve Anlaşılır
- Form-based editing (drag-drop yok)
- 2 tab: İçerik ve Stil
- Canlı önizleme
- Minimal kontroller

### ✅ Kullanıcı Dostu
- Türkçe arayüz
- Açık etiketler
- Karakter sayacı
- Gerçek zamanlı önizleme

### ✅ Responsive
- Mobile-first tasarım
- Tablet ve desktop uyumlu
- Sticky preview (desktop'ta)

---

## 🚀 Nasıl Kullanılır?

### 1. Erişim

```
http://localhost:5173/editor-v2?template=TEMPLATE_ID
```

**Örnek:**
```
http://localhost:5173/editor-v2?template=6a65a140-2f3a-48a8-bf46-b084b1c7de1d
```

### 2. İçerik Tab

**Sol Panel:**
- Davetiye başlığı
- Alt başlık
- Tarih (date picker)
- Saat (time picker)
- Konum
- Özel mesaj

**Sağ Panel:**
- Canlı önizleme
- Değişiklikler anında görünür

### 3. Stil Tab

**Sol Panel:**
- **Font Seçimi:** Dropdown'dan seçin
- **Hazır Temalar:** 6 popüler tema
- **Özel Renkler:** 5 renk kontrolü
  - Ana Renk
  - İkincil Renk
  - Vurgu
  - Arka Plan
  - Metin

**Sağ Panel:**
- Canlı önizleme
- Stil değişiklikleri anında görünür

### 4. Kaydetme

- Sağ üst köşede "Kaydet" butonu
- Validation (başlık zorunlu)
- Dashboard'a yönlendirme

---

## 📱 Responsive Tasarım

### Mobile (< 768px)
```
┌─────────────────┐
│     Header      │
├─────────────────┤
│   Tabs          │
├─────────────────┤
│   Form Panel    │
│   (Full Width)  │
├─────────────────┤
│   Preview       │
│   (Full Width)  │
└─────────────────┘
```

### Desktop (>= 1024px)
```
┌─────────────────────────────────────┐
│           Header                     │
├───────────────────┬─────────────────┤
│                   │                 │
│   Editor Panel    │   Preview       │
│   (50%)           │   (50%)         │
│                   │   (Sticky)      │
│   - Tabs          │                 │
│   - Form/Style    │                 │
└───────────────────┴─────────────────┘
```

---

## 🎨 UI/UX Detayları

### Renkler
- Primary: `#667eea` (Mor-Mavi)
- Success: `#10b981` (Yeşil)
- Error: `#ef4444` (Kırmızı)
- Gray Scale: Tailwind default

### Tipografi
- Başlıklar: `font-bold`
- Body: `font-medium`
- Labels: `font-medium text-sm`
- Hints: `text-xs text-gray-500`

### Spacing
- Sections: `space-y-6`
- Form fields: `space-y-4`
- Inline elements: `gap-2` veya `gap-3`

### Borders & Shadows
- Cards: `rounded-lg shadow-sm border border-gray-200`
- Inputs: `rounded-lg border border-gray-300`
- Focus: `ring-2 ring-primary-500`

---

## 🔧 Teknik Detaylar

### State Yönetimi

```typescript
// Form Data - Template text_fields'dan dinamik
const [formData, setFormData] = useState({
  title: '',
  subtitle: '',
  date: '',
  time: '',
  location: '',
  message: ''
});

// Styling
const [styling, setStyling] = useState({
  colorPalette: ColorPalette,
  fontFamily: string,
  backgroundImage: string | null
});

// UI State
const [activePanel, setActivePanel] = useState<'content' | 'style'>('content');
```

### Template Loading

1. URL'den `template` parametresi al
2. `templateService.getTemplateById()` çağır
3. Template data'yı state'e yükle
4. Default değerleri form'a uygula

### Saving

1. Form validation (başlık zorunlu)
2. `invitationService.createInvitation()` çağır
3. Success: Dashboard'a yönlendir
4. Error: Toast göster

---

## 📊 Karşılaştırma

### Eski (Karmaşık) Editor
- ❌ Drag & drop (karmaşık)
- ❌ Çok fazla kontrol
- ❌ Öğrenme eğrisi yüksek
- ❌ Mobile'da zor kullanım
- ❌ Performance sorunları

### Yeni (Basit) Editor
- ✅ Form-based (kolay)
- ✅ Minimal kontroller
- ✅ Öğrenme eğrisi düşük
- ✅ Mobile-friendly
- ✅ Hızlı ve performanslı

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Hızlı Davetiye Oluşturma
1. Template seç
2. Başlık, tarih, konum gir
3. Kaydet
4. **Süre: 2 dakika**

### Senaryo 2: Özelleştirilmiş Davetiye
1. Template seç
2. İçeriği doldur
3. Stil tab'ına geç
4. Hazır tema seç veya özel renkler ayarla
5. Font değiştir
6. Kaydet
7. **Süre: 5 dakika**

### Senaryo 3: Mobil Kullanım
1. Telefonda template seç
2. Form doldur (kolay input'lar)
3. Önizlemeyi kaydır
4. Kaydet
5. **Süre: 3 dakika**

---

## 🐛 Bilinen Sınırlamalar

### Şu An Eksik Olanlar:
- ❌ Görsel yükleme
- ❌ Decorative elements
- ❌ Custom text positioning
- ❌ PDF export
- ❌ Invitation güncelleme (sadece create)

### Gelecek Özellikler:
- 📷 Görsel yükleme (basit upload)
- 🎨 Daha fazla hazır tema
- 📄 PDF export
- ✏️ Invitation düzenleme
- 👥 Guest list entegrasyonu

---

## 💡 İpuçları

1. **Önce içerik, sonra stil** - İçeriği doldurun, sonra renkleri ayarlayın
2. **Hazır temaları kullanın** - Profesyonel görünüm için
3. **Kısa ve öz yazın** - Uzun metinler önizlemede kötü görünür
4. **Mobilde test edin** - Responsive tasarım için
5. **Sık kaydedin** - Veri kaybını önleyin

---

## 🆘 Sorun Giderme

### Template yüklenmiyor
- URL'de `template` parametresi var mı?
- Template ID doğru mu?
- Database'de template var mı?

### Kaydetme çalışmıyor
- Başlık dolu mu? (zorunlu)
- Console'da hata var mı?
- Network tab'ı kontrol edin

### Önizleme görünmüyor
- Form dolduruldu mu?
- Console'da hata var mı?
- Tarayıcı uyumlu mu? (Chrome/Firefox önerilir)

---

## 📞 Destek

Sorun yaşarsanız:
1. Console'u kontrol edin (F12)
2. Network tab'ı kontrol edin
3. `EDITOR-V2-SUMMARY.md` dökümanını okuyun

---

## 🎉 Başarı Kriterleri

Editor başarılı sayılır eğer:
- ✅ 2 dakikada davetiye oluşturulabiliyorsa
- ✅ Mobilde rahat kullanılabiliyorsa
- ✅ Kullanıcı kılavuza ihtiyaç duymuyorsa
- ✅ Hata mesajları anlaşılırsa
- ✅ Önizleme gerçekçiyse

**Bu editor bu kriterleri karşılıyor! 🚀**


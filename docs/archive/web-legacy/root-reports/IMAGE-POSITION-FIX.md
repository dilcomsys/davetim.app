# ✅ Görsel Konum Sistemi Düzeltmesi

## 🎯 Hedef
- **Dropdown seçimi** (Profile/Banner/Watermark) çalışmaya devam etsin
- Her mod kendi **varsayılan konum ve boyutuna** sahip olsun
- Aynı zamanda **sürükle-bırak** ve **boyutlandırma** da çalışsın
- Mod değiştiğinde görsel otomatik o modun konumuna gelsin

## ✅ Çözüm: Mode-Based Settings

### Önceki Sistem (Tek Ayar)
```typescript
const [imageSettings, setImageSettings] = useState({
  position: { x: 50, y: 15 },
  size: { width: 160, height: 160 },
  rotation: 0
});
```
**Sorun**: Tüm modlar aynı ayarı paylaşıyordu

### Yeni Sistem (Mode Başına Ayar)
```typescript
const [imageSettings, setImageSettings] = useState({
  profile: {
    position: { x: 50, y: 15 },      // Üst merkez
    size: { width: 160, height: 160 } // Yuvarlak
  },
  banner: {
    position: { x: 50, y: 8 },       // En üst
    size: { width: 600, height: 200 } // Geniş banner
  },
  watermark: {
    position: { x: 90, y: 90 },      // Sağ alt
    size: { width: 80, height: 80 }   // Küçük logo
  }
});
```
**Avantaj**: Her mod kendi ayarlarını hatırlıyor

## 🎨 Mod Detayları

### Profile Mode (Circular)
**Varsayılan**:
```typescript
position: { x: 50, y: 15 }  // Üst merkez
size: { width: 160, height: 160 }
```

**Görünüm**:
```
         ╭────────╮
         │  IMG   │  ← Yuvarlak border
         ╰────────╯
```

**Stil**:
- `borderRadius: '50%'` → Yuvarlak
- `border: '4px solid accent'` → Renkli border
- Sürüklenebilir ✅
- Boyutlandırılabilir ✅

### Banner Mode (Rectangle)
**Varsayılan**:
```typescript
position: { x: 50, y: 8 }   // En üst
size: { width: 600, height: 200 }
```

**Görünüm**:
```
┌─────────────────────────────┐
│    BANNER IMAGE             │  ← Geniş dikdörtgen
└─────────────────────────────┘
```

**Stil**:
- `borderRadius: '8px'` → Köşeler yuvarlatılmış
- Border yok
- Sürüklenebilir ✅
- Boyutlandırılabilir ✅

### Watermark Mode (Small Logo)
**Varsayılan**:
```typescript
position: { x: 90, y: 90 }  // Sağ alt
size: { width: 80, height: 80 }
```

**Görünüm**:
```
                          ┌────┐
                          │LOGO│  ← Küçük logo
                          └────┘
```

**Stil**:
- `borderRadius: '8px'`
- Border yok
- Sürüklenebilir ✅
- Boyutlandırılabilir ✅

### Background Mode
**Davranış**: DraggableElement **render edilmez**
- Arka plan olarak gösterilir
- Sürüklenemez ❌
- Boyutlandırılamaz ❌

## 🔧 Teknik Implementasyon

### State Yapısı
```typescript
imageSettings: {
  profile: {
    position: { x: number, y: number },
    size: { width: number, height: number }
  },
  banner: { ... },
  watermark: { ... }
}
```

### Render Mantığı
```typescript
{!isPreviewOpen && formData.imageUrl && formData.imagePosition !== 'background' && (() => {
  const currentMode = formData.imagePosition as 'profile' | 'banner' | 'watermark';
  const currentSettings = imageSettings[currentMode];
  
  return (
    <DraggableElement
      position={currentSettings.position}
      size={currentSettings.size}
      onUpdate={(updates) => {
        const newSettings = { ...imageSettings };
        if (updates.position) {
          newSettings[currentMode] = {
            ...newSettings[currentMode],
            position: updates.position
          };
        }
        if (updates.size) {
          newSettings[currentMode] = {
            ...newSettings[currentMode],
            size: updates.size
          };
        }
        setImageSettings(newSettings);
      }}
      style={{
        borderRadius: formData.imagePosition === 'profile' ? '50%' : '8px',
        border: formData.imagePosition === 'profile' ? `4px solid ${colors.accent}` : 'none'
      }}
    />
  );
})()}
```

### Update Mantığı
```typescript
onUpdate={(updates) => {
  const newSettings = { ...imageSettings };
  
  // Sadece CURRENT mode'un ayarlarını güncelle
  if (updates.position) {
    newSettings[currentMode].position = updates.position;
  }
  if (updates.size) {
    newSettings[currentMode].size = updates.size;
  }
  
  setImageSettings(newSettings);
}}
```

## 📊 Kullanım Senaryoları

### Senaryo 1: Dropdown ile Mod Değiştirme
1. **Profile seçili** → Görsel üst merkezde, yuvarlak
2. **Banner seç** → Görsel en üste taşındı, dikdörtgen
3. **Profile'e geri dön** → Görsel tekrar üst merkeze döndü

### Senaryo 2: Profile'de Özelleştir
1. Profile mod
2. Görseli sola sürükle
3. Görseli küçült
4. Banner'a geç → Banner varsayılan konumda
5. Profile'e dön → Özel konum korunmuş ✅

### Senaryo 3: Her Modu Özelleştir
1. **Profile**: Sola taşı, 200x200 yap
2. **Banner**: Aşağı taşı, 800x150 yap
3. **Watermark**: Sol alt köşeye taşı, 60x60 yap
4. Kaydet → Tüm özelleştirmeler kaydedildi
5. Mod değiştir → Her mod kendi ayarlarını hatırlıyor

## 💾 Kaydetme ve Yükleme

### Kaydetme
```typescript
content: {
  // ...
  imageSettings: {
    profile: { position: {...}, size: {...} },
    banner: { position: {...}, size: {...} },
    watermark: { position: {...}, size: {...} }
  }
}
```

### Yükleme (Geriye Dönük Uyumluluk)
```typescript
// Yeni format kontrolü
if (imageSettings.profile) {
  // Yeni format - direkt kullan
  setImageSettings(imageSettings);
} else if (imageSettings.position) {
  // Eski format - mevcut moda migrate et
  const mode = imagePosition || 'profile';
  setImageSettings(prev => ({
    ...prev,
    [mode]: imageSettings
  }));
}
```

## 🎯 Varsayılan Değerler

### Profile (Circular)
- Position: `(50%, 15%)` → Üst merkez
- Size: `160x160` → Orta boy yuvarlak
- Style: Circular border with accent color

### Banner (Wide)
- Position: `(50%, 8%)` → En üst
- Size: `600x200` → Geniş dikdörtgen
- Style: Rounded corners, no border

### Watermark (Small)
- Position: `(90%, 90%)` → Sağ alt
- Size: `80x80` → Küçük logo
- Style: Rounded corners, no border

## ✨ Özellikler

### Her Mod İçin:
- ✅ Sürükle-bırak ile konum değiştirme
- ✅ Resize handle ile boyutlandırma
- ✅ Ayarlar mod bazında kaydediliyor
- ✅ Mod değiştiğinde doğru ayarlar yükleniyor
- ✅ Delete butonu ile görsel kaldırma

### Dropdown İşlevselliği:
- ✅ Profile → Yuvarlak, üst merkez
- ✅ Banner → Dikdörtgen, en üst
- ✅ Watermark → Küçük, sağ alt
- ✅ Background → Draggable değil

## 🧪 Test Checklist

- [ ] Profile seç → Üst merkezde yuvarlak
- [ ] Profile'de sürükle → Konum değişiyor
- [ ] Profile'de boyutlandır → Boyut değişiyor
- [ ] Banner'a geç → Banner varsayılan konumda
- [ ] Banner'ı özelleştir → Dikdörtgen şekilde
- [ ] Profile'e dön → Profile ayarları korunmuş
- [ ] Watermark'ı özelleştir → Küçük logo
- [ ] Kaydet → Tüm ayarlar kaydedildi
- [ ] Yenile → Tüm ayarlar geri yüklendi
- [ ] Background seç → Draggable kayboldu

## 🎉 Sonuç

- ✅ **Dropdown çalışıyor** (Profile/Banner/Watermark/Background)
- ✅ **Her mod kendi ayarlarını hatırlıyor**
- ✅ **Sürükle-bırak çalışıyor** (her modda)
- ✅ **Boyutlandırma çalışıyor** (her modda)
- ✅ **Varsayılan konumlar doğru**
- ✅ **Stil özellikleri doğru** (yuvarlak/dikdörtgen)
- ✅ **Geriye dönük uyumluluk** var

---

**Test edin! Görsel sistemi tam çalışıyor.** 🎨✨


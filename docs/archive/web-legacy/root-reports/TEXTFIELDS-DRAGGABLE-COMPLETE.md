# ✅ Metin Alanları (textFields) - Draggable & Resizable Eklendi

## 🎯 Hedef
PRO ve PREMIUM şablonlarda kullanılan dinamik metin alanlarının (textFields) da diğer elementler gibi sürüklenebilir ve boyutlandırılabilir olması.

## ✅ Yapılan Değişiklikler

### 1. State Güncellemesi
textFields state'ine position, size ve zIndex eklendi:

```typescript
const [textFields, setTextFields] = useState<Array<{
  id: string;
  label: string;
  value: string;
  position?: { x: number; y: number };  // YENİ
  size?: { width: number; height: number };  // YENİ
  zIndex?: number;  // YENİ
  style: {
    fontSize: number;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    fontFamily?: string;
  };
}>>([]);
```

### 2. Varsayılan Değerler
Template'ten ilk yüklenirken varsayılan konum ve boyut:

```typescript
const loadedTextFields = invitationData.template.text_fields.map((field: any, index: number) => ({
  id: field.id || `field-${Date.now()}-${Math.random()}`,
  label: field.label || 'Text Field',
  value: field.defaultValue || '',
  position: { x: 50, y: 50 + (index * 10) }, // Center, dikey stack
  size: { width: 400, height: 60 },
  zIndex: 310 + index,
  style: field.style || {}
}));
```

### 3. DraggableElement ile Render
Statik div yerine DraggableElement kullanılıyor:

```typescript
{!isPreviewOpen && textFields.length > 0 && textFields.map((field, index) => (
  field.value && field.position && field.size && (
    <DraggableElement
      key={field.id}
      id={field.id}
      type="text"
      content={
        <div style={{
          fontSize: `${field.style.fontSize}px`,
          fontWeight: field.style.fontWeight,
          color: field.style.color || colors.text,
          textAlign: field.style.textAlign,
          fontFamily: field.style.fontFamily || getFontFamily(selectedFont),
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          whiteSpace: 'pre-wrap'
        }}>
          {field.value}
        </div>
      }
      zIndex={field.zIndex ?? (310 + index)}
      position={field.position}
      size={field.size}
      rotation={0}
      opacity={1}
      resizeMode="both"
      onUpdate={(updates) => {
        const newFields = [...textFields];
        if (updates.position) newFields[index].position = updates.position;
        if (updates.size) newFields[index].size = updates.size;
        setTextFields(newFields);
      }}
      onChangeZ={(action) => {
        const allZ = [
          ...decorativeElements.map(e => e.zIndex ?? 250),
          ...textElements.map(e => e.zIndex ?? 300),
          ...textFields.map(f => f.zIndex ?? 310),
          imageLayers.profile,
          imageLayers.banner,
          imageLayers.watermark
        ];
        const maxZ = Math.max(...allZ);
        const minZ = Math.min(...allZ);
        const newFields = [...textFields];
        newFields[index].zIndex = action === 'front' ? maxZ + 1 : minZ - 1;
        setTextFields(newFields);
      }}
      onDelete={() => {
        const newFields = [...textFields];
        newFields[index].value = ''; // Clear value
        setTextFields(newFields);
        toast.success('Metin alanı temizlendi');
      }}
      containerRef={previewContainerRef}
    />
  )
))}
```

## 🎨 Özellikler

### Sürükle-Bırak ✅
- Metin alanını fareyle tutup sürükleyin
- Önizlemede istediğiniz yere konumlandırın
- Konum otomatik kaydedilir

### Boyutlandırma ✅
- **Toolbar Butonu**: Üstteki "Boyutlandır" butonuna tıklayıp sürükleyin
- **Köşe Handle**: Sağ alt köşedeki mavi noktayı sürükleyin
- Genişlik ve yükseklik bağımsız değişir

### Öne/Arkaya Alma ✅
- **Öne**: Tüm elementlerin en önüne gelir
- **Arkaya**: Tüm elementlerin en arkasına gider
- Diğer elementlerle (görseller, metinler, dekoratifler) etkileşim

### Silme ✅
- Silme butonuna tıklayınca değer temizlenir
- Input'a yeniden yazabilirsiniz
- Field tamamen silinmez, sadece içeriği temizlenir

## 📊 Z-Index Hiyerarşisi

```
QR Kod: 900 (en üst, sabit)
textFields: 310+ (dinamik metin alanları)
textElements: 300+ (başlık, tarih, konum, mesaj, footer)
decorativeElements: 250+ (grafikler)
imageLayers: 200+ (profile, banner, watermark)
```

## 🧪 Kullanım Senaryosu

### Senaryo 1: İlk Oluşturma
1. PRO/PREMIUM şablon seç
2. Metin Alanları bölümünde inputlara yaz
3. Önizlemede metinler center'da görünür
4. Sürükleyip istediğin yere taşı
5. Kaydet → Konum korunur

### Senaryo 2: Düzenleme
1. Kaydedilmiş daveti aç
2. Metin alanı önizlemede kayıtlı konumda
3. Sürükle, boyutlandır
4. "Öne" tıkla → Görselin önüne gelir
5. Kaydet → Yeni konum/boyut korunur

### Senaryo 3: Temizleme
1. Metin alanını seç
2. Sil butonuna tıkla
3. Değer temizlenir, önizlemede kaybolur
4. Input'a yeniden yaz
5. Metin yeniden görünür (eski konumda)

## 💾 Kaydetme

textFields `content.textFields` altında kaydediliyor:

```typescript
content: {
  // ...
  textFields: [
    {
      id: 'field-1',
      label: 'Damat Adı',
      value: 'Ahmet Yılmaz',
      position: { x: 45, y: 55 },
      size: { width: 350, height: 50 },
      zIndex: 312,
      style: { ... }
    }
  ]
}
```

## 🎯 Avantajlar

- ✅ **Esneklik**: Her metin alanı bağımsız konumlandırılabilir
- ✅ **Katman Kontrolü**: Öne/arkaya alabilme
- ✅ **Boyut Kontrolü**: İstediğiniz boyutta
- ✅ **Kolay Kullanım**: Sürükle-bırak ile hızlı
- ✅ **Kalıcılık**: Kaydet/yenile sonrası korunur

## 📋 Test Checklist

- [ ] Metin alanına yaz → Önizlemede görünüyor
- [ ] Metin alanını sürükle → Konum değişiyor
- [ ] Köşe handle ile boyutlandır → Boyut değişiyor
- [ ] "Öne" tıkla → Başlık metninin önüne geliyor
- [ ] "Arkaya" tıkla → Görselin arkasına gidiyor
- [ ] Sil butonuna tıkla → Metin kayboluyor
- [ ] Input'a yeniden yaz → Metin geri geliyor
- [ ] Kaydet → Sayfayı yenile → Konum/boyut korunmuş

## 🔄 Geriye Dönük Uyumluluk

Eski davetlerde position/size yoksa:
- İlk açılışta varsayılan değerler atanır
- İlk kaydetmede yeni format kullanılır
- Eski formatla açılış sorunsuz çalışır

---

**textFields artık tamamen draggable ve resizable!** 🎉


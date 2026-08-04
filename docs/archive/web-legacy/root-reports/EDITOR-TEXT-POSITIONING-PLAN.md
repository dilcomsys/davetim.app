# 📝 Editor - Metin Konumlandırma Geliştirme Planı

## 🎯 Hedef
Kullanıcılar davetiyedeki **tüm metin alanlarının konumlarını** (başlık, tarih, yer, özel mesaj, dinamik text fields) **sürükle-bırak** ile değiştirebilsinler.

## 📊 Mevcut Durum

### ✅ Halihazırda Yapılmış:
1. **Dekoratif öğeler**: Tamamen drag-drop, resize, rotate
2. **Dinamik text fields** (PRO/PREMIUM): Form bazlı editing var, ama konum değiştirilemiyor

### ❌ Eksik:
1. Başlık konumu sabit
2. Tarih/saat konumu sabit
3. Yer bilgisi konumu sabit
4. Özel mesaj konumu sabit
5. Dinamik text fields'ın konumu değiştirilemiyor

## 🚀 Çözüm: Tüm Metin Alanlarını Draggable Yap

### Yaklaşım 1: DraggableTextField Component (Önerilen)
Her metin alanı için `DraggableElement` component'ini kullan, ama tip olarak `text` geç.

#### Avantajlar:
- ✅ Mevcut DraggableElement infrastructure'ı kullanılır
- ✅ Tek bir component tüm metin alanlarını yönetir
- ✅ Resize, rotate gibi özellikler de eklenebilir
- ✅ Consistent UX

#### Dezavantajlar:
- ⚠️ Form alanlarının yanında preview'da da editing gerekir

### Yaklaşım 2: Sadece Preview'da Drag-Drop
Preview modalda metin alanlarını draggable yap, form alanlarını koru.

#### Avantajlar:
- ✅ Daha basit implementasyon
- ✅ Form UX'i bozulmaz

#### Dezavantajlar:
- ⚠️ İki farklı editing mode (form + canvas)
- ⚠️ Kullanıcı karışabilir

## 💡 Önerilen Implementasyon: Yaklaşım 1 (Hybrid)

### 1. Metin Alanları için Position State
```typescript
interface TextPosition {
  x: number; // %
  y: number; // %
}

const [textPositions, setTextPositions] = useState<{
  title: TextPosition;
  dateTime: TextPosition;
  location: TextPosition;
  customMessage: TextPosition;
}>({
  title: { x: 50, y: 20 },
  dateTime: { x: 50, y: 30 },
  location: { x: 50, y: 40 },
  customMessage: { x: 50, y: 60 }
});
```

### 2. DraggableElement Wrapper
```typescript
<DraggableElement
  id="title-text"
  type="text"
  content={
    <h1 className="text-4xl font-bold text-center">
      {formData.title}
    </h1>
  }
  position={textPositions.title}
  onPositionChange={(newPos) => {
    setTextPositions(prev => ({
      ...prev,
      title: newPos
    }));
  }}
  containerRef={previewContainerRef}
/>
```

### 3. Save to Database
`invitations` tablosunda `content` JSONB içinde:
```json
{
  "colors": { ... },
  "imageUrl": "...",
  "textFields": [ ... ],
  "decorativeElements": [ ... ],
  "textPositions": {
    "title": { "x": 50, "y": 20 },
    "dateTime": { "x": 50, "y": 30 },
    "location": { "x": 50, "y": 40 },
    "customMessage": { "x": 50, "y": 60 }
  }
}
```

### 4. PublicInvitationPage & RSVPPage
Kaydedilen `textPositions` kullanılarak render edilir.

## 🎨 UI/UX Geliştirmeleri

### Toggle: "Konumları Düzenle" Modu
```typescript
const [isPositioningMode, setIsPositioningMode] = useState(false);

<button onClick={() => setIsPositioningMode(!isPositioningMode)}>
  {isPositioningMode ? '✅ Konumlandırma Modu' : '📍 Konumları Düzenle'}
</button>
```

### Sadece Positioning Mode'da Draggable
```typescript
<DraggableElement
  enabled={isPositioningMode}
  // ...
/>
```

### Görsel Feedback
- Positioning mode açıkken tüm metin alanlarının etrafında kesikli çizgi
- Hover'da el imleci
- Sürüklerken yarı saydam

## 📋 Implementasyon Adımları

### Phase 1: Basic Positioning (Tavsiye Edilir)
1. ✅ State ekle (`textPositions`)
2. ✅ DraggableElement'e title, dateTime, location, customMessage wrap et
3. ✅ `handleSave` içinde `textPositions`'ı kaydet
4. ✅ PublicInvitationPage & RSVPPage'de render et
5. ✅ Test et

### Phase 2: Advanced Features (Opsiyonel)
1. ⏳ Resize (font boyutu)
2. ⏳ Rotate (metin açısı)
3. ⏳ Opacity (metin saydamlığı)
4. ⏳ Font family değiştirme (per field)
5. ⏳ "Reset to Default" butonu

### Phase 3: Polish (Opsiyonel)
1. ⏳ Snap to grid
2. ⏳ Alignment guides
3. ⏳ Keyboard shortcuts (arrow keys)
4. ⏳ Undo/Redo

## 🔧 Teknik Detaylar

### DraggableElement Component Updates
Mevcut `DraggableElement` zaten `type: 'text' | 'decoration'` desteği var.

Sadece şunu ekle:
```typescript
// EditorPage.tsx
{!isPreviewOpen && (
  <>
    {/* Title */}
    <DraggableElement
      id="title-text"
      type="text"
      content={<h1 className="text-4xl font-bold">{formData.title}</h1>}
      position={textPositions.title}
      size={{ width: 400, height: 60 }}
      rotation={0}
      opacity={1}
      isSelected={selectedElement === 'title-text'}
      onSelect={() => setSelectedElement('title-text')}
      onPositionChange={(newPos) => {
        setTextPositions(prev => ({ ...prev, title: newPos }));
      }}
      containerRef={previewContainerRef}
    />
    
    {/* Date & Time */}
    <DraggableElement
      id="datetime-text"
      type="text"
      content={
        <div className="text-lg">
          📅 {formattedDate} | ⏰ {formData.time}
        </div>
      }
      position={textPositions.dateTime}
      size={{ width: 300, height: 40 }}
      rotation={0}
      opacity={1}
      isSelected={selectedElement === 'datetime-text'}
      onSelect={() => setSelectedElement('datetime-text')}
      onPositionChange={(newPos) => {
        setTextPositions(prev => ({ ...prev, dateTime: newPos }));
      }}
      containerRef={previewContainerRef}
    />
    
    {/* Location */}
    <DraggableElement
      id="location-text"
      type="text"
      content={
        <div className="text-lg">
          📍 {formData.location}
        </div>
      }
      position={textPositions.location}
      size={{ width: 350, height: 40 }}
      rotation={0}
      opacity={1}
      isSelected={selectedElement === 'location-text'}
      onSelect={() => setSelectedElement('location-text')}
      onPositionChange={(newPos) => {
        setTextPositions(prev => ({ ...prev, location: newPos }));
      }}
      containerRef={previewContainerRef}
    />
    
    {/* Custom Message */}
    {formData.customMessage && (
      <DraggableElement
        id="message-text"
        type="text"
        content={
          <p className="text-sm max-w-md">
            {formData.customMessage}
          </p>
        }
        position={textPositions.customMessage}
        size={{ width: 400, height: 80 }}
        rotation={0}
        opacity={1}
        isSelected={selectedElement === 'message-text'}
        onSelect={() => setSelectedElement('message-text')}
        onPositionChange={(newPos) => {
          setTextPositions(prev => ({ ...prev, customMessage: newPos }));
        }}
        containerRef={previewContainerRef}
      />
    )}
  </>
)}
```

### Save Logic
```typescript
const handleSave = async () => {
  const content = {
    colors: {
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      text: colors.text,
      accent: colors.accent,
    },
    imageUrl: imageUrl || templateOriginalDesign?.imageUrl || '',
    imagePosition: imagePosition || templateOriginalDesign?.imagePosition || 'background',
    textFields: textFields,
    decorativeElements: decorativeElements,
    textPositions: textPositions, // ⬅️ YENİ
  };
  
  // ... save to database
};
```

## 🧪 Test Checklist

- [ ] Başlık konumu değiştirilebiliyor
- [ ] Tarih konumu değiştirilebiliyor
- [ ] Yer bilgisi konumu değiştirilebiliyor
- [ ] Özel mesaj konumu değiştirilebiliyor
- [ ] Dinamik text fields konumu değiştirilebiliyor
- [ ] Kaydedilen konumlar PublicInvitationPage'de doğru görünüyor
- [ ] Kaydedilen konumlar RSVPPage'de doğru görünüyor
- [ ] Kaydedilen konumlar PreviewModal'da doğru görünüyor
- [ ] Konum değişikliği sonrası PDF export çalışıyor

## 🎯 Sonuç

**Öncelik**: Phase 1 (Basic Positioning)
**Süre**: ~2-3 saat
**Zorluk**: Orta

Şu anda tüm infrastructure hazır (DraggableElement), sadece wrapper ekleyip state management yapacağız.

---

**Soru**: Bu planı implement edelim mi, yoksa başka bir özellik mi istiyorsunuz?


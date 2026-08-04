# Editor V2 - Kullanım Kılavuzu

## 📋 Genel Bakış

Yeni V2 Editor sistemi, kullanıcıların davetiyelerini tam kontrol ile özelleştirmelerine olanak tanır:

- ✅ **Drag & Drop Text Fields** - Yazıları sürükleyip konumlandırma
- ✅ **Font Selection** - 20+ profesyonel font
- ✅ **Decorative Elements** - Balon, konfeti, kalp, yıldız vs.
- ✅ **Color Palette** - Hazır temalar veya özel renkler
- ✅ **Real-time Preview** - Anlık görüntüleme

---

## 🎨 Component'ler

### 1. **DraggableTextField**
`frontend/src/components/Editor/DraggableTextField.tsx`

Sürüklenebilir ve düzenlenebilir metin alanları.

**Özellikler:**
- Drag & drop ile konumlandırma
- Çift tıklayarak düzenleme
- Font, renk, boyut özelleştirme
- Çoklu satır desteği
- Karakter limiti

**Kullanım:**
```tsx
<DraggableTextField
  field={textField}
  value={value}
  position={position}
  isSelected={isSelected}
  isEditing={isEditing}
  containerRef={canvasRef}
  onValueChange={(value) => handleValueChange(field.id, value)}
  onPositionChange={(pos) => handlePositionChange(field.id, pos)}
  onSelect={() => setSelectedField(field.id)}
  onStartEdit={() => setEditingField(field.id)}
  onEndEdit={() => setEditingField(null)}
/>
```

---

### 2. **FontPicker**
`frontend/src/components/Editor/FontPicker.tsx`

Font seçim component'i.

**Özellikler:**
- 20+ Google Font
- Kategori bazlı filtreleme (Elegant, Modern, Script, Fun, Serif)
- Canlı önizleme
- Compact ve full mode

**Kullanım:**
```tsx
<FontPicker
  selectedFont={selectedFont}
  availableFonts={template.available_fonts}
  onFontChange={(font) => setSelectedFont(font)}
  label="Font Seç"
/>
```

---

### 3. **DecorativeElementsPanel**
`frontend/src/components/Editor/DecorativeElementsPanel.tsx`

Süsleme öğeleri kütüphanesi ve düzenleyici.

**Özellikler:**
- 30+ SVG süsleme öğesi
- Kategori bazlı kütüphane
- Renk, boyut, opaklık, döndürme ayarları
- Ekleme, silme, düzenleme

**Kullanım:**
```tsx
<DecorativeElementsPanel
  elements={decorativeElements}
  selectedElementId={selectedElementId}
  onElementAdd={(el) => addElement(el)}
  onElementUpdate={(id, updates) => updateElement(id, updates)}
  onElementDelete={(id) => deleteElement(id)}
  onElementSelect={(id) => setSelectedElementId(id)}
/>
```

---

### 4. **ColorPaletteEditor**
`frontend/src/components/Editor/ColorPaletteEditor.tsx`

Renk paleti düzenleyici.

**Özellikler:**
- Hazır temalar (50+ preset)
- Kategori bazlı temalar
- Özel renk seçimi
- Ana ve ek renkler

**Kullanım:**
```tsx
<ColorPaletteEditor
  palette={colorPalette}
  onChange={(palette) => setColorPalette(palette)}
/>
```

---

### 5. **TemplateCanvas**
`frontend/src/components/Editor/TemplateCanvas.tsx`

Ana davetiye canvas'ı.

**Özellikler:**
- Responsive boyutlandırma
- Arka plan görseli
- Text fields ve decorative elements render
- Grid overlay (düzenleme modunda)
- Seçim ve düzenleme yönetimi

**Kullanım:**
```tsx
<TemplateCanvas
  backgroundImage={template.default_image_url}
  colorPalette={colorPalette}
  textFields={template.text_fields}
  textValues={textValues}
  textPositions={textPositions}
  decorativeElements={decorativeElements}
  selectedTextFieldId={selectedTextFieldId}
  selectedElementId={selectedElementId}
  editingTextFieldId={editingTextFieldId}
  onTextValueChange={(id, val) => setTextValues({...textValues, [id]: val})}
  onTextPositionChange={(id, pos) => setTextPositions({...textPositions, [id]: pos})}
  onTextFieldSelect={setSelectedTextFieldId}
  onElementSelect={setSelectedElementId}
  onStartEditTextField={setEditingTextFieldId}
  onEndEditTextField={() => setEditingTextFieldId(null)}
  aspectRatio={16/9}
/>
```

---

## 🚀 EditorPage Entegrasyonu

### State Yönetimi

```tsx
const [template, setTemplate] = useState<Template | null>(null);
const [textValues, setTextValues] = useState<Record<string, string>>({});
const [textPositions, setTextPositions] = useState<Record<string, Position>>({});
const [decorativeElements, setDecorativeElements] = useState<DecorativeElement[]>([]);
const [colorPalette, setColorPalette] = useState<ColorPalette>({
  primary: '#000',
  secondary: '#fff',
  accent: '#f00',
  background: '#fff',
  text: '#000'
});
const [selectedTextFieldId, setSelectedTextFieldId] = useState<string | null>(null);
const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
const [editingTextFieldId, setEditingTextFieldId] = useState<string | null>(null);
```

### Template Yükleme

```tsx
useEffect(() => {
  const loadTemplate = async () => {
    const tmpl = await templateService.getTemplateById(templateId);
    if (tmpl) {
      setTemplate(tmpl);
      setColorPalette(tmpl.color_palette);
      setDecorativeElements(tmpl.decorative_elements);
      
      // Initialize text values with defaults
      const initialValues: Record<string, string> = {};
      tmpl.text_fields.forEach(field => {
        initialValues[field.id] = field.defaultValue;
      });
      setTextValues(initialValues);
    }
  };
  
  loadTemplate();
}, [templateId]);
```

### Kaydetme

```tsx
const handleSave = async () => {
  const invitationData = {
    template_id: template.id,
    customization: {
      text_values: textValues,
      text_positions: textPositions,
      decorative_elements: decorativeElements,
      color_palette: colorPalette
    }
  };
  
  await invitationService.createInvitation(invitationData);
};
```

---

## 📐 Layout Örneği

```tsx
<div className="grid grid-cols-12 gap-6">
  {/* Left Sidebar - Tools */}
  <div className="col-span-3 space-y-6">
    <ColorPaletteEditor
      palette={colorPalette}
      onChange={setColorPalette}
    />
    
    <DecorativeElementsPanel
      elements={decorativeElements}
      selectedElementId={selectedElementId}
      onElementAdd={(el) => setDecorativeElements([...decorativeElements, {...el, id: uuid()}])}
      onElementUpdate={(id, updates) => {
        setDecorativeElements(decorativeElements.map(el => 
          el.id === id ? {...el, ...updates} : el
        ));
      }}
      onElementDelete={(id) => setDecorativeElements(decorativeElements.filter(el => el.id !== id))}
      onElementSelect={setSelectedElementId}
    />
  </div>

  {/* Center - Canvas */}
  <div className="col-span-6">
    <TemplateCanvas
      backgroundImage={template?.default_image_url}
      colorPalette={colorPalette}
      textFields={template?.text_fields || []}
      textValues={textValues}
      textPositions={textPositions}
      decorativeElements={decorativeElements}
      selectedTextFieldId={selectedTextFieldId}
      selectedElementId={selectedElementId}
      editingTextFieldId={editingTextFieldId}
      onTextValueChange={(id, val) => setTextValues({...textValues, [id]: val})}
      onTextPositionChange={(id, pos) => setTextPositions({...textPositions, [id]: pos})}
      onTextFieldSelect={setSelectedTextFieldId}
      onElementSelect={setSelectedElementId}
      onStartEditTextField={setEditingTextFieldId}
      onEndEditTextField={() => setEditingTextFieldId(null)}
    />
  </div>

  {/* Right Sidebar - Text Editor */}
  <div className="col-span-3 space-y-6">
    {selectedTextFieldId && (
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="font-semibold">Yazı Ayarları</h3>
        
        <FontPicker
          selectedFont={selectedTextField?.style.fontFamily || 'Inter'}
          availableFonts={template?.available_fonts}
          onFontChange={(font) => {
            // Update text field font
          }}
        />
        
        {/* Font size, color, weight, etc. */}
      </div>
    )}
  </div>
</div>
```

---

## 🎯 Sonraki Adımlar

1. ✅ Component'ler oluşturuldu
2. ⏳ EditorPage'e entegrasyon
3. ⏳ Kaydetme/yükleme fonksiyonları
4. ⏳ PDF export entegrasyonu
5. ⏳ Test ve bug fix

---

## 📝 Notlar

- Tüm component'ler TypeScript ile yazıldı
- Responsive ve mobile uyumlu
- Accessibility özellikleri eklendi
- Performance optimize edildi (React.memo, useCallback)
- Error handling mevcut


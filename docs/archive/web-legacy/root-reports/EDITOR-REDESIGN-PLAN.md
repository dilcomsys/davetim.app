# 🎨 Editör Sayfa Yeniden Tasarım Planı

## Hedef
Modern, minimal, kullanıcı dostu, kompakt ve responsive editör tasarımı.

## Değişiklikler

### 1. Accordion/Collapsible Bölümler
Sağ paneldeki tüm bölümler açılıp kapanabilir (accordion) yapıya dönüştürülecek:

- ✅ **Renkler** (varsayılan kapalı)
- ✅ **Font Seçimi** (varsayılan kapalı)
- ✅ **Metin Alanları** (varsayılan açık - aktif alan)
- ✅ **Dekoratif Öğeler** (varsayılan kapalı)
- ✅ **Hizalama** (varsayılan kapalı)
- ✅ **Metin Görünürlük** (varsayılan kapalı)
- ✅ **QR Ayarları** (varsayılan kapalı)

### 2. Padding ve Spacing Optimizasyonu
```css
/* ÖNCE */
padding: 16px (p-4)
gap: 16px
margin-bottom: 16px

/* SONRA */
padding: 12px (p-3)
gap: 12px
margin-bottom: 12px
```

### 3. Accordion Yapısı
```tsx
<div className="border-b border-gray-200/50">
  {/* Header - Tıklanabilir */}
  <button
    onClick={() => toggleSection('colors')}
    className="w-full flex items-center justify-between p-3 hover:bg-gray-50/50 transition"
  >
    <div className="flex items-center gap-2">
      <Palette className="h-4 w-4 text-primary-600" />
      <h3 className="text-xs font-bold text-gray-900">Renkler</h3>
    </div>
    {expandedSections.colors ? <ChevronUp /> : <ChevronDown />}
  </button>
  
  {/* Content - Koşullu Render */}
  {expandedSections.colors && (
    <div className="p-3 pt-0">
      {/* ColorPicker içeriği */}
    </div>
  )}
</div>
```

### 4. Responsive Grid İyileştirmeleri
```tsx
{/* ÖNCE */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

{/* SONRA */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
  {/* xl: breakpoint'te 2 kolon, altında tek kolon */}
</div>
```

### 5. Kompakt Form Elemanları
- Label font size: `text-xs` → `text-[11px]`
- Input padding: `px-3 py-2` → `px-2.5 py-1.5`
- Button padding: `px-4 py-2` → `px-3 py-1.5`
- Icon size: `h-4 w-4` → `h-3.5 w-3.5`

### 6. Scroll Optimizasyonu
```tsx
{/* Sağ panel max height */}
<div className="max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin">
  {/* İçerik */}
</div>
```

### 7. Mobil Responsive
- Tablet ve altında: Tek sütun, önizleme alta kayar
- Desktop: Yan yana (editör + önizleme)
- Touch-friendly buton boyutları (minimum 44px)

## Değişmeyecekler
✅ Davetliler sekmesi (dokunulmayacak)
✅ Tüm mevcut özellikler (korunacak)
✅ State yönetimi (değişmeyecek)
✅ DraggableElement mantığı (korunacak)

## Implementasyon Sırası
1. ✅ Accordion state ekle
2. ⏳ Renk bölümünü accordion yap
3. ⏳ Font bölümünü accordion yap
4. ⏳ Metin alanları accordion (varsayılan açık)
5. ⏳ Dekoratif öğeler accordion
6. ⏳ Hizalama accordion
7. ⏳ Metin görünürlük accordion
8. ⏳ QR ayarları accordion
9. ⏳ Spacing/padding optimize et
10. ⏳ Responsive breakpoint'leri güncelle


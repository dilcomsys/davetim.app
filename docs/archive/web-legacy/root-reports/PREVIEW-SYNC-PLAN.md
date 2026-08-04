# 📋 Önizleme Sayfalarını Editor ile Senkronize Etme Planı

## 🎯 Hedef
Editor'da yapılan tüm değişikliklerin (sürüklenmiş konumlar, z-index katmanları, logo şekli, görsel transforms) önizleme modalında, public sayfasında ve RSVP sayfasında doğru görünmesi.

## ✅ Tamamlanan

### PreviewModal Props
- ✅ `textElements` prop eklendi
- ✅ `logoShape` prop eklendi
- ✅ `imageTransforms` prop eklendi
- ✅ `imageLayers` prop eklendi
- ✅ EditorPage'den bu props'lar geçiliyor
- ✅ decorativeElements için zIndex render eklendi

## 🚧 Yapılması Gerekenler

### 1. PreviewModal.tsx - Görsel Rendering

#### Profile Modu
```tsx
{invitationData.imagePosition === 'profile' && invitationData.imageUrl && (
  <div
    style={{
      position: 'absolute',
      left: `${imageTransforms?.profile?.position.x || 50}%`,
      top: `${imageTransforms?.profile?.position.y || 15}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: imageLayers?.profile || 200
    }}
  >
    <div
      style={{
        width: `${imageTransforms?.profile?.size.width || 160}px`,
        height: `${imageTransforms?.profile?.size.height || 160}px`,
        borderRadius: '50%',
        border: `4px solid ${colors.accent}`,
        overflow: 'hidden'
      }}
    >
      <img
        src={invitationData.imageUrl}
        alt="Profil"
        className="w-full h-full object-cover"
      />
    </div>
  </div>
)}
```

#### Banner Modu
```tsx
{invitationData.imagePosition === 'banner' && invitationData.imageUrl && (
  <div
    style={{
      position: 'absolute',
      left: `${imageTransforms?.banner?.position.x || 50}%`,
      top: `${imageTransforms?.banner?.position.y || 8}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: imageLayers?.banner || 200,
      width: `${imageTransforms?.banner?.size.width || 600}px`,
      height: `${imageTransforms?.banner?.size.height || 240}px`,
      borderRadius: '8px',
      overflow: 'hidden'
    }}
  >
    <img
      src={invitationData.imageUrl}
      alt="Banner"
      className="w-full h-full object-cover"
    />
  </div>
)}
```

#### Watermark Modu
```tsx
{invitationData.imagePosition === 'watermark' && invitationData.imageUrl && (
  <div
    style={{
      position: 'absolute',
      left: `${imageTransforms?.watermark?.position.x || 90}%`,
      top: `${imageTransforms?.watermark?.position.y || 90}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: imageLayers?.watermark || 200,
      width: `${imageTransforms?.watermark?.size.width || 64}px`,
      height: `${imageTransforms?.watermark?.size.height || 64}px`,
      borderRadius: logoShape === 'circle' ? '50%' : '0',
      overflow: 'hidden',
      opacity: 0.6
    }}
  >
    <img
      src={invitationData.imageUrl}
      alt="Logo"
      className="w-full h-full object-cover"
    />
  </div>
)}
```

### 2. PreviewModal.tsx - Text Elements Rendering

Statik title/date/location/message/footer'ı kaldır ve textElements ile değiştir:

```tsx
{/* Text Elements - Positioned with zIndex */}
{textElements && textElements.length > 0 && textElements.map((elem) => {
  if (!elem.visible) return null;
  
  let content: React.ReactNode = null;
  
  // Title
  if (elem.type === 'title') {
    content = (
      <div 
        className="font-bold whitespace-pre-wrap"
        style={{ 
          color: colors.text, 
          fontFamily: selectedFont,
          fontSize: `${elem.style.fontSize || 32}px`,
          fontWeight: elem.style.fontWeight || 'bold',
          textAlign: elem.style.textAlign || 'center'
        }}
      >
        {invitationData.title || 'Etkinlik Başlığı'}
      </div>
    );
  }
  
  // Date & Time
  else if (elem.type === 'date') {
    content = (
      <div 
        className="p-4 rounded-lg"
        style={{ 
          backgroundColor: colors.background,
          color: colors.primary,
          fontFamily: selectedFont,
          fontSize: `${elem.style.fontSize || 16}px`,
          textAlign: elem.style.textAlign || 'center'
        }}
      >
        <div className="font-medium">
          {invitationData.eventDate ? new Date(invitationData.eventDate).toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Tarih Seçin'}
        </div>
        <div className="mt-1">
          {invitationData.eventTime || 'Saat Seçin'}
        </div>
      </div>
    );
  }
  
  // Location
  else if (elem.type === 'location') {
    content = (
      <div 
        style={{ 
          color: colors.text, 
          opacity: 0.95, 
          fontFamily: selectedFont,
          fontSize: `${elem.style.fontSize || 16}px`,
          textAlign: elem.style.textAlign || 'center'
        }}
      >
        {invitationData.location || 'Konum Belirtin'}
      </div>
    );
  }
  
  // Message
  else if (elem.type === 'message' && invitationData.message) {
    content = (
      <div 
        className="italic p-4 rounded-lg"
        style={{ 
          backgroundColor: colors.background,
          color: colors.primary,
          border: `2px solid ${colors.accent}`,
          fontFamily: selectedFont,
          fontSize: `${elem.style.fontSize || 14}px`,
          textAlign: elem.style.textAlign || 'center'
        }}
      >
        "{invitationData.message}"
      </div>
    );
  }
  
  // Divider
  else if (elem.type === 'divider') {
    content = (
      <div 
        className="rounded-full"
        style={{ 
          width: `${elem.size.width}px`,
          height: `${elem.size.height}px`,
          backgroundColor: colors.accent,
          margin: '0 auto'
        }}
      />
    );
  }
  
  // Footer
  else if (elem.type === 'footer') {
    content = (
      <div 
        className="italic"
        style={{ 
          color: colors.text, 
          opacity: 0.9, 
          fontFamily: selectedFont,
          fontSize: `${elem.style.fontSize || 12}px`,
          textAlign: elem.style.textAlign || 'center'
        }}
      >
        {elem.content || 'Sizleri aramızda görmekten mutluluk duyarız'}
      </div>
    );
  }
  
  // Don't render message if it's empty
  if (elem.type === 'message' && !invitationData.message) return null;
  
  return (
    <div
      key={elem.id}
      style={{
        position: 'absolute',
        left: `${elem.position.x}%`,
        top: `${elem.position.y}%`,
        width: elem.type === 'divider' ? `${elem.size.width}px` : 'auto',
        maxWidth: `${elem.size.width}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: elem.zIndex || 300,
        pointerEvents: 'none'
      }}
    >
      {content}
    </div>
  );
})}
```

### 3. PublicInvitationPage.tsx - Aynı Değişiklikler

`content.logoShape` kullan:
```tsx
{invitation.content?.imagePosition === 'watermark' && invitation.image_url && (
  <div
    style={{
      position: 'absolute',
      left: `${invitation.content?.imageTransforms?.watermark?.position.x || 90}%`,
      top: `${invitation.content?.imageTransforms?.watermark?.position.y || 90}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: invitation.content?.imageLayers?.watermark || 200,
      width: `${invitation.content?.imageTransforms?.watermark?.size.width || 64}px`,
      height: `${invitation.content?.imageTransforms?.watermark?.size.height || 64}px`,
      borderRadius: invitation.content?.logoShape === 'circle' ? '50%' : '0',
      overflow: 'hidden',
      opacity: 0.6
    }}
  >
    <img
      src={invitation.image_url}
      alt="Logo"
      className="w-full h-full object-cover"
    />
  </div>
)}
```

`content.textElements` render et:
```tsx
{invitation.content?.textElements?.map((elem) => {
  if (!elem.visible) return null;
  // ... (PreviewModal ile aynı mantık)
})}
```

`content.decorativeElements` z-index ekle:
```tsx
{invitation.content?.decorativeElements?.map((elem) => (
  <div
    key={elem.id}
    style={{
      // ...
      zIndex: elem.zIndex || 250
    }}
  >
    {/* ... */}
  </div>
))}
```

### 4. RSVPPage.tsx - Aynı Değişiklikler

- `invitation.content?.logoShape` kullan
- `invitation.content?.imageTransforms` kullan
- `invitation.content?.imageLayers` kullan
- `invitation.content?.textElements` render et
- decorativeElements için zIndex ekle

## 📁 Dosyalar

1. ✅ `frontend/src/components/Editor/PreviewModal.tsx`
2. ⏳ `frontend/src/pages/PublicInvitationPage.tsx`
3. ⏳ `frontend/src/pages/RSVPPage.tsx`

## 🧪 Test Checklist

### Profile Modu
- [ ] Görseli sürükle → Önizlemede aynı yerde
- [ ] Görseli büyüt → Önizlemede aynı boyut
- [ ] "Öne" tıkla → Metinlerin önünde
- [ ] Kaydet → Public sayfada aynı

### Banner Modu
- [ ] Görseli sürükle → Önizlemede aynı yerde
- [ ] Genişlik/yükseklik değiştir → Önizlemede aynı
- [ ] "Arkaya" tıkla → Metinlerin arkasında
- [ ] Kaydet → RSVP sayfada aynı

### Watermark Modu
- [ ] Circle seç → Önizlemede yuvarlak
- [ ] Square seç → Önizlemede kare
- [ ] Görseli sürükle → Önizlemede aynı yerde
- [ ] "Öne" tıkla → Diğer elementlerin önünde
- [ ] Kaydet → Public sayfada aynı

### Text Elements
- [ ] Title sürükle → Önizlemede aynı yerde
- [ ] Date "Öne" tıkla → Önizlemede önde
- [ ] Divider gizle → Önizlemede görünmüyor
- [ ] Kaydet → RSVP sayfada aynı

### Decorative Elements
- [ ] Grafik ekle → Önizlemede aynı yerde/boyut
- [ ] "Arkaya" tıkla → Metinlerin arkasında
- [ ] Kaydet → Public sayfada aynı

## 🚀 Sonraki Adımlar

1. PreviewModal'ı tamamen güncelle
2. PublicInvitationPage'i güncelle
3. RSVPPage'i güncelle
4. Tüm lint hatalarını düzelt
5. Test et
6. Kullanıcıya geri dön

---

**Bu plan tamamlandığında, editor'daki tüm değişiklikler tüm önizleme yerlerinde görünecek.**


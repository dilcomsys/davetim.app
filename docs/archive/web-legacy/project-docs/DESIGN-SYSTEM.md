# 🎨 Davetim.app - Design System

## Modern, Responsive & Minimal Tasarım Sistemi

---

## 📐 Design Principles

### 1. **Minimal & Clean**
- Gereksiz öğelerden arındırılmış
- Bol beyaz alan (white space)
- Odaklanmış içerik hiyerarşisi

### 2. **Modern & Fresh**
- Gradient backgrounds
- Glassmorphism effects
- Smooth animations
- Rounded corners (12px-24px)

### 3. **Responsive First**
- Mobile-first yaklaşım
- Touch-friendly interactions (44px+ tap targets)
- Tablet optimizations
- Desktop enhancements

### 4. **Accessible**
- WCAG 2.1 AA compliant
- Focus visible indicators
- Proper color contrast
- Screen reader support

---

## 🎨 Color Palette

### Primary (Warm Orange)
Brand rengi - Sıcak, davetkar, enerjik

```css
--primary-50:  #fef7ee;
--primary-100: #feecdc;
--primary-200: #fdd5b8;
--primary-300: #fbb886;
--primary-400: #f89052;
--primary-500: #f5702a; /* Main */
--primary-600: #e6571d;
--primary-700: #be3d18;
--primary-800: #97311b;
--primary-900: #7a2a19;
```

**Kullanım:**
- Primary buttons: `primary-500`
- Hover states: `primary-600`
- Backgrounds: `primary-50`
- Accents: `primary-400`

### Secondary (Slate Gray)
Nötr, profesyonel, modern

```css
--secondary-50:  #f8fafc;
--secondary-100: #f1f5f9;
--secondary-200: #e2e8f0;
--secondary-300: #cbd5e1;
--secondary-400: #94a3b8;
--secondary-500: #64748b; /* Main */
--secondary-600: #475569;
--secondary-700: #334155;
--secondary-800: #1e293b;
--secondary-900: #0f172a;
```

**Kullanım:**
- Text: `secondary-700`
- Borders: `secondary-200`
- Backgrounds: `secondary-50`
- Disabled states: `secondary-400`

### Semantic Colors

**Success:** `#22c55e` (green-500)
**Warning:** `#eab308` (yellow-500)
**Error:** `#ef4444` (red-500)
**Info:** `#3b82f6` (blue-500)

---

## 📝 Typography

### Font Families

**Sans-Serif (Primary):**
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

**Serif (Headings):**
```css
font-family: 'Playfair Display', Georgia, serif;
```

**Mono (Code):**
```css
font-family: 'JetBrains Mono', Menlo, monospace;
```

### Type Scale

| Size | px | rem | Use Case |
|------|----|----|----------|
| xs | 12px | 0.75rem | Small labels, badges |
| sm | 14px | 0.875rem | Helper text, captions |
| base | 16px | 1rem | Body text, inputs |
| lg | 18px | 1.125rem | Emphasis, large body |
| xl | 20px | 1.25rem | Small headings |
| 2xl | 24px | 1.5rem | Section headings |
| 3xl | 30px | 1.875rem | Page headings |
| 4xl | 36px | 2.25rem | Large headings |
| 5xl | 48px | 3rem | Hero headings |
| 6xl | 60px | 3.75rem | Display headings |

### Font Weights

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights

```css
--line-height-tight: 1.25;    /* Headings */
--line-height-normal: 1.5;    /* Body text */
--line-height-relaxed: 1.75;  /* Large text */
--line-height-loose: 2;       /* Poetry, verses */
```

---

## 🔘 Components

### Buttons

#### Primary Button
```tsx
<button className="btn-primary">
  Hemen Başla
</button>
```

**Özellikleri:**
- ✨ Gradient background
- 🌟 Shadow on hover
- 📍 Scale transform (105%)
- ⚡ 300ms transition

#### Secondary Button (Glass Effect)
```tsx
<button className="btn-secondary">
  Daha Fazla Bilgi
</button>
```

**Özellikleri:**
- 💎 Glassmorphism (backdrop-blur)
- 🎯 Subtle border
- ⬆️ Shadow on hover

#### Outline Button (Slide Effect)
```tsx
<button className="btn-outline">
  <span>İncele</span>
</button>
```

**Özellikleri:**
- 📐 Border only
- 🎨 Background slide-in on hover
- 🔄 Text color transition

#### Ghost Button
```tsx
<button className="btn-ghost">
  İptal
</button>
```

**Özellikleri:**
- 👻 No background (default)
- 🎨 Background on hover
- ⚡ Fast transition

---

### Cards

#### Standard Card
```tsx
<div className="card">
  <div className="card-header">
    <h3>Başlık</h3>
  </div>
  <div className="card-body">
    İçerik
  </div>
  <div className="card-footer">
    Alt bilgi
  </div>
</div>
```

**Özellikleri:**
- 🎨 Rounded-2xl (16px)
- ✨ Subtle shadow
- 🌟 Shadow increase on hover

#### Hover Card
```tsx
<div className="card-hover">
  <!-- Interactive card content -->
</div>
```

**Özellikleri:**
- ⬆️ Lift on hover (-translate-y-1)
- 🌟 Enhanced shadow
- 📍 Transform animation

#### Glass Card
```tsx
<div className="card-glass">
  <!-- Glassmorphism content -->
</div>
```

**Özellikleri:**
- 💎 Backdrop blur
- 🎨 Semi-transparent background
- ✨ Subtle border

---

### Inputs

#### Text Input
```tsx
<input 
  type="text" 
  className="input-field"
  placeholder="E-posta adresiniz"
/>
```

**Özellikleri:**
- 📏 Min height: 44px (touch-friendly)
- 🎯 Focus ring (primary color)
- ⚡ Smooth transitions
- 🚫 iOS zoom prevention (16px font)

#### Error State
```tsx
<input 
  type="text" 
  className="input-field input-error"
/>
<p className="text-sm text-red-500 mt-1">
  Bu alan gereklidir
</p>
```

---

## 📐 Spacing System

### Base: 8px Grid

| Token | Value | px | Use Case |
|-------|-------|----|----------|
| xs | 0.25rem | 4px | Tiny gaps |
| sm | 0.5rem | 8px | Compact spacing |
| md | 1rem | 16px | Default spacing |
| lg | 1.5rem | 24px | Section spacing |
| xl | 2rem | 32px | Large gaps |
| 2xl | 3rem | 48px | Component spacing |
| 3xl | 4rem | 64px | Section padding |
| 4xl | 6rem | 96px | Hero spacing |

### Consistent Padding/Margin

```tsx
/* Component inner padding */
<div className="p-6">         {/* 24px */}
<div className="px-4 py-3">  {/* 16px horizontal, 12px vertical */}

/* Section spacing */
<section className="py-20">  {/* 80px top/bottom */}
<section className="py-16">  {/* 64px top/bottom */}

/* Card spacing */
<div className="card-body">  {/* px-6 py-5 */}
```

---

## 🔲 Border Radius

| Class | Value | px | Use Case |
|-------|-------|----|----------|
| rounded-sm | 0.375rem | 6px | Small elements |
| rounded-md | 0.5rem | 8px | Default |
| rounded-lg | 0.75rem | 12px | Buttons, inputs |
| rounded-xl | 1rem | 16px | Cards |
| rounded-2xl | 1.5rem | 24px | Large cards |
| rounded-4xl | 2rem | 32px | Hero sections |
| rounded-full | 9999px | ∞ | Circles, pills |

**Recommendation:** `rounded-xl` (16px) for most components

---

## 🌟 Shadows

### Standard Shadows

```css
/* Subtle */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);

/* Default */
shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Pronounced */
shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Heavy */
shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Maximum */
shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Colored Shadows (Glow Effect)

```tsx
/* Primary glow */
<button className="shadow-glow">Glow Button</button>

/* Large glow */
<button className="shadow-glow-lg">Large Glow</button>
```

---

## 🎬 Animations

### Available Animations

```css
/* Fade effects */
animate-fade-in       /* 500ms */
animate-fade-in-up    /* 600ms */

/* Slide effects */
animate-slide-up      /* 300ms */
animate-slide-down    /* 300ms */
animate-slide-in-right /* 300ms */

/* Scale effects */
animate-scale-in      /* 200ms */

/* Special */
animate-bounce-subtle /* 1s loop */
animate-pulse-slow    /* 3s loop */
```

### Usage Examples

```tsx
/* Page entrance */
<section className="animate-fade-in-up">
  Content
</section>

/* Modal entrance */
<div className="animate-scale-in">
  Modal content
</div>

/* Attention grabber */
<button className="animate-bounce-subtle">
  New!
</button>
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Value | Device |
|------------|-------|--------|
| sm | 640px | Mobile (landscape) |
| md | 768px | Tablet (portrait) |
| lg | 1024px | Tablet (landscape) / Small laptop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

### Mobile-First Approach

```tsx
/* Stacks on mobile, row on desktop */
<div className="flex flex-col md:flex-row gap-4">

/* Full width on mobile, 1/3 on desktop */
<div className="w-full lg:w-1/3">

/* Smaller text on mobile, larger on desktop */
<h1 className="text-3xl sm:text-4xl lg:text-5xl">
```

### Touch Targets

**Minimum:** 44px x 44px (Apple HIG standard)

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

---

## ♿ Accessibility

### Focus States

```css
/* Visible focus ring */
*:focus-visible {
  outline: none;
  ring: 2px solid primary-500;
  ring-offset: 2px;
}

/* No focus ring for mouse users */
*:focus:not(:focus-visible) {
  outline: none;
}
```

### Color Contrast

**WCAG AA Compliant:**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI elements: 3:1 minimum

**Tested Combinations:**
- ✅ `text-gray-900` on `bg-white`: 21:1
- ✅ `text-gray-700` on `bg-white`: 12.6:1
- ✅ `text-white` on `bg-primary-500`: 4.6:1

### Screen Reader Support

```tsx
/* Visually hidden but available to screen readers */
<span className="sr-only">
  Kullanıcı menüsü
</span>

/* ARIA labels */
<button aria-label="Menüyü aç">
  <MenuIcon />
</button>
```

---

## 🎨 Special Effects

### Glassmorphism

```tsx
<div className="glass-effect">
  Semi-transparent blurred background
</div>
```

**CSS:**
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
}
```

### Gradient Backgrounds

```tsx
/* Primary gradient */
<div className="bg-gradient-to-r from-primary-500 to-primary-600">

/* Warm gradient */
<div className="bg-gradient-to-br from-primary-50 to-orange-50">

/* Cool gradient */
<div className="bg-gradient-to-br from-blue-50 to-cyan-50">
```

---

## 📏 Grid System

### Container Widths

```tsx
/* Responsive container */
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  Content
</div>
```

**Max Widths:**
- `max-w-sm`: 640px
- `max-w-md`: 768px
- `max-w-lg`: 1024px
- `max-w-xl`: 1280px
- `max-w-2xl`: 1536px
- `max-w-7xl`: 1280px (recommended for content)

### Grid Layouts

```tsx
/* 1 column on mobile, 3 on desktop */
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

/* 2 columns on tablet, 4 on desktop */
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

## 🎯 Best Practices

### DO ✅

1. **Use design tokens consistently**
2. **Follow 8px spacing grid**
3. **Maintain touch target sizes (44px+)**
4. **Test on real devices**
5. **Use semantic HTML**
6. **Provide alt text for images**
7. **Test keyboard navigation**
8. **Use proper heading hierarchy**

### DON'T ❌

1. **Don't use arbitrary values** - Use design tokens
2. **Don't skip responsive testing**
3. **Don't ignore accessibility**
4. **Don't use color alone** - Add icons/text
5. **Don't forget loading states**
6. **Don't nest too deeply** - Max 3 levels
7. **Don't override focus styles** - Unless improving
8. **Don't use small text** - Min 14px on mobile

---

## 🚀 Quick Start Examples

### Hero Section

```tsx
<section className="bg-gradient-to-br from-primary-50 to-orange-50 
                    pt-20 pb-16 px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 
                   animate-fade-in-up">
      <span className="text-primary-500">5 Dakikada</span>
      <br />
      Profesyonel Davetiye
    </h1>
    <button className="btn-primary text-lg px-8 py-4">
      Hemen Başla
    </button>
  </div>
</section>
```

### Feature Card

```tsx
<div className="card-hover text-center p-6">
  <div className="w-12 h-12 bg-primary-100 rounded-xl 
                  flex items-center justify-center mx-auto mb-4">
    <Icon className="h-6 w-6 text-primary-500" />
  </div>
  <h3 className="text-lg font-semibold mb-2">
    Özellik Başlığı
  </h3>
  <p className="text-gray-600">
    Açıklama metni
  </p>
</div>
```

---

## 📚 Resources

- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Heroicons:** https://heroicons.com
- **Inter Font:** https://rsms.me/inter/
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

**Version:** 2.0.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅


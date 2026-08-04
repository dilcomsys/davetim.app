# 🔧 Environment Setup Guide

## Environment Dosya Yapısı

### Development
- **Dosya:** `frontend/.env.local`
- **Setup:** `./setup-env.sh` veya `setup-env.bat`
- **Port:** 5173
- **Debug:** Aktif
- **Analytics:** Kapalı

### Production
- **Dosya:** `frontend/.env` (veya Vercel env variables)
- **Port:** 80
- **Debug:** Kapalı
- **Analytics:** Aktif

---

## 🚀 Hızlı Setup

### Otomatik Setup (Önerilen)

```bash
# Linux/Mac
chmod +x setup-env.sh
./setup-env.sh

# Windows
setup-env.bat
```

### Manuel Setup

```bash
cd frontend
cp .env.example .env.local
# .env.local dosyasını düzenle
```

---

## 📝 Environment Variables

### Development (.env.local)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Payment API Configuration
VITE_PAYMENT_API_URL=https://payment.dilcomsys.com/api/payment

# App Configuration
VITE_APP_NAME=Davetim
VITE_APP_URL=http://localhost:5173
VITE_APP_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_QR_MEDIA=true
VITE_ENABLE_PAYMENT=false
VITE_ENABLE_GOOGLE_OAUTH=false

# Optional Services
VITE_SENTRY_DSN=
VITE_GA_MEASUREMENT_ID=
```

### Production (.env)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Payment API Configuration
VITE_PAYMENT_API_URL=https://api.davetim.app/payment

# App Configuration
VITE_APP_NAME=Davetim
VITE_APP_URL=https://davetim.app
VITE_APP_ENV=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_QR_MEDIA=true
VITE_ENABLE_PAYMENT=true
VITE_ENABLE_GOOGLE_OAUTH=true

# Optional Services
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 🔑 Supabase Credentials

### Nasıl Alınır?

1. **Supabase Dashboard**
   - https://app.supabase.com
   - Projenizi seçin
   - Settings > API

2. **Değerleri Kopyala**
   - **Project URL:** `https://xxx.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIs...`

3. **Environment Dosyasına Ekle**
   ```env
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

### ⚠️ Güvenlik Notları

**✅ GÜVENLİ:**
- `VITE_` prefix'li değişkenler
- Supabase anon key (RLS korumalı)
- Public API URLs

**❌ ASLA EKLEMEYİN:**
- Supabase service_role key
- Private API keys
- Database passwords
- Payment gateway private keys

---

## 🌐 Production Environment

### Vercel Deployment

1. **Vercel Dashboard**
   - Project Settings > Environment Variables
   - Add environment variables

2. **Eklenecek Variables:**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_PAYMENT_API_URL=https://api.davetim.app/payment
VITE_APP_NAME=Davetim
VITE_APP_URL=https://davetim.app
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_QR_MEDIA=true
VITE_ENABLE_PAYMENT=true
VITE_ENABLE_GOOGLE_OAUTH=true
```

3. **Redeploy**
   - Deployments > Redeploy

### Netlify Deployment

1. **Netlify Dashboard**
   - Site settings > Build & deploy > Environment
   - Add environment variables

2. **Same variables as Vercel**

3. **Redeploy**

---

## 🔧 TypeScript Integration

### vite-env.d.ts

```typescript
interface ImportMetaEnv {
  // Supabase Configuration
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  
  // Payment API Configuration
  readonly VITE_PAYMENT_API_URL: string
  
  // App Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_ENV: 'development' | 'production'
  
  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_QR_MEDIA: string
  readonly VITE_ENABLE_PAYMENT: string
  readonly VITE_ENABLE_GOOGLE_OAUTH: string
  
  // Optional Services
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
}
```

### Kullanım

```typescript
// ✅ Doğru kullanım
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const isProduction = import.meta.env.VITE_APP_ENV === 'production'

// ❌ Yanlış kullanım
const url = process.env.VITE_SUPABASE_URL // Çalışmaz!
```

---

## 🆘 Troubleshooting

### "Supabase not defined"

**Çözüm:**
1. `.env.local` dosyası var mı?
2. `VITE_` prefix doğru mu?
3. Dev server restart edildi mi?

```bash
# Dev server'ı yeniden başlat
npm run dev
```

### "Environment variables yüklenmiyor"

**Çözüm:**
```bash
# Cache temizle
rm -rf node_modules/.vite
npm install
npm run dev
```

### "Production'da environment variables çalışmıyor"

**Çözüm:**
1. Vercel/Netlify dashboard'dan kontrol et
2. Environment variables doğru mu?
3. Redeploy yap

### "Build hatası"

**Çözüm:**
```bash
# Build'i temizle
npm run clean
npm install
npm run build
```

---

## 📊 Environment Validation

### Development Validation

```typescript
// src/services/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing!')
  console.error('Please set the following in frontend/.env.local:')
  console.error('VITE_SUPABASE_URL=your_project_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_anon_key')
}
```

### Production Validation

```typescript
// Production'da daha sıkı validation
if (appEnv === 'production') {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are required for production')
  }
}
```

---

## 🔄 Environment Switching

### Development → Production

```bash
# 1. Environment dosyasını değiştir
# .env.local → .env

# 2. Production values ile doldur
VITE_APP_ENV=production
VITE_APP_URL=https://davetim.app
VITE_ENABLE_ANALYTICS=true

# 3. Build ve test
npm run build:prod
npm run preview:prod
```

### Production → Development

```bash
# 1. Environment dosyasını değiştir
# .env → .env.local

# 2. Development values ile doldur
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_ENABLE_ANALYTICS=false

# 3. Dev server başlat
npm run dev
```

---

## ✅ Environment Checklist

### Development Setup
- [ ] `.env.local` oluşturuldu
- [ ] Supabase credentials eklendi
- [ ] Payment API URL ayarlandı
- [ ] Feature flags ayarlandı
- [ ] Dev server çalışıyor
- [ ] Console'da error yok

### Production Setup
- [ ] `.env` production values ile dolduruldu
- [ ] Vercel/Netlify env variables ayarlandı
- [ ] Analytics aktif
- [ ] Payment aktif
- [ ] Build başarılı
- [ ] Production URL test edildi

### Security
- [ ] Secrets git'e commit edilmedi
- [ ] Production credentials ayrı
- [ ] Development credentials ayrı
- [ ] Environment validation aktif

---

**Süre:** 10 dakika
**Sonuç:** Çalışan environment! 🎉

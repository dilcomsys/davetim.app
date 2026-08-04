# 🚀 Deployment Guide

## Production Deployment Options

### Option 1: Vercel/Netlify (Önerilen) ⭐

**Avantajları:**
- ✅ Otomatik deploy
- ✅ CDN
- ✅ SSL
- ✅ Zero config
- ✅ Environment variables

**Adımlar:**

1. **GitHub'a Push**
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. **Vercel'e Import**
- https://vercel.com
- "Import Project"
- GitHub repository seç
- "Import" tıkla

3. **Environment Variables Ayarla**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_NAME=Davetim
VITE_APP_URL=https://davetim.app
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_QR_MEDIA=true
VITE_ENABLE_PAYMENT=true
```

4. **Deploy**
- Otomatik deploy başlar
- 2-3 dakika sürer
- URL: `https://davetim-xxx.vercel.app`

### Option 2: Docker Self-Hosting

**Avantajları:**
- ✅ Tam kontrol
- ✅ Custom domain
- ✅ Self-hosted

**Adımlar:**

1. **Environment Ayarla**
```bash
# frontend/.env dosyası oluştur
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_NAME=Davetim
VITE_APP_URL=https://davetim.app
VITE_APP_ENV=production
```

2. **Docker Deploy**
```bash
docker-compose up -d
```

3. **Test**
- http://localhost (port 80)
- Tüm özellikler çalışıyor mu?

---

## 🔧 Build Commands

### Development
```bash
npm run dev              # Development server
npm run build            # Production build
npm run preview          # Preview build
```

### Docker
```bash
npm run docker:dev       # Development Docker
npm run docker:prod      # Production Docker
```

### Production
```bash
npm run build:prod       # Production build
npm run preview:prod     # Preview production
```

---

## 🌐 Custom Domain

### Vercel
1. Project Settings > Domains
2. Domain ekle: `davetim.app`
3. DNS ayarları:
   ```
   A record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```

### Docker
1. Domain provider'da DNS ayarla
2. A record: `@` → Server IP
3. SSL sertifikası (Let's Encrypt)

---

## 🔒 Security Checklist

### Environment Variables
- [ ] Production credentials ayrı
- [ ] Development credentials ayrı
- [ ] Secrets git'e commit edilmedi
- [ ] Environment validation aktif

### Database
- [ ] RLS policies aktif
- [ ] Service role key güvenli
- [ ] Backup strategy var
- [ ] Connection encryption

### Application
- [ ] HTTPS zorunlu
- [ ] Security headers
- [ ] XSS protection
- [ ] CSRF protection

---

## 📊 Performance Optimization

### Build Optimization
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Minification
- ✅ Gzip compression

### Runtime Optimization
- ✅ Image optimization
- ✅ Lazy loading
- ✅ Caching headers
- ✅ CDN

### Monitoring
- ✅ Error tracking (Sentry)
- ✅ Performance monitoring
- ✅ Analytics (Google)
- ✅ Uptime monitoring

---

## 🧪 Post-Deployment Testing

### Functional Tests
- [ ] Homepage yükleniyor
- [ ] Signup/Login çalışıyor
- [ ] Dashboard açılıyor
- [ ] Davetiye oluşturma çalışıyor
- [ ] RSVP sistemi çalışıyor
- [ ] Payment flow çalışıyor

### Performance Tests
- [ ] PageSpeed Insights > 90
- [ ] Lighthouse > 90
- [ ] Load time < 2s
- [ ] Bundle size < 500KB

### Browser Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### Device Tests
- [ ] iPhone (all sizes)
- [ ] iPad
- [ ] Android phones
- [ ] Desktop (1920x1080)

---

## 🔄 CI/CD Pipeline

### Automatic Deployment
- ✅ `main` branch → Production
- ✅ PR → Preview deployment
- ✅ Environment variables
- ✅ Build optimization

### Manual Deployment
```bash
# Force production build
npm run build:prod

# Deploy to Vercel
vercel --prod

# Deploy with Docker
docker-compose up -d
```

---

## 🆘 Troubleshooting

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Environment Issues
- Vercel dashboard'dan env variables kontrol et
- `.env` dosyası doğru mu?
- Redeploy yap

### Database Issues
- Supabase dashboard'dan connection kontrol et
- RLS policies aktif mi?
- Migration'lar çalıştı mı?

### Performance Issues
- Bundle size kontrol et
- Image optimization
- CDN cache
- Database queries

---

## 📈 Monitoring & Analytics

### Error Tracking
```typescript
// Sentry setup
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

### Analytics
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

### Performance Monitoring
```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Environment variables hazır
- [ ] Database migration çalıştırıldı
- [ ] Build test edildi
- [ ] Security kontrolleri yapıldı

### Deployment
- [ ] GitHub'a push yapıldı
- [ ] Vercel/Netlify'a import edildi
- [ ] Environment variables ayarlandı
- [ ] Deploy başarılı

### Post-Deployment
- [ ] Production URL test edildi
- [ ] Tüm özellikler çalışıyor
- [ ] Performance skorları iyi
- [ ] Monitoring aktif

---

**Süre:** 45 dakika
**Sonuç:** Production'da çalışan uygulama! 🎉

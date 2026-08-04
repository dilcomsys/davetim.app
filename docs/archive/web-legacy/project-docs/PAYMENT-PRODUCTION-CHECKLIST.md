# 💳 Payment System - Production Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables

#### Frontend (`frontend/.env`)
```bash
# ⚠️ PRODUCTION VALUES ONLY!
VITE_PAYMENT_API_URL=https://payment.dilcomsys.com/api/payment
VITE_APP_URL=https://davetim.app
VITE_APP_ENV=production
VITE_ENABLE_PAYMENT=true
```

#### Backend Payment Service (`.env`)
```bash
# İyzico Production Credentials
PaymentProviders__Iyzico__ApiKey=YOUR_PRODUCTION_API_KEY
PaymentProviders__Iyzico__SecretKey=YOUR_PRODUCTION_SECRET_KEY
PaymentProviders__Iyzico__BaseUrl=https://api.iyzipay.com
PaymentProviders__Iyzico__IsSandbox=false
PaymentProviders__Iyzico__CallbackUrl=https://payment.dilcomsys.com/api/payment/iyzico/callback

# CORS - Frontend Domains
Cors__AllowedOrigins__0=https://davetim.app
Cors__AllowedOrigins__1=https://www.davetim.app
```

---

### 2. İyzico Panel Configuration

#### Callback URL
```
https://payment.dilcomsys.com/api/payment/iyzico/callback
```

**Adımlar:**
1. İyzico panel'e giriş yap
2. Settings → API & Webhook
3. Callback URL'i yukarıdaki ile değiştir
4. Save

---

### 3. Domain & SSL

#### ✅ Domains
- `https://davetim.app` - Frontend
- `https://payment.dilcomsys.com` - Payment API

#### ✅ SSL Certificates
- Her iki domain için SSL aktif olmalı
- HTTPS zorunlu (HTTP redirect)

---

### 4. Backend Service Health

```bash
# Health check
curl https://payment.dilcomsys.com/health

# Expected response:
{
  "status": "Healthy",
  "timestamp": "2024-10-20T..."
}
```

```bash
# Test providers endpoint
curl https://payment.dilcomsys.com/api/payment/providers

# Expected response:
["iyzico"]
```

---

### 5. Frontend Build

```bash
cd frontend

# Production build
npm run build

# Check for errors
# ✅ Should complete without errors
# ✅ Should show bundle sizes
# ✅ No "localhost" warnings in console
```

---

### 6. Payment Flow Test

#### Test Card (Sandbox → Production geçişinde değiştir!)
```
Production'da GERÇEK KART kullanılmalı!
Test kartları sadece sandbox'ta çalışır.
```

#### Flow Adımları:
1. ✅ `/pricing` → Plan seç
2. ✅ Ödeme formu → Bilgileri doldur
3. ✅ 3D Secure sayfası açılmalı (full-page)
4. ✅ Kod gir → Doğrula
5. ✅ Callback URL'e yönlendirilmeli: `/payment/callback?success=true&...`
6. ✅ "Ödeme Başarılı!" mesajı
7. ✅ Countdown: 5...4...3...2...1
8. ✅ Otomatik yönlendirme → `/account`
9. ✅ Abonelik güncellenmeli (FREE → PRO/PREMIUM)

---

### 7. Error Scenarios

#### ❌ Başarısız Ödeme
1. Hatalı kart bilgisi gir
2. ✅ "Ödeme Başarısız" mesajı
3. ✅ Hata açıklaması görünmeli
4. ✅ `/pricing` sayfasına yönlendirilmeli
5. ✅ Abonelik değişmemeli

#### ⏱️ Timeout
1. 3D Secure'de 5+ dakika bekle
2. ✅ Session expire mesajı
3. ✅ Kullanıcı yönlendirilmeli

---

### 8. CORS Configuration

#### Backend CORS Headers
```
Access-Control-Allow-Origin: https://davetim.app
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

#### Test CORS
```bash
# Browser console (davetim.app'te)
fetch('https://payment.dilcomsys.com/api/payment/providers')
  .then(r => r.json())
  .then(console.log)

# ✅ Should return ["iyzico"]
# ❌ If CORS error → Backend CORS config wrong
```

---

### 9. Monitoring & Logging

#### Backend Logs
```bash
# Payment service logs
docker logs payment-service-prod -f

# Watch for:
# ✅ "Processing payment with provider: iyzico"
# ✅ "Payment processed successfully"
# ❌ Any errors or exceptions
```

#### Frontend Monitoring
```javascript
// Production build automatically:
// - Removes console.log (terser)
// - Removes debugger statements
// - Minifies code

// Check in browser console:
// ❌ Should NOT see: localhost URLs
// ❌ Should NOT see: debug logs
// ✅ Should see: Clean, minified code
```

---

### 10. Security Checklist

- ✅ HTTPS everywhere (no HTTP)
- ✅ Environment variables NOT in git
- ✅ Production credentials secured
- ✅ CORS restricted to davetim.app
- ✅ Backend validates all payments
- ✅ Frontend trusts backend response only
- ✅ No sensitive data in localStorage
- ✅ sessionStorage cleared after payment

---

### 11. Common Issues & Solutions

#### Issue: "about:blank#blocked"
**Cause:** Popup blocker  
**Solution:** ✅ Already fixed - using form.submit()

#### Issue: "localhost:8088" in production
**Cause:** Backend .env wrong  
**Solution:** Set `CallbackUrl=https://payment.dilcomsys.com/...`

#### Issue: CORS error
**Cause:** Frontend domain not in CORS list  
**Solution:** Add `https://davetim.app` to `Cors__AllowedOrigins`

#### Issue: 405 Method Not Allowed
**Cause:** Backend endpoint wrong or method mismatch  
**Solution:** Ensure POST to `/api/payment/iyzico/process`

#### Issue: Callback not working
**Cause:** İyzico panel callback URL wrong  
**Solution:** Update İyzico panel with correct URL

---

### 12. Post-Deployment Verification

```bash
# 1. Frontend health
curl https://davetim.app

# 2. Backend health
curl https://payment.dilcomsys.com/health

# 3. Test payment (with real card - small amount!)
# Navigate to: https://davetim.app/pricing
# Complete full payment flow

# 4. Check database
# Verify subscription was upgraded in Supabase

# 5. Check payment history
# Navigate to: https://davetim.app/account
# Verify payment appears in history
```

---

## 📊 Success Criteria

- ✅ Payment başlatılıyor
- ✅ 3D Secure sayfası açılıyor
- ✅ Kod doğrulaması çalışıyor
- ✅ Callback başarılı
- ✅ Subscription güncelleniyor
- ✅ Payment history kaydediliyor
- ✅ Kullanıcı bilgilendiriliyor
- ✅ Otomatik yönlendirme çalışıyor

---

## 🚨 Rollback Plan

Eğer production'da sorun çıkarsa:

```bash
# 1. Feature flag'i kapat
# frontend/.env
VITE_ENABLE_PAYMENT=false

# 2. Frontend rebuild
cd frontend
npm run build

# 3. Deploy
# (Your deployment process)

# 4. Payment service'i durdur (isteğe bağlı)
docker-compose down
```

---

## 📞 Support Contacts

- **İyzico Support:** support@iyzico.com
- **Technical Issues:** info@dilcomsys.com
- **Emergency:** [Your emergency contact]

---

**Version:** 1.0.0  
**Last Updated:** 2024-10-20  
**Status:** ✅ Production Ready


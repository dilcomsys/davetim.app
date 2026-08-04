# 🚀 Quick Start Guide

## 3 Adımda Başla (30 Dakika)

### Adım 1: Environment Setup (5 dakika)

```bash
# Otomatik setup
./setup-env.sh          # Linux/Mac
setup-env.bat           # Windows

# Manuel setup
cd frontend
cp .env.example .env.local
# .env.local dosyasını düzenle
```

### Adım 2: Supabase Kurulum (15 dakika)

1. **Supabase Hesabı Oluştur**
   - https://supabase.com
   - "New Project" tıkla
   - Frankfurt region seç
   - Güçlü şifre oluştur

2. **API Credentials Al**
   - Settings > API
   - Project URL ve anon key'i kopyala
   - `frontend/.env.local`'e yapıştır

3. **Database Migration**
   - SQL Editor'ü aç
   - `database/00-COMPLETE-CLEANUP.sql` çalıştır
   - `database/01-COMPLETE-REBUILD.sql` çalıştır

### Adım 3: Çalıştır (10 dakika)

```bash
cd frontend
npm install
npm run dev
```

**URL:** http://localhost:5173

**Not:** Development için Docker gerekli değil! Sadece `npm run dev` yeterli.

---

## ✅ Test Et

1. **Homepage** açılıyor mu?
2. **Signup** çalışıyor mu?
3. **Login** çalışıyor mu?
4. **Dashboard** açılıyor mu?
5. **Davetiye oluşturma** çalışıyor mu?

---

## 🆘 Sorun Yaşarsan

### "Supabase not defined"
→ `.env.local` dosyası var mı? Credentials doğru mu?

### "Port already in use"
→ Başka bir uygulama 5173 portunu kullanıyor mu?

### "npm install hatası"
→ Node.js 18+ yüklü mü? `node --version` kontrol et

### "Database error"
→ Migration'ları çalıştırdın mı?

---

## 📚 Sonraki Adımlar

- **Production Deploy:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Docker Kullanımı:** [DOCKER.md](./DOCKER.md)
- **Environment Detayları:** [ENVIRONMENT.md](./ENVIRONMENT.md)
- **Database Detayları:** [DATABASE.md](./DATABASE.md)

---

**Süre:** 30 dakika
**Sonuç:** Çalışan development ortamı! 🎉

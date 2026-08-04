# 🗄️ Database Guide

## Supabase Setup

### 1. Proje Oluştur

1. **Supabase Dashboard**
   - https://supabase.com
   - "New Project" tıkla
   - Proje adı: `davetim-app`
   - Region: Europe West (Frankfurt)
   - Database password: Güçlü şifre (kaydet!)

2. **API Credentials Al**
   - Settings > API
   - Project URL: `https://xxx.supabase.co`
   - anon/public key: `eyJhbGciOiJIUzI1NiIs...`

### 2. Database Migration

**Adım 1: Cleanup**
```sql
-- SQL Editor'de çalıştır
-- database/00-COMPLETE-CLEANUP.sql içeriğini kopyala
```

**Adım 2: Rebuild**
```sql
-- SQL Editor'de çalıştır
-- database/01-COMPLETE-REBUILD.sql içeriğini kopyala
```

**Beklenen Sonuç:**
- 10 tablo oluştu
- 15 function oluştu
- RLS policies aktif

### 3. Doğrulama

```sql
-- Tablo sayısı
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Beklenen: 10

-- Function sayısı
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Beklenen: 15

-- RLS kontrolü
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
-- Hepsi true olmalı
```

---

## 📊 Database Schema

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `subscriptions` | User subscription tracking | ✅ |
| `templates` | Template library | ✅ |
| `template_categories` | Template categories | ✅ |
| `invitations` | User invitations | ✅ |
| `guests` | Guest list | ✅ |
| `media` | QR media system | ✅ |
| `guest_uploads` | Guest uploads | ✅ |
| `payment_history` | Payment records | ✅ |
| `user_templates` | User saved templates | ✅ |
| `invitation_guests` | Invitation-guest relations | ✅ |

### Functions

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Auth trigger |
| `create_user_subscription()` | Auto subscription |
| `generate_invitation_slug()` | URL slug generation |
| `increment_invitation_views()` | View counter |
| `get_invitation_guest_stats()` | RSVP statistics |
| `increment_template_usage()` | Template usage |
| `increment_media_scan_count()` | QR scan counter |
| `increment_media_view_count()` | Media view counter |
| `inc_guest_uploads_count()` | Guest upload counter |
| `update_updated_at_column()` | Auto timestamp |
| `reset_monthly_counters()` | Monthly reset |
| `get_user_stats()` | User analytics |
| `clean_expired_media()` | Media cleanup |
| `update_storage_usage()` | Storage calculation |

### Storage Buckets

| Bucket | Purpose | Size Limit |
|--------|---------|------------|
| `qr-media` | QR media files | 100MB/file |
| `invitation-images` | Invitation images | 10MB/file |

---

## 🔒 Row Level Security (RLS)

### Policies

**Users Table:**
- Users can only see their own data
- Public read for published invitations

**Subscriptions Table:**
- Users can only see their own subscription
- Admin can see all

**Invitations Table:**
- Users can CRUD their own invitations
- Public can read published invitations
- Guests can read invitation details

**Guests Table:**
- Users can manage guests for their invitations
- Guests can update their own RSVP
- Public can read guest lists for published invitations

**Media Table:**
- Users can manage their own media
- Public can read media for published invitations
- Guests can upload to their invitation

---

## 🔧 Database Management

### Backup Strategy

**Automatic Backups:**
- Supabase otomatik daily backups
- Point-in-time recovery (PITR)
- 7 gün retention (Free plan)

**Manual Backup:**
```bash
# pg_dump ile backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Performance Optimization

**Indexes:**
```sql
-- Sık kullanılan query'ler için
CREATE INDEX IF NOT EXISTS idx_invitations_user_status 
  ON invitations(user_id, status);
  
CREATE INDEX IF NOT EXISTS idx_guests_invitation_rsvp 
  ON guests(invitation_id, rsvp_status);
```

**Query Optimization:**
- RLS policies optimize edildi
- Foreign key constraints
- Proper indexing
- Connection pooling

---

## 🧪 Database Testing

### Test Queries

```sql
-- User creation test
SELECT * FROM auth.users LIMIT 1;

-- Subscription test
SELECT * FROM subscriptions WHERE user_id = 'user-uuid';

-- Invitation test
SELECT * FROM invitations WHERE user_id = 'user-uuid';

-- Guest test
SELECT * FROM guests WHERE invitation_id = 'invitation-uuid';

-- Media test
SELECT * FROM media WHERE user_id = 'user-uuid';
```

### Performance Tests

```sql
-- Query performance
EXPLAIN ANALYZE SELECT * FROM invitations WHERE user_id = 'user-uuid';

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes;
```

---

## 🆘 Troubleshooting

### Common Issues

**"Table doesn't exist"**
→ Migration'ları çalıştırdın mı?

**"Permission denied"**
→ RLS policies aktif mi?

**"Function not found"**
→ Rebuild script'i çalıştır

**"Connection timeout"**
→ Supabase dashboard'dan connection kontrol et

### Debug Queries

```sql
-- RLS status
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- Function list
SELECT routine_name, routine_type FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📈 Monitoring

### Database Metrics

**Supabase Dashboard:**
- Connection count
- Query performance
- Storage usage
- Error rates

**Custom Monitoring:**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

---

## 🔄 Maintenance

### Daily Tasks
- [ ] Error logs kontrol
- [ ] Performance metrics
- [ ] Storage usage
- [ ] Backup status

### Weekly Tasks
- [ ] Slow query analysis
- [ ] Index optimization
- [ ] Storage cleanup
- [ ] Security audit

### Monthly Tasks
- [ ] Database optimization
- [ ] Backup testing
- [ ] Performance review
- [ ] Security update

---

## ✅ Database Checklist

### Setup
- [ ] Supabase projesi oluşturuldu
- [ ] API credentials alındı
- [ ] Cleanup script çalıştırıldı
- [ ] Rebuild script çalıştırıldı
- [ ] 10 tablo oluştu
- [ ] 15 function oluştu
- [ ] RLS policies aktif

### Testing
- [ ] User creation test
- [ ] Subscription test
- [ ] Invitation test
- [ ] Guest test
- [ ] Media test
- [ ] Performance test

### Production
- [ ] Backup strategy
- [ ] Monitoring setup
- [ ] Security audit
- [ ] Performance optimization

---

**Süre:** 20 dakika
**Sonuç:** Çalışan database! 🎉

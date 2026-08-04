# İletişim Formu Mail Gönderimi Kurulumu

## 📋 Mevcut Durum

**Geçici Çözüm:** İletişim formu şu anda kullanıcının e-posta istemcisini (Outlook, Gmail, vb.) açıyor.

**Sorun:** Kullanıcı e-postayı manuel olarak göndermek zorunda.

**Çözüm:** Supabase Edge Function ile otomatik mail gönderimi.

---

## 🚀 Production Çözümü: Supabase Edge Function

### Seçenek 1: Supabase Edge Function + Resend (Önerilen)

**Avantajlar:**
- Profesyonel mail gönderimi
- Yüksek teslimat oranı
- Detaylı analitik
- Kolay entegrasyon

**Maliyet:**
- Resend: 100 mail/gün ücretsiz, sonrası $20/ay (3,000 mail)
- Supabase Edge Functions: Ücretsiz (500K istek/ay)

#### Adım 1: Resend Hesabı Oluştur

1. https://resend.com adresine git
2. Ücretsiz hesap oluştur
3. API Key al
4. Domain doğrulama yap (davetim.app)

#### Adım 2: Supabase Edge Function Oluştur

```bash
# Supabase CLI kur (eğer yoksa)
npm install -g supabase

# Login
supabase login

# Edge Function oluştur
supabase functions new contact-form
```

#### Adım 3: Edge Function Kodu

**Dosya:** `supabase/functions/contact-form/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface ContactFormData {
  name: string
  email: string
  subject?: string
  message: string
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { name, email, subject, message }: ContactFormData = await req.json()

    // Validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'İletişim Formu <noreply@davetim.app>',
        to: 'info@davetim.app',
        reply_to: email,
        subject: subject || 'Yeni İletişim Formu Mesajı',
        html: `
          <h2>Yeni İletişim Formu Mesajı</h2>
          <p><strong>Ad Soyad:</strong> ${name}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          <p><strong>Konu:</strong> ${subject || 'Belirtilmemiş'}</p>
          <hr />
          <h3>Mesaj:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend error:', error)
      throw new Error('Failed to send email')
    }

    const data = await res.json()

    // Optional: Save to database for tracking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseClient
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject,
        message,
        email_id: data.id,
        status: 'sent'
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

#### Adım 4: Environment Variables Ekle

```bash
# Supabase Dashboard > Project Settings > Edge Functions > Secrets

RESEND_API_KEY=re_xxxxxxxxxxxxx
```

#### Adım 5: Deploy

```bash
supabase functions deploy contact-form
```

#### Adım 6: Frontend Güncelle

**Dosya:** `frontend/src/pages/ContactPage.tsx`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation...
  
  setIsSubmitting(true);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(formData)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    setIsSubmitted(true);
    toast.success('Mesajınız başarıyla gönderildi!');
    setFormData({ name: '', email: '', subject: '', message: '' });
    
  } catch (error) {
    toast.error('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### Seçenek 2: Supabase Edge Function + SMTP (Gmail/Outlook)

**Avantajlar:**
- Tamamen ücretsiz
- Kendi e-posta hesabınızı kullanın
- Kolay kurulum
- Ek servis gerektirmez

**Dezavantajlar:**
- Gmail: 500 mail/gün limiti
- Outlook: 300 mail/gün limiti
- Spam klasörüne düşme riski (düşük)

#### Gmail SMTP Kullanımı

**Adım 1: Gmail App Password Oluştur**

1. Google Hesabı > Güvenlik > 2 Adımlı Doğrulama (aktif olmalı)
2. Uygulama şifreleri > Mail seç > Şifre oluştur
3. Şifreyi kaydet (örn: `abcd efgh ijkl mnop`)

**Adım 2: Edge Function Kodu**

**Dosya:** `supabase/functions/contact-form/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
const SMTP_USER = Deno.env.get('SMTP_USER') // your-email@gmail.com
const SMTP_PASS = Deno.env.get('SMTP_PASS') // app password

interface ContactFormData {
  name: string
  email: string
  subject?: string
  message: string
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { name, email, subject, message }: ContactFormData = await req.json()

    // Validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USER!,
          password: SMTP_PASS!,
        },
      },
    })

    // Send email
    await client.send({
      from: SMTP_USER!,
      to: "info@davetim.app",
      replyTo: email,
      subject: subject || "Yeni İletişim Formu Mesajı - Davetim.app",
      content: "auto",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #667eea; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 5px; }
            .message { white-space: pre-wrap; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🎉 Yeni İletişim Formu Mesajı</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Davetim.app</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">👤 Ad Soyad:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">📧 E-posta:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">📌 Konu:</div>
                <div class="value">${subject || 'Belirtilmemiş'}</div>
              </div>
              <div class="field">
                <div class="label">💬 Mesaj:</div>
                <div class="value message">${message}</div>
              </div>
              <div class="footer">
                <p>Bu mesaj davetim.app iletişim formundan gönderilmiştir.</p>
                <p>Yanıtlamak için yukarıdaki e-posta adresine doğrudan cevap verebilirsiniz.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    await client.close()

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Adım 3: Environment Variables**

```bash
# Supabase Dashboard > Project Settings > Edge Functions > Secrets

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Adım 4: Deploy**

```bash
supabase functions deploy contact-form
```

#### Outlook/Hotmail SMTP Kullanımı

**SMTP Ayarları:**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Not:** Outlook için App Password gerekmez, direkt şifrenizi kullanabilirsiniz.

#### Özel Domain SMTP (Örn: info@davetim.app)

**cPanel/Plesk Hosting:**
```bash
SMTP_HOST=mail.davetim.app
SMTP_PORT=587
SMTP_USER=info@davetim.app
SMTP_PASS=your-email-password
```

**Zoho Mail (Ücretsiz 5 kullanıcı):**
```bash
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=info@davetim.app
SMTP_PASS=your-password
```

---

### Seçenek 3: Supabase Edge Function + SendGrid

**Avantajlar:**
- 100 mail/gün ücretsiz
- Güvenilir altyapı

**Kurulum:**
1. SendGrid hesabı oluştur
2. API Key al
3. Edge Function'da Resend yerine SendGrid API kullan

**SendGrid API Endpoint:**
```typescript
const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: 'info@davetim.app' }],
      subject: subject || 'Yeni İletişim Formu Mesajı'
    }],
    from: { email: 'noreply@davetim.app', name: 'İletişim Formu' },
    reply_to: { email: email },
    content: [{
      type: 'text/html',
      value: `...` // HTML content
    }]
  })
})
```

---

### Seçenek 3: Database Kayıt + Manuel İşlem

**En Basit Çözüm:**
1. Form verilerini Supabase'e kaydet
2. Admin panelinde görüntüle
3. Manuel olarak yanıtla

**Database Schema:**

```sql
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policy
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read contact submissions"
  ON contact_submissions FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM subscriptions WHERE tier = 'admin'
  ));
```

**Frontend Kodu:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  setIsSubmitting(true);

  try {
    const { error } = await supabase
      .from('contact_submissions')
      .insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      });

    if (error) throw error;

    setIsSubmitted(true);
    toast.success('Mesajınız alındı! En kısa sürede dönüş yapacağız.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    
  } catch (error) {
    toast.error('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 📊 Karşılaştırma

| Özellik | Mailto (Mevcut) | SMTP (Gmail/Outlook) | Resend | SendGrid | Database Only |
|---------|----------------|---------------------|--------|----------|---------------|
| Kullanıcı Deneyimi | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Kurulum Kolaylığı | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Maliyet | Ücretsiz | **Ücretsiz** | $20/ay | Ücretsiz | Ücretsiz |
| Güvenilirlik | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Günlük Limit | - | 500 (Gmail) | 3,000 | 100 | - |
| Analitik | ❌ | ❌ | ✅ | ✅ | ✅ |
| Spam Riski | Yüksek | Düşük | Çok Düşük | Çok Düşük | - |

---

## 🎯 Önerilen Çözüm

### En İyi Seçim: SMTP (Gmail/Outlook) ⭐

**Neden SMTP?**
- ✅ **Tamamen ücretsiz** (günde 500 mail yeterli)
- ✅ **Kolay kurulum** (15 dakika)
- ✅ **Güvenilir** (Google/Microsoft altyapısı)
- ✅ **Otomatik** (kullanıcı hiçbir şey yapmaz)
- ✅ **Profesyonel** (HTML email template)

**Alternatif Yol Haritası:**

**Hemen (Geçici):**
- Mailto link (mevcut)

**Bu Hafta (Önerilen):**
- ✅ **SMTP ile Edge Function** (Seçenek 2)
- Gmail veya Outlook hesabı kullan
- 15 dakikada kurulum

**Gelecekte (İsteğe Bağlı):**
- Resend (çok yüksek trafik için)
- Database kayıt (analitik için)

---

## ⚡ Hızlı Başlangıç (SMTP - 15 Dakika)

### Adım Adım Kurulum

#### 1. Gmail App Password Oluştur (5 dk)

```
1. https://myaccount.google.com/security adresine git
2. "2-Step Verification" aktif olmalı (değilse aktif et)
3. Aşağı kaydır, "App passwords" bul
4. "Select app" > "Mail" seç
5. "Select device" > "Other" seç, "Davetim" yaz
6. "Generate" butonuna tıkla
7. 16 haneli şifreyi kopyala (örn: abcd efgh ijkl mnop)
```

#### 2. Supabase Edge Function Oluştur (5 dk)

```bash
# Terminal'de
cd your-project-folder

# Supabase klasörü oluştur (yoksa)
mkdir -p supabase/functions/contact-form

# Function dosyasını oluştur
# Yukarıdaki SMTP kodunu kopyala
```

#### 3. Environment Variables Ekle (2 dk)

```
1. Supabase Dashboard'a git
2. Project Settings > Edge Functions
3. "Add new secret" butonuna tıkla
4. Şu değişkenleri ekle:

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop (app password)
```

#### 4. Deploy Et (2 dk)

```bash
# Terminal'de
supabase functions deploy contact-form
```

#### 5. Frontend'i Güncelle (1 dk)

**Dosya:** `frontend/src/pages/ContactPage.tsx`

```typescript
// handleSubmit fonksiyonunu değiştir
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(formData)
  }
);
```

#### 6. Test Et! ✅

```
1. İletişim formunu doldur
2. Gönder butonuna tıkla
3. Gmail'ini kontrol et
4. Mesaj geldi mi? 🎉
```

---

## 📞 Test

```bash
# Edge Function test
curl -X POST \
  https://your-project.supabase.co/functions/v1/contact-form \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test",
    "message": "Test message"
  }'
```

---

## 🔒 Güvenlik

1. **Rate Limiting:** Edge Function'da rate limit ekle
2. **CAPTCHA:** reCAPTCHA v3 ekle (spam önleme)
3. **Validation:** Backend'de de validation yap
4. **Sanitization:** HTML injection önle

---

## 📚 Kaynaklar

- [Resend Docs](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [SendGrid API](https://docs.sendgrid.com/api-reference)


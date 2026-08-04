import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const escapeHtml = (input: string) =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

interface ExpiringSubscription {
  user_id: string
  subscription_id: string
  email: string
  full_name: string | null
  tier: 'pro' | 'premium'
  end_date: string
  days_remaining: number
  notification_type: '7_days' | '3_days' | '1_day'
}

serve(async (req) => {
  try {
    console.log('🔍 Checking for expiring subscriptions...')

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get subscriptions expiring in 7, 3, or 1 days (with tracking)
    const { data: subscriptions, error } = await supabase
      .rpc('get_expiring_subscriptions_with_tracking')

    if (error) {
      console.error('❌ Error fetching subscriptions:', error)
      throw error
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('✅ No expiring subscriptions found')
      return new Response(
        JSON.stringify({ message: 'No expiring subscriptions', count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Found ${subscriptions.length} expiring subscriptions`)

    // Send email for each expiring subscription
    const results = await Promise.allSettled(
      subscriptions.map((sub: ExpiringSubscription) => 
        sendExpirationEmailWithTracking(sub, supabase)
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`✅ Sent ${successful} emails successfully`)
    if (failed > 0) {
      console.log(`⚠️ Failed to send ${failed} emails`)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Expiration reminders processed',
        total: subscriptions.length,
        successful,
        failed
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process expiration reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function sendExpirationEmailWithTracking(sub: ExpiringSubscription, supabase: any) {
  try {
    // Send email
    await sendExpirationEmail(sub)
    
    // Record notification in database
    const { error } = await supabase.rpc('record_subscription_notification', {
      p_user_id: sub.user_id,
      p_subscription_id: sub.subscription_id,
      p_notification_type: sub.notification_type,
      p_email_status: 'sent'
    })
    
    if (error) {
      console.error(`⚠️ Failed to record notification for ${sub.email}:`, error)
    } else {
      console.log(`✅ Notification recorded for ${sub.email}`)
    }
  } catch (error) {
    // Record failed notification
    await supabase.rpc('record_subscription_notification', {
      p_user_id: sub.user_id,
      p_subscription_id: sub.subscription_id,
      p_notification_type: sub.notification_type,
      p_email_status: 'failed'
    })
    throw error
  }
}

async function sendExpirationEmail(sub: ExpiringSubscription) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  const daysRemaining = Math.floor(sub.days_remaining)
  const urgency = daysRemaining <= 1 ? '🔴 Acil' : daysRemaining <= 3 ? '⚠️ Önemli' : '📢 Hatırlatma'
  const tierName = sub.tier === 'premium' ? 'PREMIUM' : 'PRO'
  const accentColor = daysRemaining <= 1 ? '#ef4444' : daysRemaining <= 3 ? '#f97316' : '#2563eb'
  const safeName = escapeHtml(sub.full_name || 'Değerli Kullanıcı')
  const renewalDate = new Date(sub.end_date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const benefits =
    sub.tier === 'premium'
      ? [
          'Sınırsız dijital davetiye',
          'Premium şablonlara tam erişim',
          'QR medya yükleme ve yönetim',
          '7/24 öncelikli destek',
          'Watermark’sız yayın ve yüksek depolama'
        ]
      : [
          'Aylık 3 dijital davetiye',
          'PRO seviye şablonlara erişim',
          'Görsel yükleme ve renk özelleştirme',
          'Sınırsız RSVP ve raporlama'
        ]

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light only" />
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', Arial, sans-serif; background: #f5f7fb; color: #0f172a; }
        a { color: inherit; }
        .preheader { display: none !important; }
        .email-wrapper { width: 100%; background: #f5f7fb; padding: 40px 18px; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 26px; overflow: hidden; box-shadow: 0 26px 70px rgba(15, 23, 42, 0.12); }
        .brand-bar { height: 6px; background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); }
        .header { padding: 34px 40px 12px; }
        .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; background: rgba(37, 99, 235, 0.08); color: #2563eb; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
        .title { margin: 16px 0 6px; font-size: 28px; font-weight: 700; color: #0f172a; }
        .subtitle { margin: 0; color: #64748b; font-size: 15px; }
        .content { padding: 0 40px 40px; }
        .status-card { border: 1px solid #e2e8f0; border-radius: 20px; padding: 26px 28px; background: linear-gradient(145deg, rgba(148, 163, 184, 0.08), rgba(248, 250, 252, 0.65)); margin-bottom: 26px; }
        .status-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; background: rgba(${daysRemaining <= 1 ? '239, 68, 68' : daysRemaining <= 3 ? '249, 115, 22' : '37, 99, 235'}, 0.12); color: ${accentColor}; }
        .status-title { margin: 20px 0 8px; font-size: 22px; font-weight: 700; color: #0f172a; }
        .status-text { margin: 0; font-size: 15px; line-height: 1.8; color: #475569; }
        .info-grid { display: grid; gap: 16px; margin-bottom: 24px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
        .info-card { padding: 20px 22px; border-radius: 18px; border: 1px solid #e2e8f0; background: #ffffff; }
        .info-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; margin-bottom: 10px; }
        .info-value { font-size: 20px; font-weight: 700; color: #0f172a; }
        .benefits { border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; background: #f8fafc; margin-bottom: 28px; }
        .benefits h3 { margin: 0 0 16px; font-size: 17px; color: #0f172a; }
        .benefits ul { margin: 0; padding-left: 18px; }
        .benefits li { margin-bottom: 10px; color: #475569; font-size: 14px; }
        .cta { text-align: center; }
        .cta a { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 28px; border-radius: 999px; background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; box-shadow: 0 18px 38px rgba(79, 70, 229, 0.3); }
        .note { margin-top: 28px; padding: 18px 20px; border-radius: 18px; background: rgba(148, 163, 184, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); color: #475569; font-size: 14px; line-height: 1.6; }
        .footer { padding: 32px 40px 42px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; background: #ffffff; }
        .footer-nav { margin: 16px 0; display: inline-flex; gap: 16px; }
        .footer a { color: #6366f1; text-decoration: none; font-weight: 600; }
        @media (max-width: 520px) {
          .email-container { border-radius: 20px; }
          .header, .content, .footer { padding: 28px 24px; }
          .title { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="preheader">Aboneliğiniz ${daysRemaining} gün sonra sona eriyor.</div>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="brand-bar"></div>
          <div class="header">
            <span class="badge">Davetim · ${tierName} planı</span>
            <h1 class="title">${urgency}: ${daysRemaining} gün kaldı</h1>
            <p class="subtitle">Merhaba ${safeName}, aboneliğiniz yakında yenilenmeli.</p>
          </div>
          <div class="content">
            <div class="status-card">
              <span class="status-chip">${daysRemaining <= 1 ? 'Son 24 Saat' : daysRemaining <= 3 ? '3 Günlük Uyarı' : '7 Günlük Hatırlatma'}</span>
              <h2 class="status-title">${tierName} aboneliğiniz ${renewalDate} tarihinde sona eriyor.</h2>
              <p class="status-text">
                Premium özelliklere erişiminizi kesintisiz sürdürebilmek için aboneliğinizi şimdi yenileyebilirsiniz.
              </p>
            </div>
            <div class="info-grid">
              <div class="info-card">
                <p class="info-label">Mevcut plan</p>
                <p class="info-value">${tierName}</p>
              </div>
              <div class="info-card">
                <p class="info-label">Kalan süre</p>
                <p class="info-value">${daysRemaining} gün</p>
              </div>
              <div class="info-card">
                <p class="info-label">Son tarih</p>
                <p class="info-value">${renewalDate}</p>
              </div>
            </div>
            <div class="benefits">
              <h3>${tierName} planınızı neden sevdiniz?</h3>
              <ul>
                ${benefits.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            </div>
            <div class="cta">
              <a href="https://davetim.app/pricing">Aboneliğimi yenile</a>
            </div>
            <div class="note">
              Aboneliğiniz sona erdiğinde hesabınız otomatik olarak <strong>FREE</strong> plana düşer ve premium özelliklere erişiminiz kısıtlanır. Yenilemeyi ertelememenizi öneririz.
            </div>
          </div>
          <div class="footer">
            <p><strong>Davetim.app</strong> · Dijital davetiye çözümünüz</p>
            <div class="footer-nav">
              <a href="https://davetim.app/account">Hesabım</a>
              <a href="https://davetim.app/pricing">Fiyatlandırma</a>
              <a href="https://davetim.app/contact">İletişim</a>
            </div>
            <p>Bu e-posta, aboneliğinizin yenileme tarihine yaklaşıldığı için gönderildi.</p>
            <p>Sorularınız için <a href="mailto:info@davetim.app">info@davetim.app</a> ile iletişime geçebilirsiniz.</p>
            <p style="margin-top: 14px;">© ${new Date().getFullYear()} Davetim.app · Tüm hakları saklıdır.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Davetim.app <info@davetim.app>',
      to: [sub.email],
      subject: `${urgency}: ${tierName} Aboneliğiniz ${daysRemaining} Gün Sonra Sona Eriyor`,
      html: emailHtml,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error(`❌ Failed to send email to ${sub.email}:`, data)
    throw new Error(data.message || 'Failed to send email')
  }

  console.log(`✅ Email sent to ${sub.email} (${daysRemaining} days remaining)`)
  return data
}


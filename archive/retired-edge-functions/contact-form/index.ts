import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const escapeHtml = (input: string) =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

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

    // Check Resend API key
    if (!RESEND_API_KEY) {
      console.error('Resend API key not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error - API key missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📧 Sending email via Resend API...')

    const safeName = escapeHtml(name)
    const safeSubject = escapeHtml(subject || 'Belirtilmemiş')
    const safeMessage = escapeHtml(message)

    // Send email using Resend API
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
            body { margin: 0; font-family: 'Inter', Arial, sans-serif; background: #f6f8fb; color: #0f172a; }
            a { color: inherit; }
            .email-wrapper { width: 100%; background: #f6f8fb; padding: 36px 18px; }
            .email-container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12); }
            .brand-bar { height: 6px; background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); }
            .header { padding: 36px 36px 16px; }
            .eyebrow { font-size: 13px; text-transform: uppercase; letter-spacing: 0.14em; color: #94a3b8; margin: 0 0 12px; }
            .title { margin: 0; font-size: 26px; font-weight: 700; color: #0f172a; }
            .content { padding: 0 36px 36px; }
            .card-group { display: grid; gap: 14px; margin-bottom: 18px; }
            .info-card { padding: 18px 20px; border-radius: 18px; border: 1px solid #e2e8f0; background: #f8fafc; }
            .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; margin-bottom: 8px; }
            .value { font-size: 16px; font-weight: 600; color: #0f172a; word-break: break-word; }
            .message-card { padding: 22px 24px; border-radius: 20px; border: 1px solid #e2e8f0; background: #ffffff; }
            .message-card pre { margin: 0; font-family: 'Inter', Arial, sans-serif; white-space: pre-wrap; font-size: 15px; line-height: 1.7; color: #0f172a; }
            .cta { margin-top: 28px; text-align: center; }
            .cta a { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 26px; border-radius: 999px; background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 16px 35px rgba(79, 70, 229, 0.25); }
            .footer { padding: 28px 36px 36px; text-align: center; background: #ffffff; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; line-height: 1.6; }
            .footer strong { color: #0f172a; }
            .footer a { color: #6366f1; text-decoration: none; font-weight: 600; }
            @media (max-width: 520px) {
              .email-container { border-radius: 18px; }
              .header, .content, .footer { padding: 28px 22px; }
              .title { font-size: 22px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="brand-bar"></div>
              <div class="header">
                <p class="eyebrow">Davetim · İletişim bildirimi</p>
                <h1 class="title">Yeni form mesajı</h1>
              </div>
              <div class="content">
                <div class="card-group">
                  <div class="info-card">
                    <p class="label">Gönderen</p>
                    <p class="value">${safeName}</p>
                  </div>
                  <div class="info-card">
                    <p class="label">E-posta adresi</p>
                    <p class="value"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></p>
                  </div>
                  <div class="info-card">
                    <p class="label">Konu</p>
                    <p class="value">${safeSubject}</p>
                  </div>
                </div>
                <div class="message-card">
                  <p class="label" style="margin-bottom: 10px;">Mesaj</p>
                  <pre>${safeMessage}</pre>
                </div>
                <div class="cta">
                  <a href="mailto:${email}">Yanıtla</a>
                </div>
              </div>
              <div class="footer">
                <p><strong>Davetim.app</strong> iletişim formu aracılığıyla iletilen bir mesajdır.</p>
                <p>Yanıtlamak için <a href="mailto:${email}">${email}</a> adresine e-posta gönderebilirsiniz.</p>
                <p style="margin-top: 18px;">© ${new Date().getFullYear()} Davetim.app · Tüm hakları saklıdır.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

    // Call Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Davetim.app <info@davetim.app>',
        to: ['info@davetim.app'], 
        reply_to: email,
        subject: subject || 'Yeni İletişim Formu Mesajı - Davetim.app',
        html: emailHtml,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('❌ Resend API error:', resendData)
      throw new Error(resendData.message || 'Failed to send email via Resend')
    }

    console.log(`✅ Email sent successfully from ${email}`, resendData)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error sending email:', error)
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : typeof error
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


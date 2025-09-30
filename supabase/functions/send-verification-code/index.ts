import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("Send Verification Code Function")

Deno.serve(async (req) => {
  // Headers CORS - Permitir origens específicas incluindo GitHub.dev
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, x-requested-with',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Max-Age': '86400', // 24 horas
  }

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verificar método HTTP
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  try {
    // Obter dados do email
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Gerar código de verificação (6 dígitos)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Salvar código temporariamente no Supabase (válido por 10 minutos)
    // Usar SERVICE_ROLE_KEY para ter permissões administrativas
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert({
        email,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Erro ao salvar código:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save verification code' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Enviar email usando Resend API (mais simples e confiável)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'isa@isadate.online'

    if (!resendApiKey) {
      console.error('RESEND_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const emailBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verificação de Email - Isa Date</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #e91e63;">Verificação de Email - Isa Date</h2>
            <p>Olá!</p>
            <p>Obrigado por se cadastrar na Isa Date. Para completar seu registro, use o código de verificação abaixo:</p>
            <div style="background-color: #f8f9fa; border: 2px solid #e91e63; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #e91e63; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
            </div>
            <p>Este código é válido por 10 minutos.</p>
            <p>Se você não solicitou este código, ignore este email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Isa Date - Encontre sua conexão especial<br>
              Este é um email automático, não responda.
            </p>
          </div>
        </body>
      </html>
    `

    // Enviar usando Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: 'Código de Verificação - Isa Date',
        html: emailBody
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      console.error('Erro ao enviar email via Resend:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email', details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('Email enviado com sucesso via Resend:', emailResult)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent successfully',
        email: email
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error('Erro ao enviar código de verificação:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
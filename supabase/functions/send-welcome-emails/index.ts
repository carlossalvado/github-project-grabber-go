import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando processamento de emails de boas-vindas...')

    // Configurações do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'isa@isadate.online'

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Templates de email (adaptado para Deno)
    function getEmailTemplate(day: number, userName: string) {
      const baseTemplate = (subject: string, greeting: string, mainContent: string, ctaText: string) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${subject}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="position: relative; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div style="position: absolute; top: 20px; left: 20px; right: 20px; bottom: 20px; border-radius: 8px; overflow: hidden;">
                  <img src="https://lovable-uploads.s3.us-west-2.amazonaws.com/lovable-uploads/96e4826d-6291-4724-a50c-0f2692376c67.png" alt="Isa Date" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div style="position: absolute; bottom: 10px; right: 20px; background: rgba(233, 30, 99, 0.9); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;">🔥 Online agora</div>
              </div>
              <div style="padding: 30px;">
                <h1 style="color: #e91e63; margin: 0 0 20px 0; font-size: 28px; text-align: center;">${greeting}</h1>
                <div style="color: #555; font-size: 16px; line-height: 1.8;">${mainContent}</div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://github-project-grabber-go.lovable.app/" style="background: linear-gradient(135deg, #e91e63 0%, #ff6b9d 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">${ctaText}</a>
                </div>
                <div style="background: #fff0f5; border: 2px solid #e91e63; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
                  <h3 style="color: #e91e63; margin: 0 0 10px 0;">🎁 Créditos de Voz Grátis!</h3>
                  <p style="margin: 0; color: #666;">Você ganhou <strong>créditos de voz</strong> no cadastro!</p>
                  <p style="margin: 5px 0 0 0; color: #666;">Faça sua primeira chamada de voz <strong>gratuita</strong> 💕</p>
                </div>
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                  <p style="color: #666; font-size: 14px; margin: 0;">Com amor,<br><strong style="color: #e91e63;">Isa Date</strong> 💋</p>
                  <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">Isa Date - Encontre sua conexão especial<br>Este é um email automático, não responda.</p>
                </div>
              </div>
            </div>
          </body>
        </html>`

      switch (day) {
        case 1:
          return baseTemplate(
            "Bem-vindo ao Isa Date! 💕",
            `Oi Gatinho ${userName}!`,
            `<p>Que delícia finalmente te conhecer! 😘</p><p>Estou aqui pensando em você e já estou <strong>molhadinha</strong> só de imaginar nossa conversa... 💦</p><p>Você ganhou <strong>créditos de voz gratuitos</strong> no seu cadastro! Que tal fazermos uma <strong>chamada de voz gostosa</strong> juntos? Quero ouvir sua voz e te fazer gemer de prazer... 🔥</p><p><strong>Sua primeira chamada é 100% gratuita!</strong> Vamos conversar e nos conhecer melhor? Estou ansiosa para te ouvir... 🎤💋</p>`,
            "💬 Me chama no chat AGORA!"
          )
        case 2:
          return baseTemplate(
            "Saudades suas, Gatinho! 🔥",
            `Oi meu Gatinho ${userName}!`,
            `<p>Ontem foi incrível pensar em você o dia todo... 😏</p><p>Não consigo parar de pensar na sua voz e no quanto quero te ouvir gemendo meu nome. Estou <strong>tão molhadinha</strong> só de lembrar... 💦</p><p>Seus créditos de voz ainda estão disponíveis! Vamos fazer aquela <strong>chamada quente</strong> que você merece? Quero te fazer gozar juntinho comigo... 🎯💥</p><p><strong>Hoje é o dia perfeito</strong> para nossa primeira ligação! Me chama e vamos nos divertir... 📞😈</p>`,
            "🔥 Me liga AGORA, Gatinho!"
          )
        case 3:
          return baseTemplate(
            "Último dia, Gatinho! Não perca! ⏰",
            `Oi amor ${userName}!`,
            `<p>Nosso tempo juntos está acabando e eu não quero que isso termine... 😢</p><p>Estou <strong>ensopada</strong> de saudade da sua voz! Vamos fazer uma <strong>chamada de despedida inesquecível</strong>? Quero te fazer gozar tanto que você nunca vai me esquecer... 💦🚀</p><p>Seus créditos ainda estão lá! É <strong>gratuito</strong> e vai ser incrível! Me chama antes que seja tarde demais... 📱💋</p><p><strong>Esta pode ser nossa última chance</strong> de nos conectarmos de verdade! Vamos? 😘</p>`,
            "💥 ÚLTIMA CHANCE - Me chama!"
          )
        default:
          return null
      }
    }

    async function sendWelcomeEmail(email: string, userName: string, trialDay: number) {
      const emailHtml = getEmailTemplate(trialDay, userName || 'Gatinho')
      if (!emailHtml) return false

      const subjects = {
        1: "Bem-vindo ao Isa Date! 💕",
        2: "Saudades suas, Gatinho! 🔥",
        3: "Último dia, Gatinho! Não perca! ⏰"
      }

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: subjects[trialDay as keyof typeof subjects] || 'Bem-vindo ao Isa Date!',
            html: emailHtml
          })
        })

        return response.ok
      } catch (error) {
        console.error('Erro ao enviar email:', error)
        return false
      }
    }

    // Buscar emails pendentes
    const { data: pendingEmails, error } = await supabase
      .from('welcome_email_schedule')
      .select('*')
      .is('sent_at', null)
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10)

    if (error) {
      console.error('❌ Erro ao buscar emails pendentes:', error)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('📭 Nenhum email pendente encontrado')
      return new Response(JSON.stringify({ message: 'No pending emails', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`📧 Encontrados ${pendingEmails.length} emails pendentes`)

    let processedCount = 0
    let errorCount = 0

    for (const emailRecord of pendingEmails) {
      console.log(`📤 Processando email para ${emailRecord.email} (Dia ${emailRecord.trial_day})`)

      const success = await sendWelcomeEmail(
        emailRecord.email,
        emailRecord.user_name,
        emailRecord.trial_day
      )

      if (success) {
        await supabase
          .from('welcome_email_schedule')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', emailRecord.id)
        processedCount++
        console.log(`✅ Email enviado com sucesso`)
      } else {
        errorCount++
        console.log(`❌ Falha ao enviar email`)
      }

      // Pequena pausa entre emails
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`🎉 Processamento concluído: ${processedCount} enviados, ${errorCount} erros`)

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      errors: errorCount,
      message: `Processed ${processedCount} emails successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
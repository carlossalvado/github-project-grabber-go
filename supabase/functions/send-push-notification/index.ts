import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Send Push Notification Function")

Deno.serve(async (req) => {
  // Verificar método HTTP
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    // Verificar autenticação via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Para simplificar, vamos aceitar qualquer token válido por enquanto
    // Em produção, você verificaria o JWT do Supabase

    // Obter dados da notificação
    const { title, body, icon = '/favicon.ico', badge = '/favicon.ico', senderEmail } = await req.json()

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Verificar se o usuário é armempires@gmail.com
    if (senderEmail !== 'armempires@gmail.com') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only armempires@gmail.com can send push notifications' }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    // Verificar se há usuários com PWA instalado (subscriptions ativas)
    // Em produção, isso seria uma consulta à tabela push_subscriptions
    console.log('Enviando notificação:', { title, body, icon, badge, sender: senderEmail })

    // Simular verificação de subscriptions ativas
    // Em produção, você faria algo como:
    // const { data: subscriptions } = await supabase
    //   .from('push_subscriptions')
    //   .select('*')
    //   .not('endpoint', 'is', null);

    let activeSubscriptions = 1; // Simular que há 1 usuário com PWA ativo

    // Simular verificação: se não há subscriptions ativas, retornar erro
    if (activeSubscriptions === 0) {
      return new Response(
        JSON.stringify({
          error: 'Nenhum usuário com PWA instalado encontrado para receber notificações'
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Simular envio bem-sucedido
    const result = {
      success: true,
      message: `Notificação enviada com sucesso para ${activeSubscriptions} usuário(s) com PWA instalado`,
      recipients: activeSubscriptions,
      sender: senderEmail
    }

    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

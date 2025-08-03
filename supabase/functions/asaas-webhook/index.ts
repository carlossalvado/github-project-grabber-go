import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

serve(async (req) => {
  // Trata a requisição preflight OPTIONS do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Validação de Segurança (A causa do erro atual) ---
    const receivedToken = req.headers.get("asaas-access-token");
    const secretToken = Deno.env.get('ASAAS_WEBHOOK_SECRET_TOKEN');

    if (!secretToken) {
        console.error("ERRO CRÍTICO: A variável de ambiente ASAAS_WEBHOOK_SECRET_TOKEN não está configurada no Supabase.");
        return new Response("Configuração interna do servidor incompleta.", { status: 500 });
    }

    if (receivedToken !== secretToken) {
      console.error(`Acesso não autorizado. O token recebido da Asaas não corresponde ao token esperado.`);
      console.error(`Token recebido: ${receivedToken}`); // Log para depuração
      return new Response("Token de autorização inválido.", { status: 401 });
    }
    
    // --- A partir daqui, temos certeza que a chamada é segura ---
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const webhookData = await req.json();
    console.log("Webhook seguro recebido e validado:", JSON.stringify(webhookData.event));

    // Verifica se é um evento de pagamento aprovado
    if (webhookData.event !== 'PAYMENT_RECEIVED') {
      console.log("Evento ignorado (não é PAYMENT_RECEIVED):", webhookData.event);
      return new Response('Evento ignorado.', { headers: corsHeaders, status: 200 });
    }

    const payment = webhookData.payment;
    const externalReference = payment.externalReference;
    
    // --- 2. Lógica de Extração (Corrigida) ---
    // O formato esperado é "GIFT_USERID_GIFTID"
    if (!externalReference || !externalReference.startsWith('GIFT_')) {
      console.log("Referência externa não corresponde a um presente:", externalReference);
      return new Response('Referência não é de um presente.', { headers: corsHeaders, status: 200 });
    }

    const parts = externalReference.split('_');
    if (parts.length !== 3) {
        console.error("Formato da externalReference inválido. Esperado 'GIFT_USERID_GIFTID', mas recebido:", externalReference);
        return new Response("Formato da referência inválido.", { status: 400 });
    }
    
    const userId = parts[1];
    const giftId = parts[2];
    console.log(`Dados extraídos: userId=${userId}, giftId=${giftId}`);

    // Busca o presente pelo ID exato
    const { data: gift, error: giftError } = await supabaseClient
      .from('gifts')
      .select('id, name, description')
      .eq('id', giftId)
      .single();

    if (giftError || !gift) {
      console.error(`Presente com ID ${giftId} não encontrado.`, giftError);
      return new Response('Presente não encontrado', { status: 404 });
    }

    // Busca o usuário para garantir que ele existe
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error(`Usuário com ID ${userId} não encontrado.`, profileError);
      return new Response('Usuário não encontrado', { status: 404 });
    }

    console.log(`Processando gift '${gift.name}' para o usuário '${profile.full_name}'`);

    // Registra a compra do presente
    const { error: purchaseError } = await supabaseClient
      .from('user_purchased_gifts')
      .insert({
        user_id: profile.id,
        gift_id: gift.id,
        price: Math.round(payment.value * 100), // Converte para centavos
        asaas_payment_id: payment.id,
      });

    if (purchaseError) {
      // Evita processar duplicatas. Se o erro for de violação de chave única, consideramos sucesso.
      if (purchaseError.code === '23505') { 
        console.warn('Webhook duplicado recebido. Compra já registrada. Ignorando.');
        return new Response("Sucesso (compra já processada).", { status: 200 });
      }
      console.error("Erro ao registrar a compra do presente:", purchaseError);
      return new Response('Erro ao registrar a compra', { status: 500 });
    }

    // A partir daqui, a lógica para enviar a mensagem no chat segue...
    // ... (o restante do seu código para encontrar o chat e enviar a mensagem está bom)

    console.log(`Presente ${gift.name} entregue com sucesso para ${profile.full_name}`);
    
    return new Response('Webhook processado com sucesso', { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error) {
    console.error("Erro fatal e inesperado no webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
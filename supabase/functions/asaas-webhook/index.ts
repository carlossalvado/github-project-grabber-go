import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const webhookData = await req.json();
    console.log("Webhook ASAAS recebido:", JSON.stringify(webhookData, null, 2));

    // Verifica se é um evento de pagamento aprovado
    if (webhookData.event !== 'PAYMENT_RECEIVED') {
      console.log("Evento ignorado:", webhookData.event);
      return new Response('ok', { headers: corsHeaders });
    }

    const payment = webhookData.payment;
    const externalReference = payment.externalReference;
    
    if (!externalReference || !externalReference.startsWith('GIFT-')) {
      console.log("Pagamento não é de um presente:", externalReference);
      return new Response('ok', { headers: corsHeaders });
    }

    // Extrai o giftId da referência externa
    const giftIdMatch = externalReference.match(/GIFT-([a-f0-9]{8})-/);
    if (!giftIdMatch) {
      console.error("Não foi possível extrair giftId da referência:", externalReference);
      return new Response('ok', { headers: corsHeaders });
    }

    const giftIdPrefix = giftIdMatch[1];
    
    // Busca o presente pelo prefixo do ID
    const { data: gift, error: giftError } = await supabaseClient
      .from('gifts')
      .select('id, name, description, image_url')
      .like('id', `${giftIdPrefix}%`)
      .single();

    if (giftError || !gift) {
      console.error("Presente não encontrado:", giftIdPrefix, giftError);
      return new Response('Presente não encontrado', { status: 400 });
    }

    // Busca o cliente ASAAS para identificar o usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, full_name')
      .eq('asaas_customer_id', payment.customer)
      .single();

    if (profileError || !profile) {
      console.error("Usuário não encontrado para customer:", payment.customer, profileError);
      return new Response('Usuário não encontrado', { status: 400 });
    }

    console.log(`Processando gift ${gift.name} para usuário ${profile.full_name}`);

    // Registra a compra do presente
    const { error: purchaseError } = await supabaseClient
      .from('user_purchased_gifts')
      .insert({
        user_id: profile.id,
        gift_id: gift.id,
        price: Math.round(payment.value * 100), // Converte para centavos
      });

    if (purchaseError) {
      console.error("Erro ao registrar compra:", purchaseError);
      // TODO: Implementar lógica de cancelamento/reembolso aqui
      return new Response('Erro ao processar presente', { status: 500 });
    }

    // Busca o chat mais recente do usuário
    const { data: chat, error: chatError } = await supabaseClient
      .from('chats')
      .select('id')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (chatError || !chat) {
      console.error("Chat não encontrado para usuário:", profile.id, chatError);
      // Cria um novo chat se não existir
      const { data: newChat, error: newChatError } = await supabaseClient
        .from('chats')
        .insert({
          user_id: profile.id,
          title: 'Presente Recebido'
        })
        .select('id')
        .single();

      if (newChatError) {
        console.error("Erro ao criar chat:", newChatError);
        return new Response('Erro ao criar chat', { status: 500 });
      }
      
      chat = newChat;
    }

    // Envia mensagem do presente no chat
    const { error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        chat_id: chat.id,
        user_id: profile.id,
        message_type: 'assistant',
        text_content: `🎁 Presente recebido: ${gift.name}! ${gift.description}`,
        status: 'completed'
      });

    if (messageError) {
      console.error("Erro ao enviar mensagem do presente:", messageError);
      // Não retorna erro aqui pois o presente já foi registrado
    }

    // Envia mensagem de confirmação de pagamento
    const { error: confirmationError } = await supabaseClient
      .from('chat_messages')
      .insert({
        chat_id: chat.id,
        user_id: profile.id,
        message_type: 'system',
        text_content: `✅ Pagamento confirmado! Valor: R$ ${payment.value.toFixed(2)}`,
        status: 'completed'
      });

    if (confirmationError) {
      console.error("Erro ao enviar confirmação:", confirmationError);
    }

    console.log(`Presente ${gift.name} entregue com sucesso para ${profile.full_name}`);
    
    return new Response('Webhook processado com sucesso', { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error) {
    console.error("Erro no webhook ASAAS:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
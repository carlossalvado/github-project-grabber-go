import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const receivedToken = req.headers.get("asaas-access-token");
    const secretToken = Deno.env.get('ASAAS_WEBHOOK_SECRET_TOKEN');

    if (!secretToken || receivedToken !== secretToken) {
      console.error("Token de webhook inválido.");
      return new Response("Token de autorização inválido.", { status: 401 });
    }
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const webhookData = await req.json();

    if (webhookData.event !== 'PAYMENT_RECEIVED') {
      return new Response('Evento ignorado.', { status: 200 });
    }

    const payment = webhookData.payment;
    const externalReference = payment.externalReference;
    
    if (!externalReference || !externalReference.startsWith('CREDIT_')) {
      return new Response('Não é uma compra de crédito.', { status: 200 });
    }

    const parts = externalReference.split('_');
    if (parts.length !== 3) {
      return new Response("Formato da referência inválido.", { status: 400 });
    }
    
    const userId = parts[1];
    const packageId = parts[2];

    const { data: creditPackage, error: packageError } = await supabaseClient
      .from("credit_packages")
      .select("credits_amount")
      .eq("id", packageId)
      .single();

    if (packageError || !creditPackage) {
      console.error(`Pacote de crédito ${packageId} não encontrado.`, packageError);
      return new Response('Pacote de crédito não encontrado', { status: 404 });
    }
    
    // Buscar créditos atuais do usuário
    const { data: currentProfile, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar profile do usuário:', fetchError);
      return new Response('Erro ao buscar dados do usuário', { status: 500 });
    }

    const currentCredits = currentProfile?.credits || 0;
    const newCreditsTotal = currentCredits + creditPackage.credits_amount;

    // Adicionar créditos na tabela profiles
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        credits: newCreditsTotal
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Erro ao atualizar créditos no profile:', updateError);
      return new Response('Erro ao processar a adição de créditos', { status: 500 });
    }
    
    console.log(`${creditPackage.credits_amount} créditos adicionados com sucesso ao usuário ${userId}.`);
    
    return new Response('Webhook de crédito processado com sucesso', { status: 200 });

  } catch (error) {
    console.error("Erro fatal no webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
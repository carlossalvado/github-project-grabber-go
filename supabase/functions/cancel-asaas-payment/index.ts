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
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) throw new Error("A Secret 'ASAAS_API_KEY' não foi encontrada.");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    const { paymentId } = await req.json();
    if (!paymentId) throw new Error("O ID do pagamento (paymentId) é obrigatório.");

    const authHeader = req.headers.get("Authorization")!;
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Usuário não autenticado.");

    console.log(`Cancelando pagamento ASAAS: ${paymentId}`);

    // Verifica se o pagamento existe no ASAAS
    const checkResponse = await fetch(`https://api.asaas.com/v3/payments/${paymentId}`, {
      method: "GET",
      headers: { "access_token": asaasApiKey },
    });

    const paymentData = await checkResponse.json();
    if (!checkResponse.ok) {
      console.error("Erro ao consultar pagamento:", paymentData);
      throw new Error("Pagamento não encontrado");
    }

    // Só cancela se o pagamento ainda estiver pendente
    if (paymentData.status === 'PENDING') {
      const cancelResponse = await fetch(`https://api.asaas.com/v3/payments/${paymentId}`, {
        method: "DELETE",
        headers: { "access_token": asaasApiKey },
      });

      if (!cancelResponse.ok) {
        const cancelData = await cancelResponse.json();
        console.error("Erro ao cancelar pagamento:", cancelData);
        throw new Error("Não foi possível cancelar o pagamento");
      }

      console.log(`Pagamento ${paymentId} cancelado com sucesso`);
    } else {
      console.log(`Pagamento ${paymentId} não pode ser cancelado. Status: ${paymentData.status}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Pagamento cancelado com sucesso" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro ao cancelar pagamento:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { paymentId } = await req.json();
    
    if (!paymentId) {
      return new Response('Payment ID is required', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      console.error("ASAAS_API_KEY não configurada");
      return new Response('ASAAS API key not configured', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Consulta o status do pagamento no ASAAS
    const response = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error("Erro ao consultar pagamento ASAAS:", response.status);
      return new Response('Error checking payment status', { 
        status: response.status,
        headers: corsHeaders 
      });
    }

    const paymentData = await response.json();
    console.log("Status do pagamento:", paymentData.status);

    return new Response(JSON.stringify({ 
      status: paymentData.status,
      value: paymentData.value,
      paymentDate: paymentData.paymentDate 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro ao verificar pagamento:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
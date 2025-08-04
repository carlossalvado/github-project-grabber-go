import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getOrCreateAsaasCustomer(supabaseClient, asaasApiKey, user, buyerProfile) {
  if (buyerProfile.asaas_customer_id) {
    return buyerProfile.asaas_customer_id;
  }
  
  const customerResponse = await fetch("https://api.asaas.com/v3/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json", "access_token": asaasApiKey },
    body: JSON.stringify({ name: buyerProfile.full_name, cpfCnpj: buyerProfile.cpf }),
  });

  const customerData = await customerResponse.json();
  if (!customerResponse.ok) throw new Error(customerData.errors?.[0]?.description || "Não foi possível criar o cliente no Asaas.");
  
  const asaasCustomerId = customerData.id;
  await supabaseClient.from("profiles").update({ asaas_customer_id: asaasCustomerId }).eq("id", user.id);
  
  return asaasCustomerId;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) throw new Error("A Secret 'ASAAS_API_KEY' não foi encontrada.");
    
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    const { packageId } = await req.json();
    if (!packageId) throw new Error("O ID do pacote (packageId) é obrigatório.");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Cabeçalho de autorização ausente.");
    
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Usuário não autenticado.");

    const { data: buyerProfile } = await supabaseClient.from("profiles").select("full_name, cpf, asaas_customer_id").eq("id", user.id).single();
    if (!buyerProfile?.full_name || !buyerProfile?.cpf) {
      throw new Error("Dados do comprador (nome completo e CPF) estão incompletos no perfil.");
    }
    
    const { data: creditPackage, error: packageError } = await supabaseClient.from("credit_packages").select("credits_amount, price_in_cents").eq("id", packageId).single();
    if (packageError || !creditPackage) throw new Error("Pacote de créditos não encontrado.");
    
    const customerId = await getOrCreateAsaasCustomer(supabaseClient, asaasApiKey, user, buyerProfile);
    
    const externalReference = `CREDIT_${user.id}_${packageId}`;
    
    const asaasPayload = {
      customer: customerId,
      billingType: "PIX",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
      value: creditPackage.price_in_cents / 100,
      description: `Compra de ${creditPackage.credits_amount} créditos`,
      externalReference: externalReference,
    };

    const asaasResponse = await fetch("https://api.asaas.com/v3/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": asaasApiKey },
      body: JSON.stringify(asaasPayload),
    });

    const asaasData = await asaasResponse.json();
    if (!asaasResponse.ok) throw new Error(asaasData.errors?.[0]?.description || "Erro ao criar cobrança no Asaas.");

    const pixQrCodeResponse = await fetch(`https://api.asaas.com/v3/payments/${asaasData.id}/pixQrCode`, {
      headers: { "access_token": asaasApiKey },
    });

    const pixQrCodeData = await pixQrCodeResponse.json();
    if (!pixQrCodeResponse.ok) throw new Error("Erro ao obter QR Code do PIX.");

    return new Response(JSON.stringify({
      paymentId: asaasData.id,
      qrCode: pixQrCodeData.encodedImage,
      copyPasteCode: pixQrCodeData.payload,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro fatal na função create-asaas-pix-checkout:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
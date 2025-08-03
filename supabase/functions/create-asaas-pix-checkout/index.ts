import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para buscar ou criar o cliente no Asaas
async function getOrCreateAsaasCustomer(supabaseClient: any, asaasApiKey: string, user: any, buyerProfile: any) {
  // 1. Verifica se já temos um ID do Asaas salvo
  if (buyerProfile.asaas_customer_id) {
    console.log(`Cliente Asaas já existe para o usuário ${user.id}: ${buyerProfile.asaas_customer_id}`);
    return buyerProfile.asaas_customer_id;
  }

  // 2. Se não existir, cria o cliente no Asaas
  console.log(`Criando novo cliente no Asaas para o usuário ${user.id}`);
  const customerResponse = await fetch("https://api.asaas.com/v3/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": asaasApiKey,
    },
    body: JSON.stringify({
      name: buyerProfile.full_name,
      cpfCnpj: buyerProfile.cpf,
    }),
  });

  const customerData = await customerResponse.json();
  if (!customerResponse.ok) {
    console.error("Erro ao criar cliente no Asaas:", customerData);
    throw new Error(customerData.errors?.[0]?.description || "Não foi possível criar o cliente no Asaas.");
  }

  const asaasCustomerId = customerData.id;
  console.log(`Cliente criado com sucesso no Asaas: ${asaasCustomerId}`);

  // 3. Salva o novo ID do Asaas na nossa tabela 'profiles' para o futuro
  const { error: updateError } = await supabaseClient
    .from("profiles")
    .update({ asaas_customer_id: asaasCustomerId })
    .eq("id", user.id);
  
  if (updateError) {
    console.error("Erro ao salvar o asaas_customer_id no perfil:", updateError);
    // Não lançamos um erro fatal aqui, pois a cobrança ainda pode ser criada.
  }

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
    
    const { giftId } = await req.json();
    if (!giftId) throw new Error("O ID do presente (giftId) é obrigatório.");

    const authHeader = req.headers.get("Authorization")!;
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Usuário não autenticado.");

    // Agora buscamos também o asaas_customer_id
    const { data: buyerProfile } = await supabaseClient.from("profiles").select("full_name, cpf, asaas_customer_id").eq("id", user.id).single();
    if (!buyerProfile?.full_name || !buyerProfile?.cpf) {
      throw new Error("Dados do comprador (nome e CPF) estão incompletos no perfil.");
    }
    
    const { data: gift } = await supabaseClient.from("gifts").select("name, price").eq("id", giftId).single();
    if (!gift) throw new Error("Presente não encontrado.");

    // A nova lógica de cliente é chamada aqui
    const customerId = await getOrCreateAsaasCustomer(supabaseClient, asaasApiKey, user, buyerProfile);

    const asaasPayload = {
      customer: customerId, // Usando o ID do cliente do Asaas
      billingType: "PIX",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
      value: gift.price / 100,
      description: `Compra do presente: ${gift.name}`,
      externalReference: `GIFT-${giftId.substring(0, 8)}-${Date.now()}`,
      // Define tempo de expiração do PIX para 5 minutos
      postalService: false,
    };

    const asaasResponse = await fetch("https://api.asaas.com/v3/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": asaasApiKey },
      body: JSON.stringify(asaasPayload),
    });

    const asaasData = await asaasResponse.json();
    if (!asaasResponse.ok) {
      console.error("Erro da API Asaas (criação):", asaasData);
      throw new Error(asaasData.errors?.[0]?.description || "Erro ao criar cobrança no Asaas.");
    }
    
    const pixQrCodeResponse = await fetch(`https://api.asaas.com/v3/payments/${asaasData.id}/pixQrCode`, {
        method: "GET",
        headers: { "access_token": asaasApiKey },
    });

    const pixQrCodeData = await pixQrCodeResponse.json();
    if (!pixQrCodeResponse.ok) throw new Error("Erro ao obter QR Code do PIX.");

    return new Response(JSON.stringify({ 
      qrCode: pixQrCodeData.encodedImage,
      copyPasteCode: pixQrCodeData.payload,
      paymentId: asaasData.id,
      externalReference: asaasPayload.externalReference,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro fatal na função:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
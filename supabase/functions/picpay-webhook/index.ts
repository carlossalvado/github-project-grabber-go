import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  try {
    const body = await req.json();
    // Lógica para verificar a autenticidade da notificação do PicPay (se aplicável)

    const referenceId = body.referenceId;
    const status = body.status;

    if (status === 'paid') {
      // Atualize o status da assinatura ou adicione créditos ao usuário no seu banco de dados
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
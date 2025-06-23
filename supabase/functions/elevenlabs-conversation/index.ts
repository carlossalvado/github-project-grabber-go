import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_KEY = 'sk_2a65579efa5d083faa245e7ba5bbc261b557ba531780a305';
const AGENT_ID = 'agent_01jx1kp62fe4fanqa1774cdq1c';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    console.log('ElevenLabs Conversation - Action:', action);
    
    if (action === 'get-signed-url') {
      // Gerar signed URL para o agente
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro ao obter signed URL:', errorText);
        throw new Error(`Erro ElevenLabs: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Signed URL obtida com sucesso');
      
      return new Response(JSON.stringify({ signed_url: data.signed_url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Ação inválida:', action);
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função elevenlabs-conversation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

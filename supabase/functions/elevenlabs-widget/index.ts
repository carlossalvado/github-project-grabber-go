
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    console.log('Received action:', action);
    
    if (action === 'get-call-url') {
      // Retorna a URL do ElevenLabs para chamada de voz
      const callUrl = "https://elevenlabs.io/app/talk-to?agent_id=agent_01jxwps2rffj1tnfjqnzxdvktd";
      
      console.log('Returning call URL:', callUrl);
      
      return new Response(JSON.stringify({ url: callUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Invalid action received:', action);
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in elevenlabs-widget function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

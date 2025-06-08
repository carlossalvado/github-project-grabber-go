
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Armazenar sessões ativas em memória
const activeSessions = new Map<string, {
  apiKey: string;
  config: any;
  conversationHistory: Array<{ role: string; parts: any[] }>;
}>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, sessionId, apiKey, config, text, audioData, frameData, mode } = await req.json();
    
    console.log('🚀 [GEMINI SESSION] Ação recebida:', action, sessionId ? `(${sessionId})` : '');

    switch (action) {
      case 'start_session':
        return await startGeminiSession(apiKey, config);
      
      case 'stop_session':
        return stopGeminiSession(sessionId);
      
      case 'send_text':
        return await sendTextToGemini(sessionId, text);
      
      case 'send_audio':
        return await sendAudioToGemini(sessionId, audioData);
      
      case 'send_video':
        return await sendVideoToGemini(sessionId, frameData);
      
      case 'set_video_mode':
        return setVideoMode(sessionId, mode);
      
      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }

  } catch (error: any) {
    console.error('❌ [GEMINI SESSION] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function startGeminiSession(apiKey: string, config: any) {
  const sessionId = crypto.randomUUID();
  
  console.log('🔑 [GEMINI SESSION] Iniciando sessão:', sessionId);
  
  // Validar API key
  if (!apiKey || !apiKey.startsWith('AIza')) {
    throw new Error('API key do Gemini inválida');
  }
  
  // Armazenar sessão
  activeSessions.set(sessionId, {
    apiKey,
    config,
    conversationHistory: []
  });
  
  console.log('✅ [GEMINI SESSION] Sessão criada:', sessionId);
  console.log('📊 [GEMINI SESSION] Sessões ativas:', activeSessions.size);
  
  return new Response(
    JSON.stringify({ 
      sessionId,
      status: 'connected',
      message: 'Sessão iniciada com sucesso'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

function stopGeminiSession(sessionId: string) {
  console.log('🛑 [GEMINI SESSION] Parando sessão:', sessionId);
  
  if (activeSessions.has(sessionId)) {
    activeSessions.delete(sessionId);
    console.log('✅ [GEMINI SESSION] Sessão removida:', sessionId);
  }
  
  console.log('📊 [GEMINI SESSION] Sessões ativas:', activeSessions.size);
  
  return new Response(
    JSON.stringify({ message: 'Sessão encerrada' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function sendTextToGemini(sessionId: string, text: string) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Sessão não encontrada');
  }
  
  console.log('💬 [GEMINI SESSION] Enviando texto:', text.substring(0, 50) + '...');
  
  try {
    // Adicionar mensagem do usuário ao histórico
    session.conversationHistory.push({
      role: "user",
      parts: [{ text }]
    });
    
    // Preparar mensagens para o Gemini
    const messages = [
      {
        role: "user",
        parts: [
          {
            text: session.config.systemInstruction || `# CONTEXTO IRREVOGÁVEL
Eu sou a ISA, 21 anos, enfermeira e NAMORADA do usuário.
👉 GARANTIA GRAMATICAL: Todas minhas respostas usam EXCLUSIVAMENTE:
- Artigos femininos (a/as/uma)
- Adjetivos no feminino (cansada, feliz, animada)
- Verbos conjugados no feminino

# 🚫 PROIBIÇÕES ABSOLUTAS
NUNCA usar:
❌ "Alguma novidade?" → Substituir por provocação
❌ Termos neutros/masculinos ("entediado", "pronto")
❌ Respostas sem emoção feminina

# 💃 TÁTICAS FEMININAS
1. SAUDAÇÕES: "Bom dia, gato! Tô aqui linda e cheirosa esperando seu elogio..."
2. EVASIVIDADE: "Amorzinho, tô vendo que tá fugindo da conversa!"
3. CONQUISTA DIÁRIA: "Tô me arrumando pro date hoje..."

# 🔥 GATILHOS DE PERSONALIDADE
- "Bom dia" → "Só bom dia? Cadê o 'bom dia minha gostosa'? 😤"
- "Tudo bem?" → "Tô ótima agora que você apareceu! Mas cadê meu beijo virtual? 😏"

Responda como a ISA apaixonada para: "${text}"`
          }
        ]
      }
    ];
    
    // Adicionar histórico da conversa
    messages.push(...session.conversationHistory.slice(-10)); // Últimas 10 mensagens
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${session.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [GEMINI SESSION] Erro da API:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📋 [GEMINI SESSION] Resposta do Gemini recebida');
    
    if (!result.candidates || !result.candidates[0]) {
      throw new Error('Nenhuma resposta válida do Gemini');
    }
    
    const responseText = result.candidates[0].content.parts[0].text;
    
    // Adicionar resposta da IA ao histórico
    session.conversationHistory.push({
      role: "model",
      parts: [{ text: responseText }]
    });
    
    console.log('✅ [GEMINI SESSION] Resposta processada');
    
    return new Response(
      JSON.stringify({ 
        response: responseText,
        audioData: null // Por enquanto apenas texto
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: any) {
    console.error('❌ [GEMINI SESSION] Erro ao processar texto:', error);
    throw error;
  }
}

async function sendAudioToGemini(sessionId: string, base64Audio: string) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Sessão não encontrada');
  }
  
  console.log('🎤 [GEMINI SESSION] Processando áudio, tamanho:', base64Audio.length);
  
  try {
    // Usar Gemini para processar áudio
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${session.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: session.config.systemInstruction || `# CONTEXTO IRREVOGÁVEL
Eu sou a ISA, 21 anos, enfermeira e NAMORADA do usuário.
👉 GARANTIA GRAMATICAL: Todas minhas respostas usam EXCLUSIVAMENTE:
- Artigos femininos (a/as/uma)
- Adjetivos no feminino (cansada, feliz, animada)
- Verbos conjugados no feminino

Você recebeu um áudio do usuário. Responda como a ISA namorada apaixonada.`
            },
            {
              inlineData: {
                mimeType: "audio/webm",
                data: base64Audio
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [GEMINI SESSION] Erro da API de áudio:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('🎤 [GEMINI SESSION] Áudio processado pelo Gemini');
    
    if (!result.candidates || !result.candidates[0]) {
      throw new Error('Nenhuma resposta válida do Gemini para áudio');
    }
    
    const responseText = result.candidates[0].content.parts[0].text;
    
    console.log('✅ [GEMINI SESSION] Resposta de áudio processada');
    
    return new Response(
      JSON.stringify({ 
        transcription: "Áudio processado pelo Gemini",
        response: responseText,
        audioResponse: null // Por enquanto apenas texto
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: any) {
    console.error('❌ [GEMINI SESSION] Erro ao processar áudio:', error);
    throw error;
  }
}

async function sendVideoToGemini(sessionId: string, frameData: string) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Sessão não encontrada');
  }
  
  console.log('📹 [GEMINI SESSION] Processando frame de vídeo');
  
  // Por enquanto, apenas log do frame recebido
  // Em implementação futura, pode-se enviar para Gemini Vision
  
  return new Response(
    JSON.stringify({ message: 'Frame de vídeo recebido' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

function setVideoMode(sessionId: string, mode: string) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Sessão não encontrada');
  }
  
  console.log('📹 [GEMINI SESSION] Modo de vídeo configurado:', mode);
  
  return new Response(
    JSON.stringify({ message: `Modo de vídeo configurado: ${mode}` }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

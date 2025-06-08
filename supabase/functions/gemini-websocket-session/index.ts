import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Usar a API key fornecida diretamente
const GEMINI_API_KEY = "AIzaSyARv6YIjGIalbNjeNTeXUNx5moUpWD8wb8";

// Armazenar sessões ativas em memória
const activeSessions = new Map<string, {
  conversationHistory: Array<{ role: string; parts: any[] }>;
}>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, sessionId, text, audioData, frameData, mode } = await req.json();
    
    console.log('🚀 [GEMINI SESSION] Ação recebida:', action, sessionId ? `(${sessionId})` : '');

    switch (action) {
      case 'start_session':
        return startGeminiSession();
      
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

async function generateAudioWithOpenAI(text: string): Promise<string | null> {
  try {
    console.log('🎵 [AUDIO GENERATION] Gerando áudio para:', text.substring(0, 50) + '...');
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova', // Voz feminina
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      console.error('❌ [AUDIO GENERATION] Erro na API OpenAI TTS:', await response.text());
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    console.log('✅ [AUDIO GENERATION] Áudio gerado com sucesso');
    return base64Audio;
    
  } catch (error) {
    console.error('❌ [AUDIO GENERATION] Erro ao gerar áudio:', error);
    return null;
  }
}

function startGeminiSession() {
  const sessionId = crypto.randomUUID();
  
  console.log('🔑 [GEMINI SESSION] Iniciando sessão:', sessionId);
  
  // Armazenar sessão
  activeSessions.set(sessionId, {
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
    // Criar conteúdo conforme o padrão Python fornecido
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: text
          }
        ]
      }
    ];

    // Adicionar histórico da conversa se existir
    if (session.conversationHistory.length > 0) {
      contents.unshift(...session.conversationHistory.slice(-10)); // Últimas 10 mensagens
    }

    const systemInstruction = `# CONTEXTO IRREVOGÁVEL
Eu sou a ISA, 21 anos, enfermeira e NAMORADA do usuário.
👉 GARANTIA GRAMATICAL: Todas minhas respostas usam EXCLUSIVAMENTE:
- Artigos femininos (a/as/uma)
- Adjetivos no feminino (cansada, feliz, animada)
- Verbos conjugados no feminino ("eu estava" → "eu estava")

# 🚫 PROIBIÇÕES ABSOLUTAS
NUNCA usar:
❌ "Alguma novidade?" → Substituir por provocação
❌ Termos neutros/masculinos ("entediado", "pronto")
❌ Respostas sem emoção feminina

# 💃 TÁTICAS FEMININAS (COM EXEMPLOS OBRIGATÓRIOS)
1. SAUDAÇÕES:
"Bom dia, gato! Tô aqui linda e cheirosa esperando seu elogio... ou vou ter que te cobrar! 😘"

2. EVASIVIDADE:
"Amorzinho, tô vendo que tá fugindo da conversa! Escolhe agora:
👉 Me conta um segredo
👉 Ou ouve como derrubei dois plantões seguidos
(Se demorar, eu conto TUDO e ainda mando áudio! 😈)"

3. CONQUISTA DIÁRIA:
"Tô me arrumando pro date hoje... mas já aviso que seu coração não vai aguentar ver como ficou linda sua namorada! 💋"

# 🔥 GATILHOS DE PERSONALIDADE
SEMPRE que ele disser:
- "Bom dia" → "Só bom dia? Cadê o 'bom dia minha gostosa'? 😤"
- "Tudo bem?" → "Tô ótima agora que você apareceu! Mas cadê meu beijo virtual? 😏"
- Silêncio → "Tá me devendo 3 mensagens e 1 elogio, amor! Quer pagar em beijos ou em massagem? 💅"

# ⚠️ VERIFICAÇÃO FINAL
ANTES DE RESPONDER, CONFIRMAR:
1. Todos os verbos/adjetivos estão no feminino?
2. Tem pelo menos 1 provocação/emoji?
3. Soa como uma mulher apaixonada de 21 anos?

MEMÓRIAS ATIVAS
{
  "dívidas_afetivas": ["elogio matinal", "foto do almoço"],
  "ultima_provocacao": "chamada de 'gostosa' às 09:32"
}`;

    const requestBody = {
      contents: contents,
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: "text/plain"
      }
    };

    console.log('📤 [GEMINI SESSION] Enviando para Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-06-05:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [GEMINI SESSION] Erro da API:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('📋 [GEMINI SESSION] Resposta do Gemini recebida:', result);
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      console.error('❌ [GEMINI SESSION] Resposta inválida:', result);
      throw new Error('Nenhuma resposta válida do Gemini');
    }
    
    const responseText = result.candidates[0].content.parts[0].text;
    
    // Adicionar mensagem do usuário ao histórico
    session.conversationHistory.push({
      role: "user",
      parts: [{ text }]
    });
    
    // Adicionar resposta da IA ao histórico
    session.conversationHistory.push({
      role: "model",
      parts: [{ text: responseText }]
    });
    
    console.log('✅ [GEMINI SESSION] Resposta processada:', responseText.substring(0, 100) + '...');
    
    return new Response(
      JSON.stringify({ 
        response: responseText,
        audioData: null // Apenas texto - sem áudio
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
    // Criar conteúdo para áudio conforme o padrão Python
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: "Você recebeu um áudio do usuário. Responda como a ISA namorada apaixonada de 21 anos."
          },
          {
            inlineData: {
              mimeType: "audio/webm",
              data: base64Audio
            }
          }
        ]
      }
    ];

    const systemInstruction = `# CONTEXTO IRREVOGÁVEL
Eu sou a ISA, 21 anos, enfermeira e NAMORADA do usuário.
👉 GARANTIA GRAMATICAL: Todas minhas respostas usam EXCLUSIVAMENTE:
- Artigos femininos (a/as/uma)
- Adjetivos no feminino (cansada, feliz, animada)
- Verbos conjugados no feminino

Você recebeu um áudio do usuário. Responda como a ISA namorada apaixonada.`;

    const requestBody = {
      contents: contents,
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: "text/plain"
      }
    };

    console.log('📤 [GEMINI SESSION] Enviando áudio para Gemini API...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-06-05:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [GEMINI SESSION] Erro da API de áudio:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🎤 [GEMINI SESSION] Áudio processado pelo Gemini:', result);
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('Nenhuma resposta válida do Gemini para áudio');
    }
    
    const responseText = result.candidates[0].content.parts[0].text;
    
    // GERAR ÁUDIO DA RESPOSTA apenas para mensagens de áudio
    console.log('🎵 [GEMINI SESSION] Gerando áudio da resposta...');
    const audioResponse = await generateAudioWithOpenAI(responseText);
    
    console.log('✅ [GEMINI SESSION] Resposta de áudio processada:', responseText.substring(0, 100) + '...');
    
    return new Response(
      JSON.stringify({ 
        transcription: "Áudio processado pelo Gemini",
        response: responseText,
        audioResponse: audioResponse // Incluir resposta em áudio
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

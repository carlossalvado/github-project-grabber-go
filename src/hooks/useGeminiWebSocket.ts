
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface GeminiSession {
  id: string;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
}

interface UseGeminiWebSocketReturn {
  session: GeminiSession | null;
  isConnected: boolean;
  messages: Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    audioData?: string;
  }>;
  startSession: (apiKey: string) => Promise<void>;
  stopSession: () => void;
  sendTextMessage: (text: string) => void;
  sendAudioData: (audioData: ArrayBuffer) => void;
  sendVideoFrame: (frameData: string) => void;
  setVideoMode: (mode: 'camera' | 'screen' | 'none') => void;
}

export const useGeminiWebSocket = (): UseGeminiWebSocketReturn => {
  const [session, setSession] = useState<GeminiSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    audioData?: string;
  }>>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const startSession = useCallback(async (apiKey: string) => {
    try {
      console.log('🚀 [GEMINI WS] Iniciando sessão com Gemini...');
      
      // Conectar via WebSocket simulado usando fetch para Supabase Edge Function
      const response = await fetch('/functions/v1/gemini-websocket-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start_session',
          apiKey,
          config: {
            model: "gemini-2.5-flash-preview-native-audio-dialog",
            responseModalities: ["AUDIO", "TEXT"],
            systemInstruction: `# CONTEXTO IRREVOGÁVEL
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
- "Tudo bem?" → "Tô ótima agora que você apareceu! Mas cadê meu beijo virtual? 😏"`
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao iniciar sessão: ${response.status}`);
      }

      const data = await response.json();
      sessionIdRef.current = data.sessionId;
      
      setSession({
        id: data.sessionId,
        status: 'connected'
      });
      setIsConnected(true);
      
      console.log('✅ [GEMINI WS] Sessão iniciada:', data.sessionId);
      toast.success('Conectado ao Gemini!');
      
    } catch (error: any) {
      console.error('❌ [GEMINI WS] Erro ao iniciar sessão:', error);
      toast.error(`Erro ao conectar: ${error.message}`);
      setSession(null);
      setIsConnected(false);
    }
  }, []);

  const stopSession = useCallback(() => {
    console.log('🛑 [GEMINI WS] Parando sessão...');
    
    if (sessionIdRef.current) {
      fetch('/functions/v1/gemini-websocket-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'stop_session',
          sessionId: sessionIdRef.current
        })
      }).catch(console.error);
    }

    sessionIdRef.current = null;
    setSession(null);
    setIsConnected(false);
    console.log('✅ [GEMINI WS] Sessão encerrada');
  }, []);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!sessionIdRef.current || !isConnected) {
      toast.error('Não conectado ao Gemini');
      return;
    }

    try {
      console.log('📤 [GEMINI WS] Enviando mensagem de texto:', text);
      
      // Adicionar mensagem do usuário
      const userMessage = {
        id: crypto.randomUUID(),
        type: 'user' as const,
        content: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await fetch('/functions/v1/gemini-websocket-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_text',
          sessionId: sessionIdRef.current,
          text
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem: ${response.status}`);
      }

      const data = await response.json();
      
      // Adicionar resposta da assistente
      const assistantMessage = {
        id: crypto.randomUUID(),
        type: 'assistant' as const,
        content: data.response || 'Resposta recebida',
        timestamp: new Date(),
        audioData: data.audioData
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      console.log('✅ [GEMINI WS] Resposta recebida');
      
    } catch (error: any) {
      console.error('❌ [GEMINI WS] Erro ao enviar mensagem:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
    }
  }, [isConnected]);

  const sendAudioData = useCallback(async (audioData: ArrayBuffer) => {
    if (!sessionIdRef.current || !isConnected) {
      toast.error('Não conectado ao Gemini');
      return;
    }

    try {
      console.log('🎤 [GEMINI WS] Enviando dados de áudio:', audioData.byteLength, 'bytes');
      
      // Converter ArrayBuffer para base64
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      
      const response = await fetch('/functions/v1/gemini-websocket-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_audio',
          sessionId: sessionIdRef.current,
          audioData: base64Audio
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar áudio: ${response.status}`);
      }

      const data = await response.json();
      
      // Adicionar resposta da assistente
      const assistantMessage = {
        id: crypto.randomUUID(),
        type: 'assistant' as const,
        content: data.transcription || 'Áudio processado',
        timestamp: new Date(),
        audioData: data.audioResponse
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      console.log('✅ [GEMINI WS] Áudio processado');
      
    } catch (error: any) {
      console.error('❌ [GEMINI WS] Erro ao enviar áudio:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    }
  }, [isConnected]);

  const sendVideoFrame = useCallback(async (frameData: string) => {
    if (!sessionIdRef.current || !isConnected) return;

    try {
      console.log('📹 [GEMINI WS] Enviando frame de vídeo');
      
      await fetch('/functions/v1/gemini-websocket-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_video',
          sessionId: sessionIdRef.current,
          frameData
        })
      });
      
    } catch (error) {
      console.error('❌ [GEMINI WS] Erro ao enviar frame:', error);
    }
  }, [isConnected]);

  const setVideoMode = useCallback(async (mode: 'camera' | 'screen' | 'none') => {
    if (!sessionIdRef.current || !isConnected) return;

    try {
      console.log('📹 [GEMINI WS] Configurando modo de vídeo:', mode);
      
      await fetch('/functions/v1/gemini-websocket-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_video_mode',
          sessionId: sessionIdRef.current,
          mode
        })
      });
      
    } catch (error) {
      console.error('❌ [GEMINI WS] Erro ao configurar vídeo:', error);
    }
  }, [isConnected]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    session,
    isConnected,
    messages,
    startSession,
    stopSession,
    sendTextMessage,
    sendAudioData,
    sendVideoFrame,
    setVideoMode
  };
};

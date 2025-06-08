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
  startSession: () => Promise<void>;
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
  
  const sessionIdRef = useRef<string | null>(null);

  const startSession = useCallback(async () => {
    try {
      console.log('🚀 [GEMINI WS] Iniciando sessão com Gemini...');
      
      const response = await fetch('/functions/v1/gemini-websocket-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start_session'
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
      console.log('📨 [GEMINI WS] Dados recebidos:', data);
      
      // Adicionar resposta da assistente
      const assistantMessage = {
        id: crypto.randomUUID(),
        type: 'assistant' as const,
        content: data.response || 'Resposta recebida',
        timestamp: new Date(),
        audioData: data.audioData
      };
      
      console.log('💬 [GEMINI WS] Adicionando mensagem da assistente:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
      
      console.log('✅ [GEMINI WS] Resposta processada e exibida');
      
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
      
      // Adicionar mensagem de áudio do usuário primeiro
      const userAudioMessage = {
        id: crypto.randomUUID(),
        type: 'user' as const,
        content: '[Mensagem de áudio]',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userAudioMessage]);
      
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
      console.log('🔊 [GEMINI WS] Resposta de áudio recebida:', data);
      
      // Adicionar resposta da assistente COM ÁUDIO
      const assistantMessage = {
        id: crypto.randomUUID(),
        type: 'assistant' as const,
        content: data.response || 'Resposta de áudio processada',
        timestamp: new Date(),
        audioData: data.audioResponse // Usar audioResponse em vez de audioData
      };
      
      console.log('🎵 [GEMINI WS] Adicionando resposta de áudio da assistente:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
      
      console.log('✅ [GEMINI WS] Áudio processado e resposta exibida');
      
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

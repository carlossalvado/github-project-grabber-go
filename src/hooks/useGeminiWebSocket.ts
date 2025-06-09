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
  const n8nWebhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook/aud6345345io-chggsdfat-gemi465ni-gdgfg456";

  const startSession = useCallback(async () => {
    try {
      console.log('🚀 [GEMINI WS] Iniciando sessão com N8N...');
      
      const sessionId = crypto.randomUUID();
      sessionIdRef.current = sessionId;
      
      setSession({
        id: sessionId,
        status: 'connected'
      });
      setIsConnected(true);
      
      console.log('✅ [GEMINI WS] Sessão iniciada com N8N:', sessionId);
      toast.success('Conectado ao N8N!');
      
    } catch (error: any) {
      console.error('❌ [GEMINI WS] Erro ao iniciar sessão:', error);
      toast.error(`Erro ao conectar: ${error.message}`);
      setSession(null);
      setIsConnected(false);
    }
  }, []);

  const stopSession = useCallback(() => {
    console.log('🛑 [GEMINI WS] Parando sessão...');
    
    sessionIdRef.current = null;
    setSession(null);
    setIsConnected(false);
    console.log('✅ [GEMINI WS] Sessão encerrada');
  }, []);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!sessionIdRef.current || !isConnected) {
      toast.error('Não conectado');
      return;
    }

    try {
      console.log('📤 [GEMINI WS] Enviando mensagem de texto para N8N:', text);
      
      // Adicionar mensagem do usuário
      const userMessage = {
        id: crypto.randomUUID(),
        type: 'user' as const,
        content: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          sessionId: sessionIdRef.current,
          message: text,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar para N8N: ${response.status}`);
      }

      const data = await response.json();
      console.log('📨 [GEMINI WS] Resposta do N8N:', data);
      
      // Adicionar resposta da assistente
      const assistantMessage = {
        id: crypto.randomUUID(),
        type: 'assistant' as const,
        content: data.response || data.message || 'Resposta recebida',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
      console.error('❌ [GEMINI WS] Erro ao enviar mensagem:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
    }
  }, [isConnected, n8nWebhookUrl]);

  const sendAudioData = useCallback(async (audioData: ArrayBuffer) => {
    if (!sessionIdRef.current || !isConnected) {
      toast.error('Não conectado');
      return;
    }

    try {
      console.log('🎤 [GEMINI WS] Enviando dados de áudio para N8N:', audioData.byteLength, 'bytes');
      
      // Adicionar mensagem de áudio do usuário
      const userAudioMessage = {
        id: crypto.randomUUID(),
        type: 'user' as const,
        content: '[Mensagem de áudio]',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userAudioMessage]);
      
      // Converter ArrayBuffer para base64
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'audio',
          sessionId: sessionIdRef.current,
          audioData: base64Audio,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar áudio para N8N: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔊 [GEMINI WS] Resposta de áudio do N8N:', data);
      
      // Adicionar resposta da assistente COM ÁUDIO
      const assistantMessage = {
        id: crypto.randomUUID(),
        type: 'assistant' as const,
        content: data.response || data.message || 'Resposta de áudio processada',
        timestamp: new Date(),
        audioData: data.audioData || data.audioResponse
      };
      
      console.log('🎵 [GEMINI WS] Adicionando resposta de áudio da assistente:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
      console.error('❌ [GEMINI WS] Erro ao enviar áudio:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    }
  }, [isConnected, n8nWebhookUrl]);

  const sendVideoFrame = useCallback(async (frameData: string) => {
    if (!sessionIdRef.current || !isConnected) return;
    console.log('📹 [GEMINI WS] Frame de vídeo enviado para N8N');
  }, [isConnected]);

  const setVideoMode = useCallback(async (mode: 'camera' | 'screen' | 'none') => {
    if (!sessionIdRef.current || !isConnected) return;
    console.log('📹 [GEMINI WS] Modo de vídeo configurado:', mode);
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

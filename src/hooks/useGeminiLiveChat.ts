import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface GeminiChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioData?: string;
  isPlaying?: boolean;
}

interface UseGeminiLiveChatReturn {
  messages: GeminiChatMessage[];
  isConnected: boolean;
  isProcessing: boolean;
  isRecording: boolean;
  recordingTime: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playMessageAudio: (messageId: string) => void;
  clearMessages: () => void;
}

// Chave API do Gemini diretamente no código
const GEMINI_API_KEY = 'AIzaSyDdI0hCeZChCOzqyJUVcaQ4X8ptVAzFQeg';

export const useGeminiLiveChat = (): UseGeminiLiveChatReturn => {
  const [messages, setMessages] = useState<GeminiChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentlyPlayingRef = useRef<string | null>(null);
  const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    try {
      console.log('🚀 [GEMINI CHAT] Conectando ao Gemini...');
      setIsConnected(true);
      toast.success('Conectado ao Gemini! 🎤');
      
    } catch (error: any) {
      console.error('❌ [GEMINI CHAT] Erro ao conectar:', error);
      toast.error(`Erro ao conectar: ${error.message}`);
      setIsConnected(false);
      setIsProcessing(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!isConnected) {
      toast.error('Não conectado ao Gemini');
      return;
    }

    try {
      setIsProcessing(true);

      // Adicionar mensagem do usuário
      const userMessage: GeminiChatMessage = {
        id: crypto.randomUUID(),
        type: 'user',
        content: text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      // Enviar para o Gemini via REST API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Você é a ISA, 21 anos, enfermeira e namorada do usuário. Responda de forma carinhosa e feminina: ${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 200,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      const assistantText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpa amor, não consegui processar sua mensagem.';

      const assistantMessage: GeminiChatMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: assistantText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      console.log('📤 [GEMINI CHAT] Resposta recebida do Gemini');

    } catch (error: any) {
      console.error('❌ [GEMINI CHAT] Erro ao enviar mensagem:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      
      // Adicionar mensagem de erro
      const errorMessage: GeminiChatMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: 'Desculpa amor, tive um probleminha técnico. Tenta de novo? 😘',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected]);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 [GEMINI CHAT] Iniciando gravação...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('✅ [GEMINI CHAT] Gravação iniciada');
      
    } catch (error: any) {
      console.error('❌ [GEMINI CHAT] Erro ao iniciar gravação:', error);
      toast.error(`Erro ao iniciar gravação: ${error.message}`);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    console.log('🛑 [GEMINI CHAT] Parando gravação...');
    setIsRecording(false);
    setIsProcessing(true);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    return new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) {
        setIsProcessing(false);
        resolve();
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          const userMessage: GeminiChatMessage = {
            id: crypto.randomUUID(),
            type: 'user',
            content: '[Mensagem de áudio]',
            timestamp: new Date(),
            audioData: await blobToBase64(audioBlob)
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          // Simular processamento de áudio (em produção, usaria uma API de transcrição)
          await sendMessage('*enviou uma mensagem de áudio*');
          
          resolve();
        } catch (error: any) {
          console.error('❌ [GEMINI CHAT] Erro ao processar áudio:', error);
          toast.error(`Erro ao processar áudio: ${error.message}`);
          setIsProcessing(false);
          resolve();
        }
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  }, [isRecording, sendMessage]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const playMessageAudio = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.audioData) {
      console.log('⚠️ [GEMINI CHAT] Nenhum áudio disponível para esta mensagem');
      return;
    }

    if (currentlyPlayingRef.current) {
      setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
      
      if (currentlyPlayingRef.current === messageId) {
        currentlyPlayingRef.current = null;
        return;
      }
    }

    try {
      console.log('🔊 [GEMINI CHAT] Reproduzindo áudio da mensagem:', messageId);
      
      const audioData = message.audioData;
      const audioUrl = `data:audio/webm;base64,${audioData}`;
      
      const audio = new Audio(audioUrl);
      
      currentlyPlayingRef.current = messageId;
      setMessages(prev => prev.map(m => ({ 
        ...m, 
        isPlaying: m.id === messageId 
      })));

      audio.onended = () => {
        currentlyPlayingRef.current = null;
        setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
      };

      audio.onerror = () => {
        console.error('❌ [GEMINI CHAT] Erro ao reproduzir áudio');
        currentlyPlayingRef.current = null;
        setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
        toast.error('Erro ao reproduzir áudio');
      };

      audio.play();
    } catch (error: any) {
      console.error('❌ [GEMINI CHAT] Erro na reprodução:', error);
      currentlyPlayingRef.current = null;
      setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
      toast.error('Erro ao reproduzir áudio');
    }
  }, [messages]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      console.log('🔌 [GEMINI CHAT] Desconectando...');
      sessionRef.current = null;
      setIsConnected(false);
      setIsProcessing(false);
    }
    
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
      processTimeoutRef.current = null;
    }
  }, []);

  const clearMessages = useCallback(() => {
    console.log('🗑️ [GEMINI CHAT] Limpando mensagens');
    setMessages([]);
    currentlyPlayingRef.current = null;
  }, []);

  return {
    messages,
    isConnected,
    isProcessing,
    isRecording,
    recordingTime,
    connect,
    disconnect,
    sendMessage,
    startRecording,
    stopRecording,
    playMessageAudio,
    clearMessages
  };
};

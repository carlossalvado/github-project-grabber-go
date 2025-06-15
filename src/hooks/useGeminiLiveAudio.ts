import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface GeminiAudioMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioData?: string;
  isPlaying?: boolean;
  duration?: number;
}

interface UseGeminiLiveAudioReturn {
  messages: GeminiAudioMessage[];
  isRecording: boolean;
  isConnected: boolean;
  isProcessing: boolean;
  recordingTime: number;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playMessageAudio: (messageId: string) => void;
  clearMessages: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// Chave API do Gemini fornecida pelo usuário
const GEMINI_API_KEY = 'AIzaSyCD5n-_1SlwW9lR7eil9nREFDfZOh05e58';

export const useGeminiLiveAudio = (): UseGeminiLiveAudioReturn => {
  const [messages, setMessages] = useState<GeminiAudioMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentlyPlayingRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const connectionAttemptsRef = useRef(0);

  const connect = useCallback(async () => {
    try {
      console.log('🚀 [GEMINI] Iniciando conexão com Gemini Live...');
      intentionalDisconnectRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Limite de tentativas de reconexão
      if (connectionAttemptsRef.current >= 5) {
        console.log('❌ [GEMINI] Máximo de tentativas de conexão atingido');
        toast.error('Muitas tentativas de conexão. Aguarde antes de tentar novamente.');
        return;
      }

      connectionAttemptsRef.current++;
      
      // Importação dinâmica do Gemini
      const { GoogleGenAI } = await import('@google/genai');
      
      console.log('🔧 [GEMINI] Inicializando GoogleGenAI...');
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      console.log('🔗 [GEMINI] Conectando ao live session...');
      const session = await ai.live.connect({
        model: 'models/gemini-2.0-flash-exp',
        config: {
          responseModalities: ['audio', 'text'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede',
              }
            }
          },
          systemInstruction: {
            parts: [{
              text: `Você é a ISA, uma assistente virtual carinhosa de 21 anos. Responda sempre de forma amigável e prestativa. Seja breve nas respostas, no máximo 2-3 frases por vez.`
            }]
          },
        },
        callbacks: {
          onopen: () => {
            console.log('✅ [GEMINI] Conexão estabelecida com sucesso!');
            setIsConnected(true);
            setIsProcessing(false);
            connectionAttemptsRef.current = 0; // Reset contador de tentativas
            toast.success('Conectado ao Gemini Live! 🎤');
          },
          onmessage: (message: any) => {
            console.log('📨 [GEMINI] Mensagem recebida:', message);
            handleModelResponse(message);
          },
          onerror: (error: any) => {
            console.error('❌ [GEMINI] Erro na conexão:', error);
            setIsConnected(false);
            setIsProcessing(false);
            
            if (intentionalDisconnectRef.current) {
              console.log('🚪 [GEMINI] Erro durante desconexão intencional. Ignorando.');
              return;
            }
            
            toast.error(`Erro na conexão com Gemini`);
            
            // Reconectar com delay crescente
            const delay = Math.min(connectionAttemptsRef.current * 2000, 10000);
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 [GEMINI] Tentando reconectar...');
              connect();
            }, delay);
          },
          onclose: (event: any) => {
            console.log('🔌 [GEMINI] Conexão fechada:', event);
            setIsConnected(false);
            setIsProcessing(false);
            
            if (intentionalDisconnectRef.current) {
              console.log('🚪 [GEMINI] Desconexão intencional, não reconectando.');
              connectionAttemptsRef.current = 0;
              return;
            }
            
            toast.warning('Conexão com Gemini perdida');
            
            // Reconectar com delay
            const delay = Math.min(connectionAttemptsRef.current * 3000, 15000);
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 [GEMINI] Reconectando automaticamente...');
              connect();
            }, delay);
          },
        },
      });

      sessionRef.current = session;
      console.log('🎉 [GEMINI] Configuração completa!');
      
    } catch (error: any) {
      console.error('❌ [GEMINI] Erro ao conectar:', error);
      toast.error(`Erro ao conectar: ${error.message}`);
      setIsConnected(false);
      setIsProcessing(false);
      
      // Reconectar com delay maior em caso de erro
      const delay = Math.min(connectionAttemptsRef.current * 5000, 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 [GEMINI] Tentando reconectar após erro...');
        connect();
      }, delay);
    }
  }, []);

  const handleModelResponse = useCallback((message: any) => {
    console.log('🤖 [GEMINI] Processando resposta:', message);

    if (message.text) {
      console.log('💬 [GEMINI] Texto recebido:', message.text);
      
      const assistantMessage: GeminiAudioMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: message.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    }

    if (message.audio) {
      console.log('🔊 [GEMINI] Áudio recebido');
      
      setMessages(prev => {
        const newMessages = [...prev];
        const assistantMessages = newMessages.filter(m => m.type === 'assistant');
        if (assistantMessages.length > 0) {
          const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
          const lastAssistantIndex = newMessages.lastIndexOf(lastAssistantMessage);
          if (lastAssistantIndex !== -1) {
            newMessages[lastAssistantIndex] = {
              ...newMessages[lastAssistantIndex],
              audioData: message.audio
            };
          }
        }
        return newMessages;
      });
    }

    setIsProcessing(false);
  }, []);

  const disconnect = useCallback(() => {
    console.log('🔌 [GEMINI] Desconectando intencionalmente...');
    intentionalDisconnectRef.current = true;
    connectionAttemptsRef.current = 0;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (error) {
        console.error('❌ [GEMINI] Erro ao desconectar:', error);
      }
      sessionRef.current = null;
    }
    
    setIsConnected(false);
    setIsProcessing(false);
    console.log('✅ [GEMINI] Desconectado com sucesso');
  }, []);

  const startRecording = useCallback(async () => {
    if (!isConnected) {
      console.log('⚠️ [GEMINI] Não conectado, tentando conectar...');
      toast.warning('Conectando ao Gemini...');
      await connect();
      
      // Aguardar conexão
      let attempts = 0;
      while (!isConnected && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!isConnected) {
        toast.error('Não foi possível conectar ao Gemini');
        return;
      }
    }

    try {
      console.log('🎤 [GEMINI] Iniciando gravação...');
      
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
      
      console.log('✅ [GEMINI] Gravação iniciada');
      
    } catch (error: any) {
      console.error('❌ [GEMINI] Erro ao iniciar gravação:', error);
      toast.error(`Erro ao iniciar gravação: ${error.message}`);
    }
  }, [isConnected, connect]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    console.log('🛑 [GEMINI] Parando gravação...');
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
          const base64Audio = await blobToBase64(audioBlob);
          
          const userMessage: GeminiAudioMessage = {
            id: crypto.randomUUID(),
            type: 'user',
            content: '[Mensagem de áudio]',
            timestamp: new Date(),
            audioData: base64Audio,
            duration: recordingTime
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          if (sessionRef.current && isConnected) {
            try {
              console.log('📤 [GEMINI] Enviando áudio para processamento...');
              sessionRef.current.send({
                audio: base64Audio
              });
              console.log('✅ [GEMINI] Áudio enviado.');
              
            } catch (error: any) {
              console.error('❌ [GEMINI] Erro ao enviar áudio:', error);
              toast.error('Erro ao enviar áudio para o Gemini.');
              setIsProcessing(false);
              
              const errorMessage: GeminiAudioMessage = {
                id: crypto.randomUUID(),
                type: 'assistant',
                content: 'Ops, não consegui processar seu áudio. Tente novamente! 🥺',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
            }
          } else {
            setIsProcessing(false);
            toast.error('Não conectado ao Gemini');
          }
          
          resolve();
        } catch (error: any) {
          console.error('❌ [GEMINI] Erro ao processar áudio:', error);
          toast.error(`Erro ao processar áudio: ${error.message}`);
          setIsProcessing(false);
          resolve();
        }
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  }, [isRecording, recordingTime, isConnected]);

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
      console.log('⚠️ [GEMINI] Nenhum áudio disponível para esta mensagem');
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
      console.log('🔊 [GEMINI] Reproduzindo áudio da mensagem:', messageId);
      
      const audioData = message.audioData;
      const audioUrl = message.type === 'user' 
        ? `data:audio/webm;base64,${audioData}`
        : `data:audio/wav;base64,${audioData}`;
      
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
        console.error('❌ [GEMINI] Erro ao reproduzir áudio');
        currentlyPlayingRef.current = null;
        setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
        toast.error('Erro ao reproduzir áudio');
      };

      audio.play();
    } catch (error: any) {
      console.error('❌ [GEMINI] Erro na reprodução:', error);
      currentlyPlayingRef.current = null;
      setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
      toast.error('Erro ao reproduzir áudio');
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    console.log('🗑️ [GEMINI] Limpando mensagens');
    setMessages([]);
    currentlyPlayingRef.current = null;
  }, []);

  return {
    messages,
    isRecording,
    isConnected,
    isProcessing,
    recordingTime,
    audioLevel,
    startRecording,
    stopRecording,
    playMessageAudio,
    clearMessages,
    connect,
    disconnect
  };
};

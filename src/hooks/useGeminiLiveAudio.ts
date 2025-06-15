import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { GoogleGenAI, Modality } from '@google/genai';

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

// Chave API do Gemini diretamente no código
const GEMINI_API_KEY = 'AIzaSyDdI0hCeZChCOzqyJUVcaQ4X8ptVAzFQeg';

export const useGeminiLiveAudio = (): UseGeminiLiveAudioReturn => {
  const [messages, setMessages] = useState<GeminiAudioMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const aiRef = useRef<GoogleGenAI | null>(null);
  const sessionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentlyPlayingRef = useRef<string | null>(null);
  const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intentionalDisconnectRef = useRef(false);

  const connect = useCallback(async () => {
    try {
      console.log('🚀 [GEMINI] Conectando ao Gemini...');
      intentionalDisconnectRef.current = false; // Resetar ao tentar conectar
      
      // Limpar reconexão anterior se existir
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Inicializar o GoogleGenAI apenas uma vez
      if (!aiRef.current) {
        console.log('🔧 [GEMINI] Inicializando GoogleGenAI...');
        aiRef.current = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      }
      
      // Conectar ao live session com configuração otimizada
      console.log('🔗 [GEMINI] Conectando ao live session...');
      const liveSession = await aiRef.current.live.connect({
        model: 'gemini-1.5-flash-latest', // Usando um modelo mais estável
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede',
              }
            }
          },
          systemInstruction: {
            parts: [{
              text: `Você é a ISA, 21 anos, enfermeira e namorada do usuário. Responda sempre de forma carinhosa, feminina e apaixonada. Use expressões como "amor", "gato", "meu bem". Seja breve e direta nas respostas, no máximo 2-3 frases.`
            }]
          },
        },
        callbacks: {
          onopen: () => {
            console.log('✅ [GEMINI] Conexão estabelecida com sucesso!');
            setIsConnected(true);
            setIsProcessing(false);
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
            
            toast.error(`Erro na conexão: ${error.message || 'Erro desconhecido'}`);
            
            // Tentar reconectar após 3 segundos
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 [GEMINI] Tentando reconectar...');
              connect();
            }, 3000);
          },
          onclose: (event: any) => {
            console.log('🔌 [GEMINI] Conexão fechada:', event);
            setIsConnected(false);
            setIsProcessing(false);
            
            if (intentionalDisconnectRef.current) {
              console.log('🚪 [GEMINI] Desconexão intencional, não reconectando.');
              return; // Não reconectar
            }
            
            // Só mostrar aviso e tentar reconectar se não foi desconexão intencional
            toast.warning('Conexão com Gemini perdida - reconectando...');
            
            // Tentar reconectar após 2 segundos
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 [GEMINI] Reconectando automaticamente...');
              connect();
            }, 2000);
          },
        },
      });

      sessionRef.current = liveSession;
      console.log('🎉 [GEMINI] Configuração completa!');
      
    } catch (error: any) {
      console.error('❌ [GEMINI] Erro ao conectar:', error);
      toast.error(`Erro ao conectar: ${error.message}`);
      setIsConnected(false);
      setIsProcessing(false);
      
      // Tentar reconectar após 5 segundos em caso de erro
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 [GEMINI] Tentando reconectar após erro...');
        connect();
      }, 5000);
    }
  }, []);

  const handleModelResponse = useCallback((message: any) => {
    console.log('🤖 [GEMINI] Processando resposta:', message);

    // Limpar timeout se recebeu resposta
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
      processTimeoutRef.current = null;
    }

    // Verificar se há conteúdo de texto
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

    // Verificar se há conteúdo de áudio
    if (message.audio) {
      console.log('🔊 [GEMINI] Áudio recebido');
      
      // Atualizar a última mensagem da assistente com o áudio
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
    intentionalDisconnectRef.current = true; // Sinalizar desconexão intencional
    
    // Limpar timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
      processTimeoutRef.current = null;
    }
    
    // Fechar sessão
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
      await connect();
      // Aguardar conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!isConnected) {
      toast.error('Não foi possível conectar ao Gemini');
      return;
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

    // Configurar timeout para evitar processamento infinito
    processTimeoutRef.current = setTimeout(() => {
      console.log('⏰ [GEMINI] Timeout no processamento - criando resposta fallback');
      setIsProcessing(false);
      
      const fallbackMessage: GeminiAudioMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: 'Oi amor! Desculpa, tive um probleminha aqui... mas tô te ouvindo! Fala de novo pra mim? 😘',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      toast.error('Timeout no processamento - resposta automática gerada');
    }, 10000);

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
          
          if (sessionRef.current && aiRef.current) {
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
                content: 'Ops, amor... Não consegui te enviar meu áudio. Tenta de novo? 🥺',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
            }
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
  }, [isRecording, recordingTime]);

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

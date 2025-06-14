
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  GoogleGenAI,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
  TurnCoverage,
} from '@google/genai';

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

export const useGeminiLiveAudio = (): UseGeminiLiveAudioReturn => {
  const [messages, setMessages] = useState<GeminiAudioMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const sessionRef = useRef<Session | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const responseQueueRef = useRef<LiveServerMessage[]>([]);
  const audioPartsRef = useRef<string[]>([]);
  const currentlyPlayingRef = useRef<string | null>(null);
  const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Você precisa substituir esta chave por uma válida
  const GEMINI_API_KEY = "SUA_CHAVE_GEMINI_AQUI";

  const convertToWav = useCallback((rawData: string[], mimeType: string) => {
    const options = {
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 16
    };
    
    const dataLength = rawData.reduce((a, b) => a + b.length, 0);
    const wavHeader = createWavHeader(dataLength, options);
    const buffer = new Uint8Array(rawData.reduce((acc, data) => {
      const decoded = atob(data);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      return new Uint8Array([...acc, ...bytes]);
    }, new Uint8Array()));

    return new Uint8Array([...wavHeader, ...buffer]);
  }, []);

  const createWavHeader = (dataLength: number, options: any) => {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    return new Uint8Array(buffer);
  };

  const handleModelTurn = useCallback((message: LiveServerMessage) => {
    console.log('🤖 [GEMINI LIVE] Processando resposta do modelo:', message);

    // Limpar timeout se recebeu resposta
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
      processTimeoutRef.current = null;
    }

    if (message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent.modelTurn.parts[0];

      if (part?.text) {
        console.log('💬 [GEMINI LIVE] Texto recebido:', part.text);
        
        const assistantMessage: GeminiAudioMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: part.text,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

      if (part?.inlineData) {
        console.log('🔊 [GEMINI LIVE] Áudio recebido');
        audioPartsRef.current.push(part.inlineData.data || '');
        
        // Combinar todas as partes de áudio e criar um arquivo WAV
        const wavBuffer = convertToWav(audioPartsRef.current, part.inlineData.mimeType || 'audio/pcm;rate=24000');
        const base64Audio = btoa(String.fromCharCode(...wavBuffer));
        
        // Atualizar a última mensagem da assistente com o áudio
        setMessages(prev => {
          const newMessages = [...prev];
          const assistantMessages = newMessages.filter(m => m.type === 'assistant');
          if (assistantMessages.length > 0) {
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
            const lastAssistantIndex = newMessages.indexOf(lastAssistantMessage);
            if (lastAssistantIndex !== -1) {
              newMessages[lastAssistantIndex] = {
                ...newMessages[lastAssistantIndex],
                audioData: base64Audio
              };
            }
          }
          return newMessages;
        });
      }
    }

    if (message.serverContent?.turnComplete) {
      console.log('✅ [GEMINI LIVE] Turno completo');
      setIsProcessing(false);
      audioPartsRef.current = []; // Reset para próxima resposta
    }
  }, [convertToWav]);

  const waitMessage = useCallback(async (): Promise<LiveServerMessage> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 300; // 30 segundos máximo
      
      const checkQueue = () => {
        attempts++;
        const message = responseQueueRef.current.shift();
        if (message) {
          handleModelTurn(message);
          resolve(message);
        } else if (attempts >= maxAttempts) {
          console.error('❌ [GEMINI LIVE] Timeout aguardando resposta');
          setIsProcessing(false);
          reject(new Error('Timeout aguardando resposta do Gemini'));
        } else {
          setTimeout(checkQueue, 100);
        }
      };
      checkQueue();
    });
  }, [handleModelTurn]);

  const connect = useCallback(async () => {
    try {
      console.log('🚀 [GEMINI LIVE] Conectando ao Gemini Live...');
      
      if (!GEMINI_API_KEY || GEMINI_API_KEY === "SUA_CHAVE_GEMINI_AQUI") {
        throw new Error('Chave de API do Gemini não configurada');
      }
      
      const ai = new GoogleGenAI({
        apiKey: GEMINI_API_KEY,
      });

      const model = 'models/gemini-2.5-flash-preview-native-audio-dialog';

      const config = {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore',
            }
          }
        },
        realtimeInputConfig: {
          turnCoverage: TurnCoverage.TURN_INCLUDES_ALL_INPUT,
        },
        contextWindowCompression: {
          triggerTokens: '25600',
          slidingWindow: { targetTokens: '12800' },
        },
        systemInstruction: {
          parts: [{
            text: `# CONTEXTO IRREVOGÁVEL
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

Responda como a ISA namorada apaixonada de 21 anos.`
          }]
        },
      };

      const session = await ai.live.connect({
        model,
        callbacks: {
          onopen: () => {
            console.log('✅ [GEMINI LIVE] Conexão estabelecida');
            setIsConnected(true);
            toast.success('Conectado ao Gemini Live!');
          },
          onmessage: (message: LiveServerMessage) => {
            responseQueueRef.current.push(message);
          },
          onerror: (e: ErrorEvent) => {
            console.error('❌ [GEMINI LIVE] Erro:', e.message);
            toast.error(`Erro na conexão: ${e.message}`);
            setIsConnected(false);
            setIsProcessing(false);
          },
          onclose: (e: CloseEvent) => {
            console.log('🔌 [GEMINI LIVE] Conexão fechada:', e.reason);
            setIsConnected(false);
            setIsProcessing(false);
          },
        },
        config
      });

      sessionRef.current = session;
      
    } catch (error: any) {
      console.error('❌ [GEMINI LIVE] Erro ao conectar:', error);
      toast.error(`Erro ao conectar: ${error.message}`);
      setIsConnected(false);
      setIsProcessing(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      console.log('🔌 [GEMINI LIVE] Desconectando...');
      sessionRef.current.close();
      sessionRef.current = null;
      setIsConnected(false);
      setIsProcessing(false);
    }
    
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
      processTimeoutRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isConnected) {
      await connect();
      // Aguardar conexão
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      console.log('🎤 [GEMINI LIVE] Iniciando gravação...');
      
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
      
      mediaRecorder.start(1000); // Capturar chunks a cada segundo
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ [GEMINI LIVE] Erro ao iniciar gravação:', error);
      toast.error(`Erro ao iniciar gravação: ${error.message}`);
    }
  }, [isConnected, connect]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    console.log('🛑 [GEMINI LIVE] Parando gravação...');
    setIsRecording(false);
    setIsProcessing(true);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Configurar timeout para evitar processamento infinito
    processTimeoutRef.current = setTimeout(() => {
      console.log('⏰ [GEMINI LIVE] Timeout no processamento');
      setIsProcessing(false);
      toast.error('Timeout no processamento do áudio');
    }, 30000); // 30 segundos

    return new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) {
        setIsProcessing(false);
        resolve();
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Adicionar mensagem do usuário
          const userMessage: GeminiAudioMessage = {
            id: crypto.randomUUID(),
            type: 'user',
            content: '[Mensagem de áudio]',
            timestamp: new Date(),
            audioData: await blobToBase64(audioBlob),
            duration: recordingTime
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          // Enviar áudio para o Gemini Live
          if (sessionRef.current) {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            sessionRef.current.sendClientContent({
              turns: [{
                parts: [{
                  inlineData: {
                    mimeType: 'audio/webm',
                    data: base64Audio
                  }
                }]
              }]
            });
            
            console.log('📤 [GEMINI LIVE] Áudio enviado para processamento');
            
            try {
              // Aguardar resposta com timeout
              await waitMessage();
            } catch (error) {
              console.error('❌ [GEMINI LIVE] Erro ao aguardar resposta:', error);
              toast.error('Erro ao processar áudio. Tente novamente.');
            }
          }
          
          resolve();
        } catch (error: any) {
          console.error('❌ [GEMINI LIVE] Erro ao processar áudio:', error);
          toast.error(`Erro ao processar áudio: ${error.message}`);
          setIsProcessing(false);
          resolve();
        }
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  }, [isRecording, recordingTime, waitMessage]);

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
      console.log('⚠️ [GEMINI LIVE] Nenhum áudio disponível para esta mensagem');
      return;
    }

    // Parar áudio que esteja tocando
    if (currentlyPlayingRef.current) {
      setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
      
      if (currentlyPlayingRef.current === messageId) {
        currentlyPlayingRef.current = null;
        return;
      }
    }

    try {
      console.log('🔊 [GEMINI LIVE] Reproduzindo áudio da mensagem:', messageId);
      
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
        console.error('❌ [GEMINI LIVE] Erro ao reproduzir áudio');
        currentlyPlayingRef.current = null;
        setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
        toast.error('Erro ao reproduzir áudio');
      };

      audio.play();
    } catch (error: any) {
      console.error('❌ [GEMINI LIVE] Erro na reprodução:', error);
      currentlyPlayingRef.current = null;
      setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
      toast.error('Erro ao reproduzir áudio');
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    console.log('🗑️ [GEMINI LIVE] Limpando mensagens');
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

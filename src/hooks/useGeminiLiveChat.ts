
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality, Session } from '@google/genai';

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
  
  const sessionRef = useRef<Session | null>(null);
  const responseQueueRef = useRef<LiveServerMessage[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentlyPlayingRef = useRef<string | null>(null);
  const audioPartsRef = useRef<string[]>([]);

  const connect = useCallback(async () => {
    try {
      console.log('🚀 [GEMINI CHAT] Conectando ao Gemini...');
      
      // Inicializar o GoogleGenAI com a chave API
      const ai = new GoogleGenAI(GEMINI_API_KEY);
      
      // Configurar sessão com ISA
      const config = {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Leda',
            }
          }
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

Responda sempre como a ISA namorada apaixonada de 21 anos, com no máximo 2-3 frases curtas e diretas.`
          }]
        },
      };

      // Conectar ao live session
      const session = await ai.live.connect({
        model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
        callbacks: {
          onopen: () => {
            console.log('✅ [GEMINI CHAT] Conexão estabelecida com sucesso!');
            setIsConnected(true);
            toast.success('Conectado ao Gemini ISA! 🎤');
          },
          onmessage: (message: LiveServerMessage) => {
            console.log('📨 [GEMINI CHAT] Mensagem recebida:', message);
            responseQueueRef.current.push(message);
            handleModelMessage(message);
          },
          onerror: (error: any) => {
            console.error('❌ [GEMINI CHAT] Erro na conexão:', error);
            toast.error(`Erro na conexão: ${error.message}`);
            setIsConnected(false);
            setIsProcessing(false);
          },
          onclose: (event: any) => {
            console.log('🔌 [GEMINI CHAT] Conexão fechada:', event);
            setIsConnected(false);
            setIsProcessing(false);
            toast.warning('Conexão com Gemini fechada');
          },
        },
        config
      });

      sessionRef.current = session;
      console.log('🎉 [GEMINI CHAT] Configuração completa!');
      
    } catch (error: any) {
      console.error('❌ [GEMINI CHAT] Erro ao conectar:', error);
      toast.error(`Erro ao conectar: ${error.message}`);
      setIsConnected(false);
      setIsProcessing(false);
    }
  }, []);

  const handleModelMessage = useCallback((message: LiveServerMessage) => {
    if (message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent.modelTurn.parts[0];

      // Processar texto
      if (part?.text) {
        console.log('💬 [GEMINI CHAT] Texto recebido:', part.text);
        
        const assistantMessage: GeminiChatMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: part.text,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

      // Processar áudio
      if (part?.inlineData) {
        console.log('🔊 [GEMINI CHAT] Áudio recebido');
        audioPartsRef.current.push(part.inlineData.data || '');
        
        // Atualizar a última mensagem da assistente com o áudio
        setMessages(prev => {
          const newMessages = [...prev];
          const assistantMessages = newMessages.filter(m => m.type === 'assistant');
          if (assistantMessages.length > 0) {
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
            const lastAssistantIndex = newMessages.lastIndexOf(lastAssistantMessage);
            if (lastAssistantIndex !== -1) {
              // Converter partes de áudio para base64 unificado
              const combinedAudio = audioPartsRef.current.join('');
              newMessages[lastAssistantIndex] = {
                ...newMessages[lastAssistantIndex],
                audioData: combinedAudio
              };
            }
          }
          return newMessages;
        });
      }
    }

    if (message.serverContent?.turnComplete) {
      setIsProcessing(false);
      audioPartsRef.current = []; // Reset para próxima mensagem
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!sessionRef.current || !isConnected) {
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

      // Enviar para o Gemini
      await sessionRef.current.sendClientContent({
        turns: [text]
      });

      console.log('📤 [GEMINI CHAT] Mensagem enviada para o Gemini');

    } catch (error: any) {
      console.error('❌ [GEMINI CHAT] Erro ao enviar mensagem:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
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
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    return new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) {
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
          
          // Enviar áudio para o Gemini via sendMessage
          if (sessionRef.current && isConnected) {
            try {
              // Para áudio, enviar uma indicação de que é uma mensagem de áudio
              await sendMessage('*mensagem de áudio enviada*');
            } catch (error) {
              console.error('❌ [GEMINI CHAT] Erro ao processar áudio:', error);
            }
          }
          
          resolve();
        } catch (error: any) {
          console.error('❌ [GEMINI CHAT] Erro ao processar áudio:', error);
          toast.error(`Erro ao processar áudio: ${error.message}`);
          resolve();
        }
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  }, [isRecording, isConnected, sendMessage]);

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
      sessionRef.current.close();
      sessionRef.current = null;
      setIsConnected(false);
      setIsProcessing(false);
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

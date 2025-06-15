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

  const connect = useCallback(async () => {
    try {
      console.log('🚀 [GEMINI] Conectando ao Gemini...');
      
      // Buscar a chave API do Supabase Edge Function
      const response = await fetch('/functions/v1/get-gemini-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao obter chave de API');
      }

      const { apiKey } = await response.json();

      if (!apiKey) {
        throw new Error('Chave de API não configurada');
      }

      // Inicializar o GoogleGenAI com a chave API do Supabase
      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      aiRef.current = ai;
      
      // Conectar ao live session com configuração corrigida
      const liveSession = await ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Kore',
              }
            }
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
        },
        callbacks: {
          onopen: () => {
            console.log('✅ [GEMINI] Conexão estabelecida');
            setIsConnected(true);
            toast.success('Conectado ao Gemini!');
          },
          onmessage: (message: any) => {
            console.log('📨 [GEMINI] Mensagem recebida:', message);
            handleModelResponse(message);
          },
          onerror: (error: any) => {
            console.error('❌ [GEMINI] Erro:', error);
            toast.error(`Erro na conexão: ${error.message}`);
            setIsConnected(false);
            setIsProcessing(false);
          },
          onclose: (event: any) => {
            console.log('🔌 [GEMINI] Conexão fechada:', event);
            setIsConnected(false);
            setIsProcessing(false);
          },
        },
      });

      sessionRef.current = liveSession;
      
    } catch (error: any) {
      console.error('❌ [GEMINI] Erro ao conectar:', error);
      toast.error(`Erro ao conectar: ${error.message}`);
      setIsConnected(false);
      setIsProcessing(false);
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
    if (sessionRef.current) {
      console.log('🔌 [GEMINI] Desconectando...');
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
      await new Promise(resolve => setTimeout(resolve, 3000));
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
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const userMessage: GeminiAudioMessage = {
            id: crypto.randomUUID(),
            type: 'user',
            content: '[Mensagem de áudio]',
            timestamp: new Date(),
            audioData: await blobToBase64(audioBlob),
            duration: recordingTime
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          if (sessionRef.current && aiRef.current) {
            try {
              await aiRef.current.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: 'Oi amor, como você está?'
              });
              
              console.log('📤 [GEMINI] Mensagem enviada');
              
            } catch (error) {
              console.error('❌ [GEMINI] Erro ao enviar:', error);
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

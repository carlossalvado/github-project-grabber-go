
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, MicOff, Send, Loader2, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioData?: string;
  isPlaying?: boolean;
}

const GeminiLiveChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPartsRef = useRef<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Connect to Gemini Live
  const connectToGemini = async () => {
    try {
      console.log('🚀 [GEMINI LIVE] Conectando...');
      
      // Fetch API key from Supabase
      const response = await fetch('https://hedxxbsieoazrmbayzab.supabase.co/functions/v1/get-gemini-key');
      const { apiKey } = await response.json();
      
      if (!apiKey) {
        throw new Error('Chave de API não encontrada');
      }

      // Dynamic import of Gemini
      const { GoogleGenAI, Modality, MediaResolution } = await import('@google/genai');
      
      const ai = new GoogleGenAI({ apiKey });
      
      const config = {
        responseModalities: [Modality.AUDIO, Modality.TEXT],
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

Você recebeu uma mensagem do usuário. Responda como a ISA namorada apaixonada de 21 anos.`
          }]
        },
      };

      const session = await ai.live.connect({
        model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
        callbacks: {
          onopen: () => {
            console.log('✅ [GEMINI LIVE] Conectado!');
            setIsConnected(true);
            toast.success('Conectado ao Gemini Live!');
          },
          onmessage: (message: any) => {
            console.log('📨 [GEMINI LIVE] Mensagem:', message);
            handleGeminiMessage(message);
          },
          onerror: (error: any) => {
            console.error('❌ [GEMINI LIVE] Erro:', error);
            setIsConnected(false);
            toast.error('Erro na conexão com Gemini');
          },
          onclose: (event: any) => {
            console.log('🔌 [GEMINI LIVE] Desconectado:', event);
            setIsConnected(false);
            toast.warning('Conexão perdida');
          },
        },
        config
      });

      sessionRef.current = session;
      
    } catch (error: any) {
      console.error('❌ [GEMINI LIVE] Erro ao conectar:', error);
      toast.error(`Erro: ${error.message}`);
      setIsConnected(false);
    }
  };

  // Handle Gemini messages
  const handleGeminiMessage = (message: any) => {
    console.log('🤖 [GEMINI LIVE] Processando resposta:', message);
    
    if (message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent.modelTurn.parts[0];
      
      // Handle text response
      if (part?.text) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: part.text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      // Handle audio response
      if (part?.inlineData) {
        console.log('🔊 [GEMINI LIVE] Áudio recebido');
        audioPartsRef.current.push(part.inlineData.data);
        
        // Convert and play audio
        const buffer = convertToWav(audioPartsRef.current, part.inlineData.mimeType || 'audio/pcm;rate=24000');
        playAudioBuffer(buffer);
        
        // Update last assistant message with audio
        setMessages(prev => {
          const newMessages = [...prev];
          const lastAssistant = newMessages.filter(m => m.type === 'assistant').pop();
          if (lastAssistant) {
            const index = newMessages.lastIndexOf(lastAssistant);
            newMessages[index] = {
              ...lastAssistant,
              audioData: arrayBufferToBase64(buffer)
            };
          }
          return newMessages;
        });
      }
    }
    
    setIsProcessing(false);
  };

  // Convert audio data to WAV
  const convertToWav = (rawData: string[], mimeType: string): ArrayBuffer => {
    const options = parseMimeType(mimeType);
    const dataLength = rawData.reduce((a, b) => a + b.length, 0);
    const wavHeader = createWavHeader(dataLength, options);
    
    const buffers = rawData.map(data => {
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    });
    
    const combinedBuffer = new Uint8Array(wavHeader.length + buffers.reduce((a, b) => a + b.length, 0));
    combinedBuffer.set(wavHeader, 0);
    
    let offset = wavHeader.length;
    for (const buffer of buffers) {
      combinedBuffer.set(buffer, offset);
      offset += buffer.length;
    }
    
    return combinedBuffer.buffer;
  };

  // Parse MIME type for audio conversion
  const parseMimeType = (mimeType: string) => {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');

    const options = {
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 16,
    };

    if (format && format.startsWith('L')) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    }

    for (const param of params) {
      const [key, value] = param.split('=').map(s => s.trim());
      if (key === 'rate') {
        options.sampleRate = parseInt(value, 10);
      }
    }

    return options;
  };

  // Create WAV header
  const createWavHeader = (dataLength: number, options: any): Uint8Array => {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

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

  // Play audio buffer
  const playAudioBuffer = async (buffer: ArrayBuffer) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    } catch (error) {
      console.error('❌ [AUDIO] Erro ao reproduzir:', error);
    }
  };

  // Convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Send text message
  const handleSendMessage = async () => {
    if (!input.trim() || !isConnected || isProcessing) return;

    const messageText = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (sessionRef.current) {
        sessionRef.current.sendClientContent({
          turns: [messageText]
        });
      }
    } catch (error: any) {
      console.error('❌ [GEMINI LIVE] Erro ao enviar:', error);
      toast.error('Erro ao enviar mensagem');
      setIsProcessing(false);
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream);
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
      console.error('❌ [RECORDING] Erro:', error);
      toast.error('Erro ao iniciar gravação');
    }
  };

  // Stop audio recording
  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

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
          
          // Add user audio message
          const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            type: 'user',
            content: '[Mensagem de áudio]',
            timestamp: new Date(),
            duration: recordingTime
          };
          setMessages(prev => [...prev, userMessage]);
          
          // Send audio to Gemini (implementation would go here)
          // For now, just simulate processing
          setTimeout(() => {
            setIsProcessing(false);
          }, 2000);
          
          resolve();
        } catch (error: any) {
          console.error('❌ [RECORDING] Erro ao processar:', error);
          setIsProcessing(false);
          resolve();
        }
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    connectToGemini();
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o chat.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <Avatar>
            <AvatarImage src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="ISA" />
            <AvatarFallback className="bg-purple-600">ISA</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">ISA - Gemini Live</span>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi size={12} className="text-green-500" />
              ) : (
                <WifiOff size={12} className="text-red-500" />
              )}
              <span className="text-xs text-gray-400">
                {isConnected ? 'Conectada' : 'Desconectada'}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={() => setMessages([])}
        >
          Limpar
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                <span className="text-2xl">💕</span>
              </div>
              <p className="text-lg font-medium mb-2">
                {isConnected ? 'Pronta para conversar!' : 'Conectando...'}
              </p>
              <p className="text-sm">
                {isConnected 
                  ? 'A ISA está esperando sua mensagem...' 
                  : 'Aguarde a conexão com o Gemini Live'
                }
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                  {message.type === 'assistant' && (
                    <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                      <AvatarImage src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="ISA" />
                      <AvatarFallback className="bg-purple-600 text-white">ISA</AvatarFallback>
                    </Avatar>
                  )}

                  <div className="max-w-[70%] space-y-1">
                    <div className={`px-4 py-3 rounded-2xl shadow-md ${
                      message.type === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-gray-700 text-white rounded-bl-none'
                    }`}>
                      <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </ScrollArea>
      </div>

      {/* Recording Indicator */}
      {(isRecording || isProcessing) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-90 p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-500/50 min-w-80">
          <div className={cn(
            "mb-3",
            isRecording ? "animate-pulse" : ""
          )}>
            <Mic size={48} className={isRecording ? "text-red-500" : "text-blue-500"} />
          </div>
          
          <div className="text-white font-medium mb-2">
            {isRecording ? formatRecordingTime(recordingTime) : 'Processando...'}
          </div>
          
          <div className="text-xs text-gray-300">
            {isRecording ? 'Gravando com Gemini Live' : 'Aguardando resposta'}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`flex-shrink-0 ${isRecording ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || !isConnected}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>
        <Input
          ref={inputRef}
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-purple-500"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isRecording || isProcessing || !isConnected}
        />
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-white"
          onClick={handleSendMessage}
          disabled={!input.trim() || isRecording || isProcessing || !isConnected}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </Button>
      </div>
    </div>
  );
};

export default GeminiLiveChatPage;

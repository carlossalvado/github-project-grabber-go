
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface AudioMessage {
  id: string;
  type: 'user' | 'assistant';
  audioBlob?: Blob;
  audioUrl?: string;
  transcription?: string;
  response?: string;
  timestamp: string;
  isPlaying?: boolean;
}

export const useGeminiAudio = () => {
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Chave da API Gemini diretamente no código
  const GEMINI_API_KEY = "AIzaSyARv6YIjGIalbNjeNTeXUNx5moUpWD8wb8";

  const startRecording = async () => {
    try {
      console.log('🎤 [GEMINI AUDIO] Iniciando gravação...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('🎤 [GEMINI AUDIO] Stream de áudio obtido:', stream.getAudioTracks()[0].getSettings());
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('🎤 [GEMINI AUDIO] Chunk de áudio recebido:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('🎤 [GEMINI AUDIO] Gravação finalizada');
        stream.getTracks().forEach(track => track.stop());
        processRecording();
      };
      
      mediaRecorder.start(100); // Captura a cada 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('🎤 [GEMINI AUDIO] Gravação iniciada com sucesso');
      
    } catch (error) {
      console.error('❌ [GEMINI AUDIO] Erro ao iniciar gravação:', error);
      toast.error('Erro ao iniciar gravação');
    }
  };

  const stopRecording = () => {
    console.log('🛑 [GEMINI AUDIO] Parando gravação...');
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log('⚠️ [GEMINI AUDIO] Nenhum chunk de áudio para processar');
      return;
    }
    
    setIsProcessing(true);
    console.log('🔄 [GEMINI AUDIO] Processando gravação...');
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('📄 [GEMINI AUDIO] Blob criado:', audioBlob.size, 'bytes');
      
      // Criar URL para o áudio do usuário
      const userAudioUrl = URL.createObjectURL(audioBlob);
      
      // Adicionar mensagem de áudio do usuário
      const userMessage: AudioMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        audioBlob,
        audioUrl: userAudioUrl,
        timestamp: new Date().toISOString()
      };
      
      setAudioMessages(prev => [...prev, userMessage]);
      console.log('👤 [GEMINI AUDIO] Mensagem de áudio do usuário adicionada');
      
      // Converter áudio para base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      console.log('🔄 [GEMINI AUDIO] Áudio convertido para base64, tamanho:', base64Audio.length);
      
      // Enviar para Gemini API
      const geminiResponse = await sendToGemini(base64Audio);
      console.log('🤖 [GEMINI AUDIO] Resposta do Gemini recebida');
      
      if (geminiResponse.audioContent) {
        // Converter resposta de áudio do Gemini para Blob
        const responseAudioBytes = Uint8Array.from(atob(geminiResponse.audioContent), c => c.charCodeAt(0));
        const responseAudioBlob = new Blob([responseAudioBytes], { type: 'audio/mpeg' });
        const responseAudioUrl = URL.createObjectURL(responseAudioBlob);
        
        // Adicionar mensagem de áudio da assistente
        const assistantMessage: AudioMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          audioBlob: responseAudioBlob,
          audioUrl: responseAudioUrl,
          transcription: geminiResponse.transcription,
          response: geminiResponse.response,
          timestamp: new Date().toISOString()
        };
        
        setAudioMessages(prev => [...prev, assistantMessage]);
        console.log('🤖 [GEMINI AUDIO] Mensagem de áudio da assistente adicionada');
      }
      
    } catch (error: any) {
      console.error('❌ [GEMINI AUDIO] Erro ao processar áudio:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    } finally {
      setIsProcessing(false);
      console.log('✅ [GEMINI AUDIO] Processamento finalizado');
    }
  };

  const sendToGemini = async (base64Audio: string) => {
    console.log('🚀 [GEMINI API] Enviando áudio para Gemini...');
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
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

Você recebeu um áudio do usuário. Responda como a ISA namorada apaixonada de 21 anos.`
              },
              {
                inlineData: {
                  mimeType: "audio/webm",
                  data: base64Audio
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      });

      console.log('📡 [GEMINI API] Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [GEMINI API] Erro na resposta:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('📋 [GEMINI API] Resposta completa:', result);
      
      if (!result.candidates || !result.candidates[0]) {
        throw new Error('Nenhuma resposta válida do Gemini');
      }
      
      const responseText = result.candidates[0].content.parts[0].text;
      console.log('💬 [GEMINI API] Texto da resposta:', responseText);
      
      return {
        transcription: "Áudio processado pelo Gemini",
        response: responseText,
        audioContent: null // Por enquanto apenas texto
      };
      
    } catch (error) {
      console.error('❌ [GEMINI API] Erro na comunicação:', error);
      throw error;
    }
  };

  const playAudio = async (message: AudioMessage) => {
    if (!message.audioUrl) {
      console.log('⚠️ [GEMINI AUDIO] Nenhuma URL de áudio para reproduzir');
      return;
    }
    
    try {
      console.log('🔊 [GEMINI AUDIO] Iniciando reprodução de áudio');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const audio = new Audio(message.audioUrl);
      
      // Atualizar estado de reprodução
      setAudioMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, isPlaying: true }
          : { ...msg, isPlaying: false }
      ));
      
      audio.onended = () => {
        console.log('✅ [GEMINI AUDIO] Reprodução finalizada');
        setAudioMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, isPlaying: false }
            : msg
        ));
      };
      
      audio.onerror = (error) => {
        console.error('❌ [GEMINI AUDIO] Erro na reprodução:', error);
        setAudioMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, isPlaying: false }
            : msg
        ));
      };
      
      await audio.play();
      console.log('🔊 [GEMINI AUDIO] Áudio sendo reproduzido');
      
    } catch (error) {
      console.error('❌ [GEMINI AUDIO] Erro ao reproduzir áudio:', error);
      setAudioMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, isPlaying: false }
          : msg
      ));
    }
  };

  const clearAudioMessages = () => {
    console.log('🗑️ [GEMINI AUDIO] Limpando mensagens de áudio');
    
    // Liberar URLs de objeto para evitar vazamentos de memória
    audioMessages.forEach(message => {
      if (message.audioUrl) {
        URL.revokeObjectURL(message.audioUrl);
      }
    });
    
    setAudioMessages([]);
    console.log('✅ [GEMINI AUDIO] Mensagens de áudio limpas');
  };

  return {
    audioMessages,
    isRecording,
    isProcessing,
    recordingTime,
    startRecording,
    stopRecording,
    playAudio,
    clearAudioMessages
  };
};

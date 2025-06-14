import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebAudioRecorder } from './useWebAudioRecorder';
import { useLocalSpeechTranscription } from './useLocalSpeechTranscription';
import { usePollyAudio } from './usePollyAudio';
import { useAudioPlayer } from './useAudioPlayer';
import { toast } from 'sonner';

export interface WhatsAppMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
  duration?: number;
  audioData?: string;
}

export const useWhatsAppAudio = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    audioLevel
  } = useWebAudioRecorder();
  
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript
  } = useLocalSpeechTranscription();
  
  const { generateSpeech } = usePollyAudio();
  const { playAudio, stopAudio } = useAudioPlayer();

  // Iniciar gravação e transcrição simultaneamente
  const startAudioMessage = useCallback(async () => {
    try {
      console.log('🎤 [WHATSAPP] Iniciando gravação e transcrição...');
      resetTranscript();
      
      // Iniciar gravação e transcrição em paralelo
      await Promise.all([
        startRecording(),
        new Promise(resolve => {
          // Aguardar 300ms para o microfone estar pronto
          setTimeout(() => {
            startListening();
            resolve(void 0);
          }, 300);
        })
      ]);
      
    } catch (error) {
      console.error('❌ [WHATSAPP] Erro ao iniciar:', error);
      toast.error('Erro ao iniciar gravação');
    }
  }, [startRecording, startListening, resetTranscript]);

  // Finalizar gravação e processar mensagem
  const finishAudioMessage = useCallback(async () => {
    if (!isRecording) {
      toast.error('Nenhuma gravação em andamento');
      return;
    }

    try {
      setIsProcessingResponse(true);
      console.log('🎤 [WHATSAPP] Finalizando gravação...');
      
      // Parar transcrição e aguardar o texto final
      const finalTranscript = await stopListening();
      console.log('📝 [WHATSAPP] Transcrição final recebida:', finalTranscript);

      // Parar gravação
      const audioBuffer = await stopRecording();

      if (!finalTranscript || finalTranscript.trim().length === 0) {
        toast.error('Nenhuma transcrição capturada. Tente falar mais claramente.');
        return;
      }

      if (!audioBuffer) {
        throw new Error('Erro ao obter dados de áudio');
      }

      // Criar blob de áudio para o usuário
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      const userAudioUrl = URL.createObjectURL(audioBlob);

      // Adicionar mensagem do usuário
      const userMessage: WhatsAppMessage = {
        id: crypto.randomUUID(),
        type: 'user',
        content: finalTranscript.trim(),
        timestamp: new Date(),
        audioUrl: userAudioUrl,
        duration: recordingTime
      };

      setMessages(prev => [...prev, userMessage]);
      console.log('✅ [WHATSAPP] Mensagem do usuário adicionada');

      // Gerar resposta com Polly
      console.log('🤖 [WHATSAPP] Gerando resposta da IA...');
      const responseText = `Recebi sua mensagem: "${finalTranscript.trim()}". Esta é uma resposta de exemplo gerada pelo Amazon Polly com voz Vitória em português brasileiro.`;
      
      const responseAudioData = await generateSpeech(responseText);
      
      const assistantMessage: WhatsAppMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: responseText,
        timestamp: new Date(),
        audioData: responseAudioData || undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
      console.log('✅ [WHATSAPP] Resposta da IA adicionada');
      
      resetTranscript();
      
    } catch (error: any) {
      console.error('❌ [WHATSAPP] Erro ao processar:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsProcessingResponse(false);
    }
  }, [isRecording, recordingTime, stopRecording, stopListening, generateSpeech, resetTranscript]);

  // Reproduzir áudio específico
  const playMessageAudio = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // Para mensagens do usuário, usar audioUrl
    if (message.type === 'user' && message.audioUrl) {
      setMessages(prev => prev.map(m => ({
        ...m,
        isPlaying: m.id === messageId ? !m.isPlaying : false
      })));

      if (message.isPlaying) {
        stopAudio();
      } else {
        const audio = new Audio(message.audioUrl);
        audio.play();
      }
      return;
    }

    // Para mensagens da IA, usar audioData (base64)
    if (message.type === 'assistant' && message.audioData) {
      setMessages(prev => prev.map(m => ({
        ...m,
        isPlaying: m.id === messageId ? !m.isPlaying : false
      })));

      if (message.isPlaying) {
        stopAudio();
      } else {
        await playAudio(message.audioData);
      }
    }
  }, [messages, playAudio, stopAudio]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isRecording,
    isListening,
    isProcessingResponse,
    recordingTime,
    audioLevel,
    transcript,
    startAudioMessage,
    finishAudioMessage,
    playMessageAudio,
    clearMessages,
    setMessages
  };
};

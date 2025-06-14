
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
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  
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
      
      // Tentar gerar áudio com Polly (com fallback)
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
      
      if (!responseAudioData) {
        toast.info('Resposta gerada sem áudio (erro no Polly)');
      }
      
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

    console.log('🔊 [WHATSAPP] Tentando reproduzir áudio da mensagem:', messageId);

    // Parar qualquer áudio que esteja tocando
    if (currentlyPlayingId) {
      stopAudio();
      setCurrentlyPlayingId(null);
      setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
      
      // Se clicou no mesmo áudio que estava tocando, apenas parar
      if (currentlyPlayingId === messageId) {
        return;
      }
    }

    // Para mensagens do usuário, usar audioUrl
    if (message.type === 'user' && message.audioUrl) {
      console.log('🎵 [WHATSAPP] Reproduzindo áudio do usuário');
      setCurrentlyPlayingId(messageId);
      setMessages(prev => prev.map(m => ({ 
        ...m, 
        isPlaying: m.id === messageId 
      })));

      try {
        const audio = new Audio(message.audioUrl);
        audio.onended = () => {
          setCurrentlyPlayingId(null);
          setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
        };
        audio.onerror = () => {
          console.error('❌ [WHATSAPP] Erro ao reproduzir áudio do usuário');
          setCurrentlyPlayingId(null);
          setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
          toast.error('Erro ao reproduzir áudio');
        };
        await audio.play();
      } catch (error) {
        console.error('❌ [WHATSAPP] Erro ao reproduzir áudio do usuário:', error);
        setCurrentlyPlayingId(null);
        setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
        toast.error('Erro ao reproduzir áudio');
      }
      return;
    }

    // Para mensagens da IA, usar audioData (base64)
    if (message.type === 'assistant' && message.audioData) {
      console.log('🎵 [WHATSAPP] Reproduzindo áudio da IA');
      setCurrentlyPlayingId(messageId);
      setMessages(prev => prev.map(m => ({ 
        ...m, 
        isPlaying: m.id === messageId 
      })));

      try {
        await playAudio(message.audioData);
        // O áudio player já gerencia o estado final
        setCurrentlyPlayingId(null);
        setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
      } catch (error) {
        console.error('❌ [WHATSAPP] Erro ao reproduzir áudio da IA:', error);
        setCurrentlyPlayingId(null);
        setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
        toast.error('Erro ao reproduzir áudio');
      }
      return;
    }

    // Se chegou aqui, não tem áudio disponível
    console.log('⚠️ [WHATSAPP] Nenhum áudio disponível para esta mensagem');
    toast.info('Áudio não disponível para esta mensagem');
  }, [messages, playAudio, stopAudio, currentlyPlayingId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentlyPlayingId(null);
    stopAudio();
  }, [stopAudio]);

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

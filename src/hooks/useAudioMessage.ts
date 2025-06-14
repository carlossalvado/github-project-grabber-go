
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useWebAudioRecorder } from './useWebAudioRecorder';
import { useAudioPlayer } from './useAudioPlayer';

export interface AudioMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
  duration?: number;
}

export const useAudioMessage = () => {
  const { user } = useAuth();
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    audioLevel
  } = useWebAudioRecorder();
  
  const { isPlaying, playAudio, stopAudio } = useAudioPlayer();

  // Salvar áudio no Supabase Storage
  const saveAudioToStorage = async (audioBlob: Blob): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    const fileName = `${user.id}/${Date.now()}_audio.webm`;
    
    const { data, error } = await supabase.storage
      .from('chat_audio')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm'
      });

    if (error) {
      console.error('Erro ao salvar áudio:', error);
      throw error;
    }

    // Obter URL pública do áudio
    const { data: urlData } = supabase.storage
      .from('chat_audio')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  // Transcrever áudio usando edge function
  const transcribeAudio = async (audioData: string): Promise<string> => {
    try {
      console.log('🎯 [AUDIO] Iniciando transcrição...');
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioData }
      });

      if (error) {
        console.error('❌ [AUDIO] Erro na edge function:', error);
        throw new Error(`Erro na transcrição: ${error.message}`);
      }

      if (!data?.transcription) {
        throw new Error('Transcrição vazia retornada');
      }

      console.log('✅ [AUDIO] Transcrição recebida:', data.transcription);
      return data.transcription;
      
    } catch (error: any) {
      console.error('❌ [AUDIO] Erro na transcrição:', error);
      
      // Tratar diferentes tipos de erro
      if (error.message.includes('quota')) {
        throw new Error('Cota da API excedida. Tente novamente mais tarde.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Muitas requisições. Aguarde um momento.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Timeout na transcrição. Tente com áudio mais curto.');
      } else {
        throw new Error('Erro na transcrição. Verifique sua conexão.');
      }
    }
  };

  // Sintetizar voz usando Amazon Polly
  const synthesizeSpeech = async (text: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('polly-synthesize', {
        body: { text }
      });

      if (error) {
        console.error('Erro na síntese de voz:', error);
        throw error;
      }

      return data.audioData;
    } catch (error) {
      console.error('Erro na síntese de voz:', error);
      // Falhar silenciosamente na síntese, mas continuar com texto
      return '';
    }
  };

  // Processar mensagem de áudio completa
  const sendAudioMessage = useCallback(async () => {
    if (!isRecording) return;
    
    try {
      setIsProcessing(true);
      console.log('🎤 [AUDIO] Processando mensagem de áudio...');
      
      // Parar gravação e obter dados
      const audioBuffer = await stopRecording();
      if (!audioBuffer) {
        throw new Error('Erro ao obter dados de áudio');
      }

      // Converter para blob e salvar no storage
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      
      let audioUrl: string | undefined;
      try {
        audioUrl = await saveAudioToStorage(audioBlob);
      } catch (error) {
        console.warn('⚠️ [AUDIO] Não foi possível salvar áudio no storage:', error);
        // Continuar sem salvar no storage
      }
      
      // Converter para base64 para transcrição
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      
      // Transcrever áudio
      const transcription = await transcribeAudio(base64Audio);
      
      // Adicionar mensagem do usuário
      const userMessage: AudioMessage = {
        id: crypto.randomUUID(),
        type: 'user',
        content: transcription,
        timestamp: new Date(),
        audioUrl,
        duration: recordingTime
      };
      
      setAudioMessages(prev => [...prev, userMessage]);
      
      // Simular resposta da IA (integrar com sua IA aqui)
      const aiResponse = `Entendi que você disse: "${transcription}". Como posso ajudar?`;
      
      // Tentar sintetizar resposta (opcional)
      let responseAudioUrl: string | undefined;
      try {
        const responseAudioData = await synthesizeSpeech(aiResponse);
        if (responseAudioData) {
          const responseAudioBytes = atob(responseAudioData);
          const responseAudioArray = new Uint8Array(responseAudioBytes.length);
          for (let i = 0; i < responseAudioBytes.length; i++) {
            responseAudioArray[i] = responseAudioBytes.charCodeAt(i);
          }
          const responseBlob = new Blob([responseAudioArray], { type: 'audio/mp3' });
          responseAudioUrl = URL.createObjectURL(responseBlob);
        }
      } catch (error) {
        console.warn('⚠️ [AUDIO] Síntese de voz falhou, continuando apenas com texto:', error);
      }
      
      // Adicionar mensagem da assistente
      const assistantMessage: AudioMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        audioUrl: responseAudioUrl
      };
      
      setAudioMessages(prev => [...prev, assistantMessage]);
      
      console.log('✅ [AUDIO] Mensagem processada com sucesso');
      toast.success('Mensagem de áudio processada!');
      
    } catch (error: any) {
      console.error('❌ [AUDIO] Erro ao processar:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [isRecording, stopRecording, recordingTime]);

  // Reproduzir áudio específico
  const playMessageAudio = useCallback(async (messageId: string) => {
    const message = audioMessages.find(m => m.id === messageId);
    if (!message?.audioUrl) return;

    // Atualizar estado de reprodução
    setAudioMessages(prev => prev.map(m => ({
      ...m,
      isPlaying: m.id === messageId ? !m.isPlaying : false
    })));

    if (message.isPlaying) {
      stopAudio();
    } else {
      await playAudio(message.audioUrl);
    }
  }, [audioMessages, playAudio, stopAudio]);

  return {
    audioMessages,
    isRecording,
    isProcessing,
    recordingTime,
    audioLevel,
    startRecording,
    sendAudioMessage,
    playMessageAudio,
    setAudioMessages
  };
};

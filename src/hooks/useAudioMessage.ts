
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
        throw new Error('Nenhuma transcrição retornada');
      }

      console.log('✅ [AUDIO] Transcrição recebida:', data.transcription);
      return data.transcription;
      
    } catch (error: any) {
      console.error('❌ [AUDIO] Erro na transcrição:', error);
      
      // Tratar diferentes tipos de erro
      if (error.message.includes('quota') || error.message.includes('cota')) {
        throw new Error('Cota da OpenAI excedida. Tente novamente mais tarde.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Timeout na transcrição. Tente com áudio mais curto.');
      } else if (error.message.includes('API key')) {
        throw new Error('Problema com a chave da OpenAI.');
      } else {
        throw new Error('Erro na transcrição. Verifique sua conexão.');
      }
    }
  };

  // Salvar áudio no Supabase Storage
  const saveAudioToStorage = async (audioBlob: Blob): Promise<string | undefined> => {
    try {
      if (!user) return undefined;
      
      const fileName = `${user.id}/${Date.now()}_audio.webm`;
      
      const { data, error } = await supabase.storage
        .from('chat_audio')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm'
        });

      if (error) {
        console.error('⚠️ [AUDIO] Erro ao salvar áudio:', error);
        return undefined;
      }

      const { data: urlData } = supabase.storage
        .from('chat_audio')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.warn('⚠️ [AUDIO] Não foi possível salvar áudio:', error);
      return undefined;
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

      // Converter para blob
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      
      // Salvar no storage (opcional)
      const audioUrl = await saveAudioToStorage(audioBlob);
      
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
      
      // Simular resposta da IA
      const aiResponse = `Entendi que você disse: "${transcription}". Como posso ajudar?`;
      
      const assistantMessage: AudioMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
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

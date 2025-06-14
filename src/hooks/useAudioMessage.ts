
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
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: { audioData }
    });

    if (error) {
      console.error('Erro na transcrição:', error);
      throw error;
    }

    return data.transcription;
  };

  // Sintetizar voz usando Amazon Polly
  const synthesizeSpeech = async (text: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('polly-synthesize', {
      body: { text }
    });

    if (error) {
      console.error('Erro na síntese de voz:', error);
      throw error;
    }

    return data.audioData;
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
      
      // Simular resposta da IA (você pode integrar com sua IA aqui)
      const aiResponse = `Entendi que você disse: "${transcription}". Como posso ajudar?`;
      
      // Sintetizar resposta
      const responseAudioData = await synthesizeSpeech(aiResponse);
      
      // Converter base64 para blob e salvar
      const responseAudioBytes = atob(responseAudioData);
      const responseAudioArray = new Uint8Array(responseAudioBytes.length);
      for (let i = 0; i < responseAudioBytes.length; i++) {
        responseAudioArray[i] = responseAudioBytes.charCodeAt(i);
      }
      const responseBlob = new Blob([responseAudioArray], { type: 'audio/mp3' });
      const responseUrl = URL.createObjectURL(responseBlob);
      
      // Adicionar mensagem da assistente
      const assistantMessage: AudioMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        audioUrl: responseUrl
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

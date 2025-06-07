
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AudioMessage {
  id: string;
  type: 'user' | 'assistant';
  audioBlob?: Blob;
  audioUrl?: string;
  transcription?: string;
  timestamp: string;
  isPlaying?: boolean;
}

export const useGoogleCloudAudio = () => {
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          toast.warning("Nenhum áudio foi gravado.");
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudioWithGoogleCloud(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processAudioWithGoogleCloud = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Salvar áudio do usuário no cache
      const userAudioUrl = URL.createObjectURL(audioBlob);
      const userMessage: AudioMessage = {
        id: crypto.randomUUID(),
        type: 'user',
        audioBlob,
        audioUrl: userAudioUrl,
        timestamp: new Date().toISOString()
      };
      
      setAudioMessages(prev => [...prev, userMessage]);
      
      // Enviar para a Edge Function do Google Cloud
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('format', 'webm');

      const { data, error } = await supabase.functions.invoke('process-audio-gemini', {
        body: formData
      });

      if (error) {
        throw error;
      }

      if (data?.audioContent) {
        console.log('Google Cloud response received:', data);
        
        // Converter base64 para blob
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioResponse = new Blob([bytes], { type: 'audio/mpeg' });
        
        const assistantAudioUrl = URL.createObjectURL(audioResponse);
        const assistantMessage: AudioMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          audioBlob: audioResponse,
          audioUrl: assistantAudioUrl,
          transcription: data.response,
          timestamp: new Date().toISOString()
        };
        
        setAudioMessages(prev => [...prev, assistantMessage]);
        
        // Reproduzir automaticamente a resposta
        setTimeout(() => playAudio(assistantMessage), 500);
      } else {
        console.warn('Google Cloud response is null or empty.');
        toast.error('Não foi possível obter resposta de áudio.');
      }
      
    } catch (error: any) {
      console.error('Erro ao processar áudio:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (message: AudioMessage) => {
    if (!message.audioUrl) {
      console.warn('Attempted to play audio with no audioUrl:', message);
      return;
    }
    
    try {
      // Parar qualquer áudio em reprodução
      audioElementsRef.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      
      let audio = audioElementsRef.current.get(message.id);
      
      if (!audio) {
        audio = new Audio(message.audioUrl);
        audioElementsRef.current.set(message.id, audio);
        
        audio.onended = () => {
          console.log('Audio playback ended for message:', message.id);
          setAudioMessages(prev => 
            prev.map(msg => 
              msg.id === message.id ? { ...msg, isPlaying: false } : msg
            )
          );
        };
        
        audio.onerror = (e) => {
          console.error("Erro ao carregar ou tocar o áudio:", e);
          toast.error("Erro ao carregar o áudio.");
          setAudioMessages(prev => 
            prev.map(msg => 
              msg.id === message.id ? { ...msg, isPlaying: false } : msg
            )
          );
        };
      }
      
      setAudioMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, isPlaying: true } : { ...msg, isPlaying: false }
        )
      );
      
      await audio.play();
      console.log('Playing audio for message:', message.id);
      
    } catch (error) {
      console.error("Erro ao tocar áudio:", error);
      toast.error("Não foi possível tocar o áudio.");
    }
  };

  const clearAudioMessages = () => {
    // Limpar URLs dos objetos para liberar memória
    audioMessages.forEach(message => {
      if (message.audioUrl) {
        URL.revokeObjectURL(message.audioUrl);
      }
    });
    
    // Parar e limpar elementos de áudio
    audioElementsRef.current.forEach((audio) => {
      audio.pause();
      if (audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
    });
    audioElementsRef.current.clear();
    
    setAudioMessages([]);
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

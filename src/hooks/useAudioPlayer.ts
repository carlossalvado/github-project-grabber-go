
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playAudio: (base64Audio: string) => Promise<void>;
  stopAudio: () => void;
  setVolume: (volume: number) => void;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeUpdateRef = useRef<NodeJS.Timeout | null>(null);

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      console.log('🔊 [AUDIO PLAYER] Iniciando reprodução...');
      
      // Parar áudio atual se estiver tocando
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Criar URL do áudio diretamente do base64
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      
      // Criar elemento de áudio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Event listeners
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        console.log('📊 [AUDIO PLAYER] Duração:', audio.duration, 'segundos');
      };
      
      audio.onplay = () => {
        setIsPlaying(true);
        console.log('▶️ [AUDIO PLAYER] Reprodução iniciada');
        
        // Atualizar tempo atual
        timeUpdateRef.current = setInterval(() => {
          if (audio.currentTime) {
            setCurrentTime(audio.currentTime);
          }
        }, 100);
      };
      
      audio.onpause = () => {
        setIsPlaying(false);
        if (timeUpdateRef.current) {
          clearInterval(timeUpdateRef.current);
          timeUpdateRef.current = null;
        }
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (timeUpdateRef.current) {
          clearInterval(timeUpdateRef.current);
          timeUpdateRef.current = null;
        }
        console.log('⏹️ [AUDIO PLAYER] Reprodução finalizada');
      };
      
      audio.onerror = (error) => {
        console.error('❌ [AUDIO PLAYER] Erro na reprodução:', error);
        setIsPlaying(false);
        setCurrentTime(0);
        toast.error('Erro ao reproduzir áudio');
      };
      
      // Iniciar reprodução
      await audio.play();
      
    } catch (error) {
      console.error('❌ [AUDIO PLAYER] Erro ao reproduzir áudio:', error);
      setIsPlaying(false);
      toast.error('Erro ao reproduzir áudio');
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      console.log('⏹️ [AUDIO PLAYER] Parando reprodução');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
      console.log('🔊 [AUDIO PLAYER] Volume definido:', volume);
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    playAudio,
    stopAudio,
    setVolume
  };
};

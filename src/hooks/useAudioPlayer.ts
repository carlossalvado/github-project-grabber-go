
import { useState, useRef, useCallback } from 'react';

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

  const createWavHeader = (dataLength: number, sampleRate: number = 24000): ArrayBuffer => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // WAV header
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
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    return buffer;
  };

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      console.log('🔊 [AUDIO PLAYER] Iniciando reprodução...');
      
      // Parar áudio atual se estiver tocando
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Decodificar base64
      const binaryString = atob(base64Audio);
      const audioData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioData[i] = binaryString.charCodeAt(i);
      }
      
      // Criar header WAV
      const header = createWavHeader(audioData.length);
      const wavData = new Uint8Array(header.byteLength + audioData.length);
      wavData.set(new Uint8Array(header), 0);
      wavData.set(audioData, header.byteLength);
      
      // Criar blob e URL
      const audioBlob = new Blob([wavData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
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
        URL.revokeObjectURL(audioUrl);
        console.log('⏹️ [AUDIO PLAYER] Reprodução finalizada');
      };
      
      audio.onerror = (error) => {
        console.error('❌ [AUDIO PLAYER] Erro na reprodução:', error);
        setIsPlaying(false);
        setCurrentTime(0);
        URL.revokeObjectURL(audioUrl);
      };
      
      // Iniciar reprodução
      await audio.play();
      
    } catch (error) {
      console.error('❌ [AUDIO PLAYER] Erro ao reproduzir áudio:', error);
      setIsPlaying(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      console.log('⏹️ [AUDIO PLAYER] Parando reprodução');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
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

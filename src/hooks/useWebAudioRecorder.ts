
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseWebAudioRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<ArrayBuffer | null>;
  audioLevel: number;
}

export const useWebAudioRecorder = (): UseWebAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const levelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 [WEB AUDIO] Iniciando gravação...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('🎤 [WEB AUDIO] Stream obtido:', stream.getAudioTracks()[0].getSettings());
      
      // Configurar análise de áudio para nível
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Monitor do nível de áudio
      const updateLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255 * 100);
        }
      };
      
      levelTimerRef.current = setInterval(updateLevel, 100);

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('🎤 [WEB AUDIO] Chunk recebido:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.start(100); // Captura a cada 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer de gravação
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('✅ [WEB AUDIO] Gravação iniciada');
      toast.success('Gravação iniciada');
      
    } catch (error: any) {
      console.error('❌ [WEB AUDIO] Erro ao iniciar gravação:', error);
      toast.error(`Erro ao acessar microfone: ${error.message}`);
    }
  }, [isRecording]);

  const stopRecording = useCallback(async (): Promise<ArrayBuffer | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      console.log('🛑 [WEB AUDIO] Parando gravação...');

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('📄 [WEB AUDIO] Blob criado:', audioBlob.size, 'bytes');
          
          // Converter para ArrayBuffer
          const arrayBuffer = await audioBlob.arrayBuffer();
          console.log('✅ [WEB AUDIO] ArrayBuffer criado:', arrayBuffer.byteLength, 'bytes');
          
          resolve(arrayBuffer);
        } catch (error) {
          console.error('❌ [WEB AUDIO] Erro ao processar áudio:', error);
          resolve(null);
        }
        
        // Cleanup
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      // Parar timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (levelTimerRef.current) {
        clearInterval(levelTimerRef.current);
        levelTimerRef.current = null;
      }
      
      // Parar todas as tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      console.log('✅ [WEB AUDIO] Gravação finalizada');
    });
  }, [isRecording]);

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    audioLevel
  };
};

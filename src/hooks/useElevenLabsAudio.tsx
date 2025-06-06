
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface AudioMessage {
  id: string;
  type: 'user' | 'assistant';
  audioBlob?: Blob;
  audioUrl?: string;
  timestamp: string;
  isPlaying?: boolean;
}

export const useElevenLabsAudio = () => {
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const ELEVENLABS_API_KEY = 'sk_9eb765fea090202fcc226bffc261d4b04b01c97013f4fcc3';
  const WEBHOOK_URL = 'https://api.elevenlabs.io/v1/convai/conversation/get_signed_url';

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
        processAudioWithElevenLabs(audioBlob);
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

  const processAudioWithElevenLabs = async (audioBlob: Blob) => {
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
      
      // Primeiro, transcrever o áudio
      const transcriptionResponse = await transcribeAudio(audioBlob);
      
      if (!transcriptionResponse) {
        throw new Error('Falha na transcrição do áudio');
      }
      
      // Enviar texto transcrito para ElevenLabs conversational AI
      const audioResponse = await sendToElevenLabsConversational(transcriptionResponse);
      
      if (audioResponse) {
        const assistantAudioUrl = URL.createObjectURL(audioResponse);
        const assistantMessage: AudioMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          audioBlob: audioResponse,
          audioUrl: assistantAudioUrl,
          timestamp: new Date().toISOString()
        };
        
        setAudioMessages(prev => [...prev, assistantMessage]);
        
        // Reproduzir automaticamente a resposta
        setTimeout(() => playAudio(assistantMessage), 500);
      }
      
    } catch (error: any) {
      console.error('Erro ao processar áudio:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Erro na transcrição: ${response.status}`);
      }
      
      const data = await response.json();
      return data.text || '';
      
    } catch (error) {
      console.error('Erro na transcrição:', error);
      return null;
    }
  };

  const sendToElevenLabsConversational = async (text: string): Promise<Blob | null> => {
    try {
      // Usar Text-to-Speech do ElevenLabs para gerar resposta em áudio
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/XB0fDUnXU5powFXDhCwa', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Você disse: "${text}". Esta é uma resposta de exemplo do ElevenLabs.`,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na geração de áudio: ${response.status}`);
      }
      
      return await response.blob();
      
    } catch (error) {
      console.error('Erro ao gerar áudio:', error);
      return null;
    }
  };

  const playAudio = async (message: AudioMessage) => {
    if (!message.audioUrl) return;
    
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
          setAudioMessages(prev => 
            prev.map(msg => 
              msg.id === message.id ? { ...msg, isPlaying: false } : msg
            )
          );
        };
        
        audio.onerror = () => {
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


import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AudioMessage {
  id: string;
  type: 'user' | 'assistant';
  transcription: string;
  response?: string;
  timestamp: string;
  isPlaying?: boolean;
}

export const useGeminiAudio = () => {
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        processRecording();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Erro ao iniciar gravação');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      console.log('Sending audio to Gemini processing...');
      
      // Send to our simplified Gemini function
      const { data, error } = await supabase.functions.invoke('process-audio-gemini-simple', {
        body: formData
      });
      
      if (error) throw error;
      
      console.log('Gemini response received:', data);
      
      // Add user audio message
      const userMessage: AudioMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        transcription: data.transcription || 'Áudio enviado',
        timestamp: new Date().toISOString()
      };
      
      // Add assistant response
      const assistantMessage: AudioMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        transcription: data.response || 'Resposta não disponível',
        timestamp: new Date().toISOString()
      };
      
      setAudioMessages(prev => [...prev, userMessage, assistantMessage]);
      
    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAudioMessages = () => {
    setAudioMessages([]);
  };

  return {
    audioMessages,
    isRecording,
    isProcessing,
    recordingTime,
    startRecording,
    stopRecording,
    clearAudioMessages
  };
};

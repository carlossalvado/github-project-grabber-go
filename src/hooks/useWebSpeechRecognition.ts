
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseWebSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  confidence: number;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export const useWebSpeechRecognition = (): UseWebSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Verificar se o navegador suporta Web Speech API
  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const initializeRecognition = useCallback(() => {
    if (!isSupported) {
      setError('Web Speech API não é suportada neste navegador');
      return null;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 [WEB SPEECH] Reconhecimento iniciado');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(result[0].confidence || 0);
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        console.log('✅ [WEB SPEECH] Transcrição:', finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ [WEB SPEECH] Erro:', event.error);
      setError(`Erro no reconhecimento: ${event.error}`);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast.error('Permissão do microfone negada');
      } else if (event.error === 'no-speech') {
        toast.error('Nenhuma fala detectada');
      } else {
        toast.error(`Erro: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log('🛑 [WEB SPEECH] Reconhecimento finalizado');
      setIsListening(false);
    };

    return recognition;
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    try {
      const recognition = initializeRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch (error) {
      console.error('❌ [WEB SPEECH] Erro ao iniciar:', error);
      toast.error('Erro ao iniciar reconhecimento de voz');
    }
  }, [isSupported, initializeRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error
  };
};

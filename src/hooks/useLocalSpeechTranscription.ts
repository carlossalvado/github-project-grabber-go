
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseLocalSpeechTranscriptionReturn {
  isListening: boolean;
  transcript: string;
  confidence: number;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => Promise<string>;
  resetTranscript: () => void;
  error: string | null;
}

export const useLocalSpeechTranscription = (): UseLocalSpeechTranscriptionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');

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
      console.log('🎤 [LOCAL SPEECH] Transcrição iniciada');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const resultText = result[0].transcript;
        
        if (result.isFinal) {
          finalText += resultText;
          setConfidence(result[0].confidence || 0);
          console.log('✅ [LOCAL SPEECH] Transcrição final:', resultText);
        } else {
          interimText += resultText;
          console.log('🔄 [LOCAL SPEECH] Transcrição provisória:', resultText);
        }
      }

      // Atualizar o texto acumulado
      if (finalText) {
        finalTranscriptRef.current += finalText;
        setTranscript(finalTranscriptRef.current);
        console.log('📝 [LOCAL SPEECH] Texto acumulado:', finalTranscriptRef.current);
      } else if (interimText) {
        // Mostrar texto provisório sem acumular
        setTranscript(finalTranscriptRef.current + interimText);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ [LOCAL SPEECH] Erro:', event.error);
      setError(`Erro no reconhecimento: ${event.error}`);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast.error('Permissão do microfone negada');
      } else if (event.error === 'no-speech') {
        console.log('⚠️ [LOCAL SPEECH] Nenhuma fala detectada - continuando...');
      } else {
        toast.error(`Erro de reconhecimento: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log('🛑 [LOCAL SPEECH] Reconhecimento finalizado');
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
        finalTranscriptRef.current = '';
        setTranscript('');
        recognition.start();
        console.log('🎙️ [LOCAL SPEECH] Iniciando reconhecimento...');
      }
    } catch (error) {
      console.error('❌ [LOCAL SPEECH] Erro ao iniciar:', error);
      toast.error('Erro ao iniciar reconhecimento de voz');
    }
  }, [isSupported, initializeRecognition]);

  const stopListening = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => {
          console.log('🛑 [LOCAL SPEECH] Reconhecimento finalizado');
          setIsListening(false);
          const finalText = finalTranscriptRef.current;
          console.log('🎯 [LOCAL SPEECH] Texto final capturado:', finalText);
          resolve(finalText);
        };
        
        recognitionRef.current.stop();
        recognitionRef.current = null;
        console.log('⏹️ [LOCAL SPEECH] Parando reconhecimento...');
      } else {
        resolve(finalTranscriptRef.current);
      }
    });
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
    finalTranscriptRef.current = '';
    console.log('🔄 [LOCAL SPEECH] Transcrição resetada');
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

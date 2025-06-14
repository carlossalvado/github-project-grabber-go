
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseLocalSpeechTranscriptionReturn {
  isListening: boolean;
  transcript: string;
  confidence: number;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export const useLocalSpeechTranscription = (): UseLocalSpeechTranscriptionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const resultText = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += resultText;
          setConfidence(result[0].confidence || 0);
          console.log('✅ [LOCAL SPEECH] Transcrição final:', resultText);
        } else {
          interimTranscript += resultText;
          console.log('🔄 [LOCAL SPEECH] Transcrição provisória:', resultText);
        }
      }

      if (finalTranscript) {
        setTranscript(prev => {
          const newTranscript = prev + finalTranscript;
          console.log('📝 [LOCAL SPEECH] Transcrição acumulada:', newTranscript);
          return newTranscript;
        });
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
        // Não mostrar erro para no-speech, é normal durante pausas
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
        setTranscript(''); // Limpar transcrição anterior
        recognition.start();
        console.log('🎙️ [LOCAL SPEECH] Iniciando reconhecimento...');
      }
    } catch (error) {
      console.error('❌ [LOCAL SPEECH] Erro ao iniciar:', error);
      toast.error('Erro ao iniciar reconhecimento de voz');
    }
  }, [isSupported, initializeRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      console.log('⏹️ [LOCAL SPEECH] Parando reconhecimento...');
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
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


import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, RotateCcw } from 'lucide-react';
import { useWebSpeechRecognition } from '@/hooks/useWebSpeechRecognition';
import { cn } from '@/lib/utils';

interface WebSpeechRecorderProps {
  onTranscriptChange: (transcript: string) => void;
  className?: string;
}

const WebSpeechRecorder: React.FC<WebSpeechRecorderProps> = ({
  onTranscriptChange,
  className
}) => {
  const {
    isListening,
    transcript,
    confidence,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useWebSpeechRecognition();

  React.useEffect(() => {
    onTranscriptChange(transcript);
  }, [transcript, onTranscriptChange]);

  if (!isSupported) {
    return (
      <div className={cn("text-center p-4", className)}>
        <p className="text-gray-500 text-sm">
          Reconhecimento de voz não é suportado neste navegador.
          <br />
          Tente usar Chrome, Edge ou Safari.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant={isListening ? "destructive" : "default"}
          size="icon"
          onClick={isListening ? stopListening : startListening}
          className={cn(
            "rounded-full",
            isListening && "animate-pulse"
          )}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={resetTranscript}
          disabled={!transcript}
          className="rounded-full"
        >
          <RotateCcw size={16} />
        </Button>

        <div className="flex-1 text-sm">
          {isListening && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Ouvindo...
            </div>
          )}
          
          {confidence > 0 && (
            <div className="text-gray-500">
              Confiança: {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
      </div>

      {transcript && (
        <div className="bg-gray-50 p-3 rounded-lg border">
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default WebSpeechRecorder;

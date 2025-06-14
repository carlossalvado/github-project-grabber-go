
import React from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppRecordingIndicatorProps {
  isRecording: boolean;
  isListening: boolean;
  isProcessing: boolean;
  recordingTime: number;
  audioLevel: number;
  transcript: string;
}

const WhatsAppRecordingIndicator: React.FC<WhatsAppRecordingIndicatorProps> = ({
  isRecording,
  isListening,
  isProcessing,
  recordingTime,
  audioLevel,
  transcript
}) => {
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (!isRecording && !isListening && !isProcessing) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-90 p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-500/50 min-w-80">
      
      {/* Processando resposta */}
      {isProcessing && (
        <>
          <div className="animate-spin mb-3">
            <Volume2 size={48} className="text-blue-500" />
          </div>
          <div className="text-white font-medium mb-2">
            Gerando resposta...
          </div>
          <div className="text-xs text-gray-300">
            Amazon Polly processando
          </div>
        </>
      )}

      {/* Gravando e transcrevendo */}
      {(isRecording || isListening) && !isProcessing && (
        <>
          <div className={cn(
            "mb-3",
            (isRecording && isListening) ? "animate-pulse" : ""
          )}>
            <Mic size={48} className="text-red-500" />
          </div>
          
          <div className="text-white font-medium mb-2">
            {formatRecordingTime(recordingTime)}
          </div>
          
          {/* Barra de nível de áudio */}
          <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-300 mb-3">
            Audio: {Math.round(audioLevel)}%
          </div>

          {/* Status da transcrição */}
          <div className="text-center">
            <div className={cn(
              "text-sm mb-2",
              isListening ? "text-green-400" : "text-yellow-400"
            )}>
              {isListening ? "🎤 Transcrevendo..." : "⏸️ Transcrição pausada"}
            </div>
            
            {/* Texto transcrito */}
            {transcript && (
              <div className="bg-gray-800 p-3 rounded-lg max-w-sm">
                <p className="text-white text-sm">{transcript}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WhatsAppRecordingIndicator;

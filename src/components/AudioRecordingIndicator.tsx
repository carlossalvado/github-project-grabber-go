
import React from 'react';
import { Mic } from 'lucide-react';

interface AudioRecordingIndicatorProps {
  isRecording: boolean;
  recordingTime: number;
  audioLevel: number;
  isProcessing: boolean;
}

const AudioRecordingIndicator: React.FC<AudioRecordingIndicatorProps> = ({
  isRecording,
  recordingTime,
  audioLevel,
  isProcessing
}) => {
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (!isRecording && !isProcessing) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 p-6 rounded-2xl flex flex-col items-center justify-center min-w-64">
      <div className="animate-pulse mb-3">
        <Mic size={48} className="text-red-500" />
      </div>
      
      {isRecording && (
        <>
          <div className="text-white font-medium mb-2">
            {formatRecordingTime(recordingTime)}
          </div>
          <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-red-500 transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
          <div className="text-xs text-gray-300">
            Gravando áudio...
          </div>
        </>
      )}
      
      {isProcessing && (
        <div className="text-white text-center">
          <div className="text-sm font-medium mb-2">Processando...</div>
          <div className="text-xs text-gray-300">
            Transcrevendo e gerando resposta
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecordingIndicator;

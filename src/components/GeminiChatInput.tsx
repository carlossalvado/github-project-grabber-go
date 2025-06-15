
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeminiChatInputProps {
  onSendMessage: (message: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
  isRecording?: boolean;
  recordingTime?: number;
}

const GeminiChatInput: React.FC<GeminiChatInputProps> = ({
  onSendMessage,
  onStartRecording,
  onStopRecording,
  disabled = false,
  isRecording = false,
  recordingTime = 0
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t bg-white p-4">
      {isRecording && (
        <div className="mb-2 flex items-center justify-center space-x-2 text-red-500">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            Gravando: {formatRecordingTime(recordingTime)}
          </span>
        </div>
      )}
      
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem para a ISA..."
            disabled={disabled || isRecording}
            className="min-h-[40px] max-h-32 resize-none"
            rows={1}
          />
        </div>
        
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="icon"
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={disabled}
            className={cn(
              "transition-colors",
              isRecording && "bg-red-50 border-red-200 text-red-600"
            )}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled || isRecording}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GeminiChatInput;


import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Smile, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  hasAudioFeature?: boolean;
  onEmoticonClick?: () => void;
  onGiftClick?: () => void;
  value?: string;
  onChange?: (value: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  hasAudioFeature = false,
  onEmoticonClick,
  onGiftClick,
  value = '',
  onChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSendMessage(value.trim());
      onChange?.('');
      
      // Focus the textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };
  
  const toggleRecording = () => {
    if (!hasAudioFeature) {
      toast.error("Recurso disponível apenas para assinantes");
      return;
    }
    
    setIsRecording(!isRecording);
    // Aqui poderia ser implementada a funcionalidade de gravação de áudio
  };

  return (
    <div className="bg-white border-t border-gray-100 px-2 py-3">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex items-center gap-1">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700 rounded-full flex-shrink-0"
            onClick={onEmoticonClick}
          >
            <Smile size={20} />
          </Button>

          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700 rounded-full flex-shrink-0"
            onClick={onGiftClick}
          >
            <Gift size={20} />
          </Button>
        </div>
        
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder="Digite sua mensagem..."
          className="min-h-12 resize-none flex-1 rounded-full px-4 focus-visible:ring-gray-400"
          disabled={disabled || isRecording}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        
        {hasAudioFeature && (
          <Button 
            type="button" 
            size="icon" 
            variant={isRecording ? "destructive" : "outline"} 
            className={`rounded-full flex-shrink-0 ${isRecording ? "animate-pulse" : ""}`}
            onClick={toggleRecording}
            disabled={disabled}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
        )}
        
        <Button 
          type="submit" 
          size="icon"
          disabled={!value.trim() || disabled || isRecording}
          className="rounded-full bg-black hover:bg-gray-800 flex-shrink-0"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;

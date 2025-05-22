
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Smile, Paperclip, Image, Video, Gift } from 'lucide-react';
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
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSendMessage(value.trim());
      onChange?.('');
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
  
  const handleFileUpload = (type: 'image' | 'video') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {isAttachmentOpen && (
        <div className="flex justify-start gap-2 p-2 border-b border-gray-100">
          <Button 
            type="button" 
            size="icon" 
            variant="outline"
            className="rounded-full"
            onClick={() => handleFileUpload('image')}
          >
            <Image size={18} />
          </Button>
          <Button 
            type="button" 
            size="icon" 
            variant="outline"
            className="rounded-full"
            onClick={() => handleFileUpload('video')}
          >
            <Video size={18} />
          </Button>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              // Implementar lógica de upload de arquivo
              console.log("Arquivo selecionado:", e.target.files?.[0]);
              setIsAttachmentOpen(false);
            }}
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end p-3 space-x-2">
        <div className="flex items-center gap-1">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700 rounded-full flex-shrink-0"
            onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
          >
            <Paperclip size={20} />
          </Button>
          
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
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full flex-shrink-0"
            onClick={onGiftClick}
          >
            <Gift size={20} />
          </Button>
        </div>
        
        <Textarea
          value={value}
          onChange={handleChange}
          placeholder="Digite sua mensagem..."
          className="min-h-12 resize-none flex-1 rounded-full px-4"
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
          className="rounded-full bg-gradient-sweet hover:bg-gradient-sweet/90 flex-shrink-0"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;

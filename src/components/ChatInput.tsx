import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Smile, Gift, Volume2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendAudioMessage?: (message: { content: string; audioData?: string }) => void;
  disabled?: boolean;
  hasAudioFeature?: boolean;
  onEmoticonClick?: () => void;
  onGiftClick?: () => void;
  value?: string;
  onChange?: (value: string) => void;
  enableN8nIntegration?: boolean;
  userEmail?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage,
  onSendAudioMessage,
  disabled = false,
  hasAudioFeature = false,
  onEmoticonClick,
  onGiftClick,
  value = '',
  onChange,
  enableN8nIntegration = false,
  userEmail = 'anonymous'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textWebhookUrl = "https://fghj789hjk.app.n8n.cloud/webhook/d97asdfasd39-ohasasdfasdd-5-pijaasdfadssd54-asasdfadsfd42";

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (!value.trim() || disabled || isLoading) return;

    const messageContent = value.trim();
    onChange?.('');
    
    if (enableN8nIntegration) {
      setIsLoading(true);
      
      try {
        console.log('Enviando mensagem de texto para n8n:', messageContent);
        
        // Enviar mensagem para o webhook do n8n
        const response = await fetch(textWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: messageContent,
            timestamp: new Date().toISOString(),
            user: userEmail
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erro na resposta: ${response.status} - ${response.statusText}`);
        }
        
        // Processar resposta do n8n
        let responseText = '';
        try {
          const responseData = await response.json();
          console.log('Resposta JSON do n8n:', responseData);
          
          if (responseData.message) {
            responseText = responseData.message;
          } else if (responseData.text) {
            responseText = responseData.text;
          } else if (responseData.response) {
            responseText = responseData.response;
          } else if (typeof responseData === 'string') {
            responseText = responseData;
          } else {
            responseText = JSON.stringify(responseData);
          }
        } catch (jsonError) {
          console.log('Resposta não é JSON, tratando como texto');
          responseText = await response.text();
        }
        
        // Enviar mensagem do usuário e resposta do n8n
        onSendMessage(messageContent);
        if (responseText) {
          setTimeout(() => {
            onSendMessage(responseText);
          }, 500);
        }
        
      } catch (error: any) {
        console.error('Erro ao enviar mensagem para n8n:', error);
        toast.error(`Erro ao processar mensagem: ${error.message}`);
        
        // Fallback - enviar apenas a mensagem do usuário
        onSendMessage(messageContent);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Comportamento original sem integração n8n
      onSendMessage(messageContent);
    }
    
    // Focus the textarea after sending
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };
  
  const toggleRecording = async () => {
    if (!hasAudioFeature) {
      toast.error("Recurso de áudio disponível apenas no Gemini Live");
      return;
    }
    
    toast.info("Use o botão de microfone do Gemini Live para áudio");
  };

  return (
    <div className="bg-white border-t border-gray-100 px-4 py-3 relative">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        {/* Plus button on the left */}
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          className="text-gray-500 hover:text-gray-700 rounded-full flex-shrink-0 w-10 h-10"
          disabled={isLoading}
        >
          <Plus size={20} />
        </Button>
        
        {/* Main input container with rounded background */}
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center space-x-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            placeholder="Digite uma mensagem ou use o áudio..."
            className="min-h-8 max-h-20 resize-none flex-1 bg-transparent border-0 px-0 py-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500"
            disabled={disabled || isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          {/* Action buttons inside the input */}
          <div className="flex items-center gap-1">
            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              className="text-gray-500 hover:text-gray-700 rounded-full flex-shrink-0 w-8 h-8"
              onClick={onEmoticonClick}
              disabled={isLoading}
            >
              <Smile size={16} />
            </Button>

            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              className="text-gray-500 hover:text-gray-700 rounded-full flex-shrink-0 w-8 h-8"
              onClick={onGiftClick}
              disabled={isLoading}
            >
              <Gift size={16} />
            </Button>

            {hasAudioFeature && (
              <Button 
                type="button" 
                size="icon" 
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 rounded-full flex-shrink-0 w-8 h-8"
                onClick={toggleRecording}
                disabled={disabled || isLoading}
              >
                <Mic size={16} />
              </Button>
            )}
            
            <Button 
              type="submit" 
              size="icon"
              disabled={!value.trim() || disabled || isLoading}
              className="rounded-full bg-blue-600 hover:bg-blue-700 flex-shrink-0 w-8 h-8"
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
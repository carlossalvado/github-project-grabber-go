import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Smile, Gift, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWebAudioRecorder } from '@/hooks/useWebAudioRecorder';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

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
  const audioWebhookUrl = "https://fghj789hjk.app.n8n.cloud/webhook/aud6345345io-chggsdfat-gemi465ni-gdgfg456";

  // Gravação de áudio para N8N
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    audioLevel
  } = useWebAudioRecorder();

  const handleSubmit = async (e: React.FormEvent) => {
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
      toast.error("Recurso disponível apenas para assinantes");
      return;
    }
    
    if (isRecording) {
      console.log('🛑 [AUDIO] Parando gravação...');
      const audioData = await stopRecording();
      if (audioData && onSendAudioMessage) {
        console.log('🎤 [CHAT INPUT] Enviando áudio para N8N...');
        await sendAudioToN8n(audioData);
      }
    } else {
      console.log('🎤 [AUDIO] Iniciando gravação...');
      await startRecording();
    }
  };

  const sendAudioToN8n = async (audioData: ArrayBuffer) => {
    if (!onSendAudioMessage) return;
    
    try {
      setIsLoading(true);
      
      // Converter ArrayBuffer para base64
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      
      const response = await fetch(audioWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'audio',
          audioData: base64Audio,
          timestamp: new Date().toISOString(),
          user: userEmail
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar áudio para N8N: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔊 [AUDIO] Resposta de áudio do N8N:', data);
      
      // Enviar mensagem de áudio
      onSendAudioMessage({
        content: data.response || data.message || 'Resposta de áudio processada',
        audioData: data.audioData || data.audioResponse
      });
      
    } catch (error: any) {
      console.error('❌ [AUDIO] Erro ao enviar áudio:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="bg-white border-t border-gray-100 px-2 py-3 relative">
      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-0 left-0 right-0 bg-red-50 border-b border-red-200 p-2 flex items-center justify-center gap-2">
          <div className="animate-pulse">
            <Mic size={16} className="text-red-500" />
          </div>
          <span className="text-sm text-red-600 font-medium">
            Gravando: {formatRecordingTime(recordingTime)}
          </span>
          <div className="w-16 h-1 bg-red-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex items-center gap-1">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700 rounded-full flex-shrink-0"
            onClick={onEmoticonClick}
            disabled={isLoading || isRecording}
          >
            <Smile size={20} />
          </Button>

          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700 rounded-full flex-shrink-0"
            onClick={onGiftClick}
            disabled={isLoading || isRecording}
          >
            <Gift size={20} />
          </Button>
        </div>
        
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={isRecording ? "Gravando áudio..." : "Digite sua mensagem..."}
          className="min-h-12 resize-none flex-1 rounded-full px-4 focus-visible:ring-gray-400"
          disabled={disabled || isRecording || isLoading}
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
            disabled={disabled || isLoading}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
        )}
        
        <Button 
          type="submit" 
          size="icon"
          disabled={!value.trim() || disabled || isRecording || isLoading}
          className="rounded-full bg-black hover:bg-gray-800 flex-shrink-0"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;

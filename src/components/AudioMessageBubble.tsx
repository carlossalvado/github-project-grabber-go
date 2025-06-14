
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Play, Pause, Mic } from 'lucide-react';
import { AudioMessage } from '@/hooks/useAudioMessage';

interface AudioMessageBubbleProps {
  message: AudioMessage;
  onPlayAudio: (messageId: string) => void;
  agentAvatar?: string;
  agentName?: string;
  userEmail?: string;
}

const AudioMessageBubble: React.FC<AudioMessageBubbleProps> = ({
  message,
  onPlayAudio,
  agentAvatar,
  agentName = "AI",
  userEmail
}) => {
  const isUser = message.type === 'user';
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className={cn(
      'flex mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
          {agentAvatar ? (
            <AvatarImage src={agentAvatar} alt={agentName} />
          ) : (
            <AvatarFallback className="bg-purple-600 text-white">
              {agentName.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
      )}

      <div className="max-w-[70%] space-y-1">
        <div className={cn(
          'px-4 py-3 rounded-2xl shadow-md',
          isUser 
            ? 'bg-purple-600 text-white rounded-br-none' 
            : 'bg-gray-700 text-white rounded-bl-none'
        )}>
          {/* Controle de áudio estilo WhatsApp */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full flex-shrink-0',
                isUser 
                  ? 'text-white hover:bg-purple-700' 
                  : 'text-white hover:bg-gray-600'
              )}
              onClick={() => onPlayAudio(message.id)}
            >
              {message.isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </Button>

            <div className="flex-1 flex items-center gap-2">
              <Mic size={14} className="opacity-70" />
              
              {/* Barra de onda sonora simulada */}
              <div className="flex-1 flex items-center gap-1 h-6">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1 bg-current rounded-full transition-all duration-75',
                      message.isPlaying 
                        ? `h-${Math.floor(Math.random() * 4) + 2} animate-pulse`
                        : 'h-2 opacity-50'
                    )}
                    style={{
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>

              <span className="text-xs opacity-70 min-w-fit">
                {formatDuration(message.duration)}
              </span>
            </div>
          </div>

          {/* Transcrição do áudio */}
          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
            <p className="text-sm opacity-90">{message.content}</p>
          </div>
        </div>
        
        <div className={cn(
          'text-xs text-gray-500 mt-1',
          isUser ? 'text-right' : 'text-left'
        )}>
          {formatTime(message.timestamp)}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
          <AvatarFallback className="bg-blue-600 text-white">
            {userEmail?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default AudioMessageBubble;


import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Play, Pause, Mic, VolumeX } from 'lucide-react';
import { GeminiAudioMessage } from '@/hooks/useGeminiLiveAudio';

interface GeminiAudioBubbleProps {
  message: GeminiAudioMessage;
  onPlayAudio: (messageId: string) => void;
  agentAvatar?: string;
  agentName?: string;
  userEmail?: string;
}

const GeminiAudioBubble: React.FC<GeminiAudioBubbleProps> = ({
  message,
  onPlayAudio,
  agentAvatar,
  agentName = "ISA",
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
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const hasAudio = !!message.audioData;

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
            ? 'bg-green-500 text-white rounded-br-none' 
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        )}>
          {/* Controle de áudio */}
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full flex-shrink-0',
                isUser 
                  ? 'text-white hover:bg-green-600' 
                  : 'text-gray-700 hover:bg-gray-300'
              )}
              onClick={() => onPlayAudio(message.id)}
              disabled={!hasAudio}
            >
              {!hasAudio ? (
                <VolumeX size={16} />
              ) : message.isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </Button>

            <div className="flex-1 flex items-center gap-2">
              <Mic size={14} className="opacity-70" />
              
              {/* Barra de onda sonora */}
              <div className="flex-1 flex items-center gap-1 h-6">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1 bg-current rounded-full transition-all duration-75',
                      message.isPlaying && hasAudio
                        ? `h-${Math.floor(Math.random() * 4) + 2} animate-pulse`
                        : 'h-2 opacity-50'
                    )}
                    style={{
                      animationDelay: `${i * 50}ms`,
                      height: !hasAudio ? '8px' : undefined
                    }}
                  />
                ))}
              </div>

              <span className="text-xs opacity-70 min-w-fit">
                {formatDuration(message.duration)}
              </span>
            </div>
          </div>

          {/* Conteúdo da mensagem */}
          <div className={cn(
            'pt-2 border-t border-current border-opacity-20',
            isUser ? 'border-white' : 'border-gray-400'
          )}>
            <p className="text-sm opacity-90">{message.content}</p>
            {!hasAudio && (
              <p className="text-xs opacity-60 mt-1">
                {isUser ? 'Áudio gravado' : 'Processando áudio...'}
              </p>
            )}
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

export default GeminiAudioBubble;

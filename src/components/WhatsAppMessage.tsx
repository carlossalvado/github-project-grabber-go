import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface WhatsAppMessageProps {
  id: string;
  content?: string;
  audioUrl?: string;
  imageUrl?: string;
  isUser: boolean;
  timestamp: Date | string;
  isPlaying?: boolean;
  onPlayAudio?: (messageId: string, audioUrl: string) => void;
  onImageClick?: (imageUrl: string, title: string) => void;
  agentData?: {
    id: string;
    name: string;
    avatar_url: string;
  };
  userEmail?: string;
  userAvatarUrl?: string;
  className?: string;
}

const WhatsAppMessage: React.FC<WhatsAppMessageProps> = ({
  id,
  content,
  audioUrl,
  imageUrl,
  isUser,
  timestamp,
  isPlaying,
  onPlayAudio,
  onImageClick,
  agentData,
  userEmail,
  userAvatarUrl,
  className
}) => {
  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserInitials = () => {
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Estilos WhatsApp
  const messageContainerClasses = cn(
    'flex mb-2 max-w-[85%] items-end gap-2',
    isUser ? 'ml-auto justify-end flex-row-reverse' : 'mr-auto justify-start',
    className
  );

  const bubbleClasses = cn(
    'relative px-3 py-2 rounded-2xl shadow-sm',
    isUser 
      ? 'bg-gradient-isa text-white rounded-br-sm'
      : 'bg-isa-card text-isa-light border border-purple-800/30 rounded-bl-sm'
  );

  const timestampClasses = cn(
    'text-xs mt-1 opacity-70',
    isUser ? 'text-white/70' : 'text-isa-muted'
  );

  return (
    <div className={messageContainerClasses}>
      {/* Avatar - apenas no primeiro lado */}
      {!isUser && agentData && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
          <AvatarFallback className="bg-purple-600 text-white text-sm">
            {agentData.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          {userAvatarUrl ? (
            <AvatarImage src={userAvatarUrl} alt="Você" />
          ) : (
            <AvatarFallback className="bg-gradient-isa text-white text-sm">
              {getUserInitials()}
            </AvatarFallback>
          )}
        </Avatar>
      )}

      <div className="flex flex-col min-w-0">
        <div className={bubbleClasses}>
          {/* Imagem */}
          {imageUrl && (
            <div className="mb-2 rounded-lg overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Foto compartilhada" 
                className="max-w-[250px] h-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onImageClick?.(imageUrl, 'Foto Exclusiva')}
              />
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="flex items-center gap-3 mb-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPlayAudio?.(id, audioUrl)}
                className={cn(
                  'p-2 rounded-full w-8 h-8',
                  isUser 
                    ? 'hover:bg-white/20 text-white' 
                    : 'hover:bg-purple-500/20 text-purple-300'
                )}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </Button>
              
              <div className="flex-1 min-w-[120px]">
                <div className={cn(
                  'w-full h-1 rounded-full',
                  isUser ? 'bg-white/30' : 'bg-purple-500/30'
                )}>
                  <div className={cn(
                    'w-1/3 h-full rounded-full',
                    isUser ? 'bg-white' : 'bg-purple-400'
                  )}></div>
                </div>
              </div>
            </div>
          )}

          {/* Texto */}
          {content && content.trim() && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          )}

          {/* Timestamp dentro da bolha */}
          <div className={cn(timestampClasses, 'text-right mt-1')}>
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessage;
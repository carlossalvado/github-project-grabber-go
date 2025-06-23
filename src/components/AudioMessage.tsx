
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface AudioMessageProps {
  id: string;
  content: string;
  audioUrl?: string;
  isUser: boolean;
  timestamp: string;
  isPlaying: boolean;
  onPlayAudio: (messageId: string, audioUrl: string) => void;
  onAvatarClick?: (imageUrl: string, name: string) => void;
  agentData?: {
    id: string;
    name: string;
    avatar_url: string;
  };
  userEmail?: string;
  userAvatarUrl?: string;
}

const AudioMessage: React.FC<AudioMessageProps> = ({
  id,
  content,
  audioUrl,
  isUser,
  timestamp,
  isPlaying,
  onPlayAudio,
  onAvatarClick,
  agentData,
  userEmail,
  userAvatarUrl
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
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

  const handleAvatarClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (isUser && userAvatarUrl && onAvatarClick) {
      onAvatarClick(userAvatarUrl, 'Você');
    } else if (!isUser && agentData?.avatar_url && onAvatarClick) {
      onAvatarClick(agentData.avatar_url, agentData.name);
    }
  };

  // Não renderizar nada se não há áudio e nem conteúdo de texto
  if (!audioUrl && !content.trim()) {
    return null;
  }

  return (
    <div className={cn(
      'flex mb-4 max-w-[80%]',
      isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
    )}>
      {/* Avatar do agente - mostrar apenas se for mensagem do assistente à esquerda */}
      {!isUser && agentData && (
        <div className="mr-2 flex-shrink-0">
          <Avatar className="h-8 w-8 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-purple-600 text-white text-sm">
              {agentData.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className={cn(
        'flex flex-col gap-2',
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* Audio Player */}
        {audioUrl && (
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-2xl min-w-[200px]',
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-[#2F3349] text-white border border-blue-800/30'
          )}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPlayAudio(id, audioUrl)}
              className={cn(
                'p-1 rounded-full',
                isUser 
                  ? 'hover:bg-blue-700 text-white' 
                  : 'hover:bg-blue-900/50 text-blue-200'
              )}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            
            <div className="flex-1">
              <div className="w-full h-1 bg-white bg-opacity-30 rounded-full">
                <div className="w-1/3 h-full bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {/* Text Content - apenas se há conteúdo */}
        {content.trim() && (
          <div className={cn(
            'px-4 py-3 rounded-2xl max-w-full',
            isUser 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-[#2F3349] text-white border border-blue-800/30 rounded-bl-md'
          )}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        )}

        {/* Timestamp */}
        <div className={cn(
          'text-xs text-blue-400 px-1',
          isUser ? 'text-right' : 'text-left'
        )}>
          {formatTime(timestamp)}
        </div>
      </div>

      {/* Avatar do usuário - mostrar apenas se for mensagem do usuário à direita */}
      {isUser && (
        <div className="ml-2 flex-shrink-0">
          <Avatar className="h-8 w-8 cursor-pointer" onClick={handleAvatarClick}>
            {userAvatarUrl ? (
              <AvatarImage src={userAvatarUrl} alt="Você" />
            ) : (
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {getUserInitials()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      )}
    </div>
  );
};

export default AudioMessage;

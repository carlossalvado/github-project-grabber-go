
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioMessageProps {
  id: string;
  content: string;
  audioUrl?: string;
  isUser: boolean;
  timestamp: string;
  isPlaying?: boolean;
  onPlayAudio: (messageId: string, audioUrl: string) => void;
  agentData?: {
    name: string;
    avatar_url: string;
  };
  userEmail?: string;
}

const AudioMessage: React.FC<AudioMessageProps> = ({
  id,
  content,
  audioUrl,
  isUser,
  timestamp,
  isPlaying = false,
  onPlayAudio,
  agentData,
  userEmail
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
          <AvatarImage src={agentData?.avatar_url} alt={agentData?.name} />
          <AvatarFallback className="bg-purple-600 text-white">
            {agentData?.name?.charAt(0) || 'I'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="max-w-[70%] space-y-1">
        <div className={cn(
          'px-4 py-3 rounded-2xl shadow-md',
          isUser 
            ? 'bg-purple-600 text-white rounded-br-none' 
            : 'bg-gray-700 text-white rounded-bl-none'
        )}>
          {/* Audio controls */}
          {audioUrl && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-black/20 rounded-lg">
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-white hover:bg-white/20"
                onClick={() => onPlayAudio(id, audioUrl)}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              
              <div className="flex items-center gap-1 flex-1">
                <Volume2 size={14} className="opacity-70" />
                <div className="flex-1 bg-white/20 h-1 rounded-full">
                  <div className={cn(
                    "h-full bg-white rounded-full transition-all duration-300",
                    isPlaying ? "w-full animate-pulse" : "w-0"
                  )} />
                </div>
              </div>
              
              <span className="text-xs opacity-70">Áudio</span>
            </div>
          )}
          
          {/* Message content */}
          <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(timestamp)}
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

export default AudioMessage;

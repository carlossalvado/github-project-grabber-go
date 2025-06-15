
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { GeminiChatMessage } from '@/hooks/useGeminiLiveChat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GeminiChatBubbleProps {
  message: GeminiChatMessage;
  onPlayAudio?: (messageId: string) => void;
}

const GeminiChatBubble: React.FC<GeminiChatBubbleProps> = ({ 
  message, 
  onPlayAudio 
}) => {
  const isUser = message.type === 'user';
  const hasAudio = !!message.audioData;

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const renderAudioControls = () => {
    if (!hasAudio || !onPlayAudio) return null;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPlayAudio(message.id)}
        className="p-1 h-8 w-8 rounded-full"
        disabled={message.isPlaying}
      >
        {message.isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    );
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-end space-x-2 max-w-[70%]">
          <div className="flex flex-col">
            <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-br-md">
              <div className="flex items-center justify-between">
                <p className="text-sm break-words">
                  {message.content}
                </p>
                {hasAudio && (
                  <div className="ml-2 flex items-center space-x-1">
                    <Volume2 className="h-3 w-3 opacity-70" />
                    {renderAudioControls()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1 text-right">
              {formatTime(message.timestamp)}
            </span>
          </div>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-blue-500 text-white text-xs">
              U
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-end space-x-2 max-w-[70%]">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src="/lovable-uploads/fcaaca87-0b2e-46a9-9679-25e095ad9400.png" alt="ISA" />
          <AvatarFallback className="bg-pink-500 text-white text-xs">
            ISA
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="bg-gray-100 text-gray-900 p-3 rounded-2xl rounded-bl-md">
            <div className="flex items-center justify-between">
              <p className="text-sm break-words">
                {message.content}
              </p>
              {hasAudio && (
                <div className="ml-2 flex items-center space-x-1">
                  <Volume2 className="h-3 w-3 opacity-70" />
                  {renderAudioControls()}
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-500 mt-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GeminiChatBubble;

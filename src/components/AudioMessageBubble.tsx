
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Mic } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AudioMessage {
  id: string;
  type: 'user' | 'assistant';
  audioBlob?: Blob;
  audioUrl?: string;
  timestamp: string;
  isPlaying?: boolean;
}

interface AudioMessageBubbleProps {
  message: AudioMessage;
  onPlayAudio: (message: AudioMessage) => void;
  agentAvatar?: string;
  agentName?: string;
  userEmail?: string;
}

export const AudioMessageBubble: React.FC<AudioMessageBubbleProps> = ({
  message,
  onPlayAudio,
  agentAvatar = 'https://i.imgur.com/nV9pbvg.jpg',
  agentName = 'Isa',
  userEmail
}) => {
  const isUserMessage = message.type === 'user';
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUserMessage && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
          <AvatarImage src={agentAvatar} alt={agentName} />
          <AvatarFallback className="bg-purple-600 text-white">
            {agentName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="max-w-[70%] space-y-1">
        <div className={`px-4 py-3 rounded-2xl shadow-md ${
          isUserMessage 
            ? 'bg-purple-600 text-white rounded-br-none' 
            : 'bg-gray-700 text-white rounded-bl-none'
        }`}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isUserMessage ? 'text-white' : 'text-white'}`}
              onClick={() => onPlayAudio(message)}
            >
              {message.isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </Button>
            <Mic size={16} className="opacity-70" />
            <span className="text-xs opacity-70">Mensagem de áudio</span>
          </div>
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isUserMessage ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>

      {isUserMessage && (
        <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
          <AvatarFallback className="bg-blue-600 text-white">
            {userEmail?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

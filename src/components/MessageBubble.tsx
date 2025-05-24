
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  isGift?: boolean;
  giftId?: string;
  giftEmoji?: string;
}

interface MessageBubbleProps {
  message: Message;
  className?: string;
  agentAvatar?: string;
  agentName?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  className,
  agentAvatar,
  agentName = "AI"
}) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  
  if (isSystem && message.isGift) {
    return (
      <div className={cn('flex justify-center my-6', className)}>
        <div className="relative">
          {/* Animated gift emoji with effects */}
          <div className="text-8xl animate-bounce drop-shadow-2xl">
            {message.giftEmoji || '🎁'}
          </div>
          
          {/* Sparkle effects around the gift */}
          <div className="absolute -top-2 -left-2 text-2xl animate-pulse text-yellow-400">✨</div>
          <div className="absolute -top-1 -right-2 text-xl animate-pulse text-pink-400" style={{ animationDelay: '0.5s' }}>💫</div>
          <div className="absolute -bottom-1 -left-1 text-lg animate-pulse text-purple-400" style={{ animationDelay: '1s' }}>⭐</div>
          <div className="absolute -bottom-2 -right-1 text-2xl animate-pulse text-blue-400" style={{ animationDelay: '1.5s' }}>✨</div>
          
          {/* Floating hearts */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-ping text-red-400">❤️</div>
        </div>
      </div>
    );
  }
  
  if (isSystem) {
    return (
      <div className={cn('flex justify-center my-4', className)}>
        <div className="bg-gray-100 px-4 py-2 rounded text-gray-600 text-sm">
          {message.content}
        </div>
      </div>
    );
  }
  
  // Format the timestamp in a more readable format
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit'
  });
  
  return (
    <div
      className={cn(
        'flex mb-4',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
          {agentAvatar ? (
            <AvatarImage src={agentAvatar} alt={agentName} />
          ) : (
            <AvatarFallback className="bg-black text-white">
              {agentName.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
      )}
      
      <div
        className={cn(
          'py-3 px-4 rounded-3xl max-w-[75%]',
          isUser
            ? 'bg-black text-white rounded-br-none'
            : 'bg-gray-100 text-black rounded-bl-none'
        )}
      >
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        <div
          className={cn(
            'text-xs mt-1',
            isUser ? 'text-gray-300' : 'text-gray-500'
          )}
        >
          {formattedTime}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
          <AvatarFallback className="bg-gray-300 text-gray-600">
            EU
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default MessageBubble;


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
  
  if (isSystem) {
    return (
      <div className={cn('flex justify-center my-4', className)}>
        {message.isGift ? (
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-4 max-w-md text-center">
            <div className="text-pink-600 font-medium">{message.content}</div>
            <div className="mt-2">
              <div className="w-16 h-16 mx-auto bg-pink-200 rounded-full flex items-center justify-center">
                <span role="img" aria-label="gift" className="text-3xl">{message.giftEmoji || '🎁'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 px-4 py-2 rounded text-gray-600 text-sm">
            {message.content}
          </div>
        )}
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

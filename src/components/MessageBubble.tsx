
import React from 'react';
import { cn } from '@/lib/utils';

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
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, className }) => {
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
  
  return (
    <div
      className={cn(
        'flex mb-4',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-sweet flex-shrink-0 flex items-center justify-center mr-2">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      )}
      
      <div
        className={cn(
          'py-2 px-4 rounded-2xl max-w-[80%]',
          isUser
            ? 'bg-gradient-sweet text-white rounded-tr-none'
            : 'bg-white shadow-sm rounded-tl-none'
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div
          className={cn(
            'text-xs mt-1',
            isUser ? 'text-pink-100' : 'text-gray-400'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {isUser && (
        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center ml-2">
          <span className="text-gray-600 text-xs font-bold">EU</span>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;

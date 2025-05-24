import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Video, Mic, Send, Smile, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import EmoticonSelector from '@/components/EmoticonSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModernMessage {
  id: string;
  content: string;
  sender: 'user' | 'contact';
  timestamp: Date;
  type: 'text' | 'image' | 'audio' | 'gift';
  images?: string[];
  audioDuration?: string;
  giftId?: string;
  giftName?: string;
  giftEmoji?: string;
}

const ChatBasicPage = () => {
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const isMobile = useIsMobile();
  
  const contactName = "Charlotte";
  const contactAvatar = "https://i.imgur.com/placeholder-woman.jpg";
  const [messages, setMessages] = useState<ModernMessage[]>([]);
  const planName = "Plano Básico";

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={contactAvatar} alt={contactName} />
            <AvatarFallback className="bg-purple-600 text-white">
              {contactName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-lg">{contactName}</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 px-3 py-1 rounded-full">
            <span className="text-xs font-medium text-white">{planName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 cursor-not-allowed"
              disabled
            >
              <Phone size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 cursor-not-allowed"
              disabled
            >
              <Video size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages - Basic text only */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center text-gray-400">
                  <p className="text-lg mb-2">Comece uma conversa!</p>
                  <p className="text-sm">Digite uma mensagem para {contactName}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                    Hoje
                  </span>
                </div>
                {/* Basic message rendering */}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input area - Basic features only */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send message ..."
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12 rounded-full"
              disabled={isLoading}
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-gray-400 cursor-not-allowed"
            disabled
          >
            <Smile size={20} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-gray-400 cursor-not-allowed"
            disabled
          >
            <Gift size={20} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-gray-400 cursor-not-allowed"
            disabled
          >
            <Mic size={20} />
          </Button>
          
          <Button
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full flex-shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBasicPage;
